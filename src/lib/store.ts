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
          const cloud = await fetchCloudData()

          set((state) => {
            const existingSubIds = new Set(state.subjects.map(s => s.id))
            const newSubjects = cloud.subjects.filter(s => !existingSubIds.has(s.id))

            const existingPaperIds = new Set(state.papers.map(p => p.id))
            const newPapers = cloud.papers.filter(p => !existingPaperIds.has(p.id))

            const existingResIds = new Set(state.resources.map(r => r.id))
            const newResources = cloud.resources.filter(r => !existingResIds.has(r.id))

            return {
              subjects: [...state.subjects, ...newSubjects],
              papers: [...newPapers, ...state.papers],
              resources: [...newResources, ...state.resources],
              isCloudLoaded: true,
            }
          })

          // Live real-time postgres change listener
          supabase
            .channel('public:papers')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'papers' }, (payload) => {
              const p: any = payload.new
              if (p) {
                const newPaper: Paper = {
                  id: p.id,
                  subject_id: p.subject_id,
                  subject_name: p.subject_name || p.title || 'Subject Paper',
                  branch_code: p.branch_code || 'CSE',
                  exam_type: p.exam_type || 'midterm',
                  exam_label: p.exam_label || 'Mid Term',
                  academic_year: p.academic_year || '2025-26',
                  semester_number: p.semester_number || 1,
                  file_url: p.file_url,
                  uploaded_by: p.uploaded_by || 'Anonymous',
                  verification_status: 'verified',
                  file_size: p.file_size ? Number(p.file_size) : undefined,
                  sha256: p.sha256,
                }
                set((state) => ({
                  papers: [newPaper, ...state.papers.filter(item => item.id !== newPaper.id)]
                }))
              }
            })
            .subscribe()
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
        // Sync directly to Supabase cloud
        syncPaperToCloud(newPaper)
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
        // Sync directly to Supabase cloud
        syncResourceToCloud(newResource)
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
        // Sync directly to Supabase cloud
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
        // Sync directly to Supabase cloud
        syncSubjectToCloud(newSub)
        return newSub
      },
    }),
    {
      name: 'sru_study_hub_v600',
    }
  )
)

