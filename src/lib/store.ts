import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Subject, Paper, Resource, Unit, Topic, LabExperiment, VivaQuestion } from '@/data/catalog'
import {
  INITIAL_SUBJECTS, INITIAL_PAPERS, INITIAL_RESOURCES,
  INITIAL_UNITS, INITIAL_TOPICS, INITIAL_LAB_EXPERIMENTS,
  INITIAL_VIVA_QUESTIONS, BRANCHES
} from '@/data/catalog'
import {
  fetchCloudData,
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
  deletePaper: (id: string) => void
  deleteResource: (id: string) => void
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

          set((_state) => {
            // ── Build complete authoritative Subjects list ──────────────────────
            const subjectMap = new Map<string, Subject>()

            const registerSubject = (s: Subject) => {
              const normName = s.name.toLowerCase().trim()
              if (!normName) return
              if (!subjectMap.has(normName)) {
                subjectMap.set(normName, s)
              }
            }

            // 1. Always load ALL base catalog subjects first
            for (const s of INITIAL_SUBJECTS) {
              registerSubject(s)
            }

            // 2. Merge explicit cloud subjects from Supabase
            for (const s of cloud.subjects) {
              registerSubject(s)
            }

            // 3. Extract any subjects present in uploaded cloud papers
            for (const p of cloud.papers) {
              if (p.subject_name) {
                const normName = p.subject_name.toLowerCase().trim()
                if (!subjectMap.has(normName)) {
                  const branchCode = p.branch_code || 'CSE'
                  const matchingBranch = BRANCHES.find(
                    b => b.code.toLowerCase() === branchCode.toLowerCase() || b.id.toLowerCase() === branchCode.toLowerCase()
                  )
                  const branchId = matchingBranch ? matchingBranch.id : 'cse'

                  const cleanName = p.subject_name.trim()
                  const code = cleanName.split(' ').map(w => w[0]?.toUpperCase() || '').join('').slice(0, 4) + '101'
                  const dynamicSub: Subject = {
                    id: p.subject_id || `sub-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                    name: cleanName,
                    code,
                    branch_id: branchId,
                    semester_id: `sem${p.semester_number || 1}`,
                    credits: 3,
                    type: 'theory',
                    units_count: 5,
                  }
                  registerSubject(dynamicSub)
                }
              }
            }

            // 4. Extract any subjects present in uploaded cloud resources
            for (const r of cloud.resources) {
              if (r.subject_name) {
                const normName = r.subject_name.toLowerCase().trim()
                if (!subjectMap.has(normName)) {
                  const branchCode = r.branch_code || 'CSE'
                  const matchingBranch = BRANCHES.find(
                    b => b.code.toLowerCase() === branchCode.toLowerCase() || b.id.toLowerCase() === branchCode.toLowerCase()
                  )
                  const branchId = matchingBranch ? matchingBranch.id : 'cse'

                  const cleanName = r.subject_name.trim()
                  const code = cleanName.split(' ').map(w => w[0]?.toUpperCase() || '').join('').slice(0, 4) + '101'
                  const dynamicSub: Subject = {
                    id: r.subject_id || `sub-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                    name: cleanName,
                    code,
                    branch_id: branchId,
                    semester_id: 'sem1',
                    credits: 3,
                    type: 'theory',
                    units_count: 5,
                  }
                  registerSubject(dynamicSub)
                }
              }
            }

            const mergedSubjects = Array.from(subjectMap.values())

            // ── Remap paper/resource subject_ids to match unified subject IDs ──
            const remapSubjectId = <T extends { subject_id: string; subject_name?: string }>(item: T): T => {
              const normName = (item.subject_name || '').toLowerCase().trim()
              const matchedSubject = subjectMap.get(normName)
              if (matchedSubject) {
                return { ...item, subject_id: matchedSubject.id, subject_name: matchedSubject.name }
              }
              return item
            }

            // ── Deduplicate by sha256 ──
            const dedupBySha256 = <T extends { sha256?: string }>(items: T[]): T[] => {
              const seen = new Set<string>()
              return items.filter(item => {
                if (!item.sha256) return true
                if (seen.has(item.sha256)) return false
                seen.add(item.sha256)
                return true
              })
            }

            const allPapers    = dedupBySha256(cloud.papers.map(remapSubjectId))
            const allResources = dedupBySha256(cloud.resources.map(remapSubjectId))

            return {
              subjects: mergedSubjects,
              papers: allPapers,
              resources: allResources,
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
              set((state) => {
                // Skip if same sha256 already exists (duplicate guard)
                if (newPaper.sha256 && state.papers.some(item => item.sha256 === newPaper.sha256)) return state
                return { papers: [newPaper, ...state.papers.filter(item => item.id !== newPaper.id)] }
              })
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
        // Note: cloud sync is handled by UploadPage (awaited before addPaper is called)
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
        // Note: cloud sync is handled by UploadPage (awaited before addResource is called)
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

      deletePaper: (id: string) => {
        set((state) => ({ papers: state.papers.filter(p => p.id !== id) }))
      },

      deleteResource: (id: string) => {
        set((state) => ({ resources: state.resources.filter(r => r.id !== id) }))
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
