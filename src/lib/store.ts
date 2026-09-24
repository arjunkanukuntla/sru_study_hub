import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Subject, Paper, Resource, Unit, Topic, LabExperiment, VivaQuestion } from '@/data/catalog'
import {
  INITIAL_SUBJECTS, INITIAL_PAPERS, INITIAL_RESOURCES,
  INITIAL_UNITS, INITIAL_TOPICS, INITIAL_LAB_EXPERIMENTS,
  INITIAL_VIVA_QUESTIONS
} from '@/data/catalog'
import {
  fetchCloudData,
  syncPaperToCloud,
  syncResourceToCloud,
  syncSubjectToCloud,
  mapPaperRow,
  mapResourceRow,
} from './supabaseSync'

import { supabase } from './supabase'

interface AppState {
  subjects: Subject[]
  papers: Paper[]
  resources: Resource[]
  units: Unit[]
  topics: Topic[]
  labExperiments: LabExperiment[]
  vivaQuestions: VivaQuestion[]
  isCloudLoaded: boolean

  // Actions
  initCloudSync: () => Promise<void>
  addPaper: (paper: Omit<Paper, 'id'> & { id?: string }) => Paper
  addResource: (resource: Omit<Resource, 'id'> & { id?: string }) => Resource
  addSubject: (subject: Omit<Subject, 'id'> & { id?: string }) => Subject
  findOrCreateSubject: (name: string, branchId: string, semesterId?: string, type?: 'theory' | 'lab' | 'both') => Subject
}

let realtimeSubscribed = false

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      subjects: INITIAL_SUBJECTS,
      papers: INITIAL_PAPERS,
      resources: INITIAL_RESOURCES,
      units: INITIAL_UNITS,
      topics: INITIAL_TOPICS,
      labExperiments: INITIAL_LAB_EXPERIMENTS,
      vivaQuestions: INITIAL_VIVA_QUESTIONS,
      isCloudLoaded: false,

      initCloudSync: async () => {
        try {
          // ── 1. Full authoritative fetch from Supabase ──────────────────────
          const cloud = await fetchCloudData()
          console.log(`☁️ Cloud sync: ${cloud.papers.length} papers, ${cloud.resources.length} resources, ${cloud.subjects.length} subjects`)

          set((state) => {
            // Subjects: merge cloud into initial, cloud wins on conflict
            const builtInSubIds = new Set(INITIAL_SUBJECTS.map(s => s.id))
            const cloudSubIds = new Set(cloud.subjects.map(s => s.id))
            const builtInsNotInCloud = state.subjects.filter(s => builtInSubIds.has(s.id) && !cloudSubIds.has(s.id))

            // Papers: use ONLY cloud papers with real CDN URLs; keep local papers that have real URLs too
            const cloudPaperIds = new Set(cloud.papers.map(p => p.id))
            const localRealPapers = state.papers.filter(
              p => !cloudPaperIds.has(p.id) && p.file_url && !p.file_url.startsWith('data:')
            )

            // Resources: same strategy
            const cloudResIds = new Set(cloud.resources.map(r => r.id))
            const localRealResources = state.resources.filter(
              r => !cloudResIds.has(r.id) && r.file_url && !r.file_url.startsWith('data:')
            )

            return {
              subjects: [...builtInsNotInCloud, ...cloud.subjects],
              papers: [...cloud.papers, ...localRealPapers],
              resources: [...cloud.resources, ...localRealResources],
              isCloudLoaded: true,
            }
          })

          // ── 2. Realtime listeners (subscribe once) ─────────────────────────
          if (realtimeSubscribed) return
          realtimeSubscribed = true

          // Papers
          supabase
            .channel('realtime:papers')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'papers' }, (payload) => {
              const p: any = payload.new
              if (!p || !p.file_url || p.file_url.startsWith('data:')) return
              const newPaper = mapPaperRow(p)
              console.log('🔔 Realtime: new paper', newPaper.id)
              set((state) => ({
                papers: [newPaper, ...state.papers.filter(item => item.id !== newPaper.id)]
              }))
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'papers' }, (payload) => {
              const p: any = payload.new
              if (!p || !p.file_url || p.file_url.startsWith('data:')) return
              const updated = mapPaperRow(p)
              set((state) => ({
                papers: state.papers.map(item => item.id === updated.id ? updated : item)
              }))
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'papers' }, (payload) => {
              const id = payload.old?.id
              if (id) set((state) => ({ papers: state.papers.filter(item => item.id !== id) }))
            })
            .subscribe((status) => {
              console.log('📡 Realtime papers channel:', status)
            })

          // Resources
          supabase
            .channel('realtime:resources')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'resources' }, (payload) => {
              const r: any = payload.new
              if (!r || !r.file_url || r.file_url.startsWith('data:')) return
              const newResource = mapResourceRow(r)
              console.log('🔔 Realtime: new resource', newResource.id)
              set((state) => ({
                resources: [newResource, ...state.resources.filter(item => item.id !== newResource.id)]
              }))
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'resources' }, (payload) => {
              const r: any = payload.new
              if (!r || !r.file_url || r.file_url.startsWith('data:')) return
              const updated = mapResourceRow(r)
              set((state) => ({
                resources: state.resources.map(item => item.id === updated.id ? updated : item)
              }))
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'resources' }, (payload) => {
              const id = payload.old?.id
              if (id) set((state) => ({ resources: state.resources.filter(item => item.id !== id) }))
            })
            .subscribe((status) => {
              console.log('📡 Realtime resources channel:', status)
            })

          // Subjects
          supabase
            .channel('realtime:subjects')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'subjects' }, (payload) => {
              const s: any = payload.new
              if (!s) return
              const newSub: Subject = {
                id: s.id,
                name: s.name,
                code: s.code || 'SUB101',
                branch_id: s.branch_id || 'cse',
                semester_id: s.semester_id || 'sem1',
                credits: s.credits || 3,
                type: s.type || s.subject_type || 'theory',
                units_count: s.units_count || 5,
              }
              console.log('🔔 Realtime: new subject', newSub.id)
              set((state) => ({
                subjects: [...state.subjects.filter(item => item.id !== newSub.id), newSub]
              }))
            })
            .subscribe((status) => {
              console.log('📡 Realtime subjects channel:', status)
            })

        } catch (err) {
          console.warn('Could not initialize Supabase cloud sync:', err)
        }
      },

      addPaper: (paperData) => {
        const id = paperData.id || `paper-${Date.now()}`
        const newPaper: Paper = {
          ...paperData,
          id,
          verification_status: 'verified',
        }
        set((state) => ({
          papers: [newPaper, ...state.papers.filter(p => p.id !== id)],
        }))
        // Only sync if we have a real URL (storage upload already done in UploadPage)
        if (newPaper.file_url && !newPaper.file_url.startsWith('data:')) {
          syncPaperToCloud(newPaper)
        }
        return newPaper
      },

      addResource: (resourceData) => {
        const id = resourceData.id || `res-${Date.now()}`
        const newResource: Resource = {
          ...resourceData,
          id,
          verification_status: 'verified',
        }
        set((state) => ({
          resources: [newResource, ...state.resources.filter(r => r.id !== id)],
        }))
        // Only sync if we have a real URL
        if (newResource.file_url && !newResource.file_url.startsWith('data:')) {
          syncResourceToCloud(newResource)
        }
        return newResource
      },

      addSubject: (subjectData) => {
        const id = subjectData.id || `sub-${Date.now()}`
        const newSubject: Subject = {
          ...subjectData,
          id,
        }
        set((state) => ({
          subjects: [...state.subjects.filter(s => s.id !== id), newSubject],
        }))
        syncSubjectToCloud(newSubject)
        return newSubject
      },

      findOrCreateSubject: (name, branchId, semesterId = 'sem1', type = 'theory') => {
        const cleanName = name.trim()
        const existing = get().subjects.find(
          (s) => s.name.toLowerCase() === cleanName.toLowerCase()
        )
        if (existing) return existing

        const code = cleanName.split(' ').map((w) => w[0]?.toUpperCase() || '').join('').slice(0, 4) + '101'
        const newSub: Subject = {
          id: `sub-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
          name: cleanName,
          code,
          branch_id: branchId || 'cse',
          semester_id: semesterId || 'sem1',
          credits: 3,
          type: type || 'theory',
          units_count: 5,
        }
        set((state) => ({ subjects: [...state.subjects, newSub] }))
        syncSubjectToCloud(newSub)
        return newSub
      },
    }),
    {
      name: 'sru_study_hub_v700',
      // Only persist lightweight data — no file_url blobs
      partialize: (state) => ({
        subjects: state.subjects,
        // Only keep papers/resources with real CDN URLs in localStorage
        papers: state.papers.filter(p => p.file_url && !p.file_url.startsWith('data:')),
        resources: state.resources.filter(r => r.file_url && !r.file_url.startsWith('data:')),
        units: state.units,
        topics: state.topics,
        labExperiments: state.labExperiments,
        vivaQuestions: state.vivaQuestions,
        isCloudLoaded: false, // always refetch on reload
      }),
    }
  )
)
