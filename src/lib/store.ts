import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Subject, Paper, Resource, Unit, Topic, LabExperiment, VivaQuestion } from '@/data/catalog'
import {
  INITIAL_SUBJECTS, INITIAL_PAPERS, INITIAL_RESOURCES,
  INITIAL_UNITS, INITIAL_TOPICS, INITIAL_LAB_EXPERIMENTS,
  INITIAL_VIVA_QUESTIONS
} from '@/data/catalog'

interface AppState {
  subjects: Subject[]
  papers: Paper[]
  resources: Resource[]
  units: Unit[]
  topics: Topic[]
  labExperiments: LabExperiment[]
  vivaQuestions: VivaQuestion[]

  // Actions
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

      addPaper: (paperData) => {
        const id = paperData.id || `paper-${Date.now()}`
        const newPaper: Paper = {
          ...paperData,
          id,
          verification_status: 'verified',
        }
        set((state) => ({
          papers: [newPaper, ...state.papers],
        }))
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
          resources: [newResource, ...state.resources],
        }))
        return newResource
      },

      addSubject: (subjectData) => {
        const id = subjectData.id || `sub-${Date.now()}`
        const newSubject: Subject = {
          ...subjectData,
          id,
        }
        set((state) => ({
          subjects: [...state.subjects, newSubject],
        }))
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
        return newSub
      },
    }),
    {
      name: 'sru_study_hub_v500',
    }
  )
)
