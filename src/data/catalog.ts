// ─────────────────────────────────────────────────────────────
// SR University Academic Catalog — Initial Seed Data
// ─────────────────────────────────────────────────────────────

export type Branch = {
  id: string
  name: string
  code: string
  department: string
}

export type AcademicYear = {
  id: string
  label: string
}

export type Semester = {
  id: string
  number: number
  label: string
  branch_id: string
}

export type Subject = {
  id: string
  name: string
  code: string
  branch_id: string
  semester_id: string
  credits: number
  type: 'theory' | 'lab' | 'both'
  units_count: number
}

export type Unit = {
  id: string
  subject_id: string
  number: number
  title: string
  description: string
}

export type Paper = {
  id: string
  subject_id: string
  subject_name: string
  branch_code: string
  exam_type: 'midterm' | 'endterm' | 'lab_mid' | 'lab_end' | 'supplementary'
  exam_label: string
  academic_year: string
  semester_number: number
  date?: string
  file_url?: string
  uploaded_by: string
  verification_status: 'pending' | 'verified' | 'rejected'
  page_count?: number
  file_size?: number
  sha256?: string
}

export type Resource = {
  id: string
  subject_id: string
  subject_name: string
  branch_code: string
  type: 'syllabus' | 'notes' | 'question_bank' | 'reference' | 'lab_manual'
  title: string
  description: string
  file_url?: string
  uploaded_by: string
  verification_status: 'pending' | 'verified' | 'rejected'
  academic_year: string
  sha256?: string
}

export type Topic = {
  id: string
  subject_id: string
  unit_id: string
  name: string
  appearances: number
  unit_number: number
}

export type LabExperiment = {
  id: string
  lab_id: string
  number: number
  title: string
  description: string
}

export type VivaQuestion = {
  id: string
  lab_id: string
  experiment_id?: string
  question: string
  answer: string
}

// ─── Branches ───
export const BRANCHES: Branch[] = [
  { id: 'cse',       name: 'Computer Science and Engineering',                    code: 'CSE',        department: 'Engineering' },
  { id: 'cse-aiml',  name: 'CSE – Artificial Intelligence and Machine Learning',  code: 'CSE-AIML',   department: 'Engineering' },
  { id: 'cse-ds',    name: 'CSE – Data Science',                                  code: 'CSE-DS',     department: 'Engineering' },
  { id: 'ece',       name: 'Electronics and Communication Engineering',            code: 'ECE',        department: 'Engineering' },
  { id: 'eee',       name: 'Electrical and Electronics Engineering',               code: 'EEE',        department: 'Engineering' },
  { id: 'mech',      name: 'Mechanical Engineering',                              code: 'MECH',       department: 'Engineering' },
  { id: 'civil',     name: 'Civil Engineering',                                   code: 'CIVIL',      department: 'Engineering' },
  { id: 'it',        name: 'Information Technology',                              code: 'IT',         department: 'Engineering' },
]

export const ACADEMIC_YEARS: AcademicYear[] = [
  { id: '2026-27', label: '2026–27' },
  { id: '2025-26', label: '2025–26' },
  { id: '2024-25', label: '2024–25' },
  { id: '2023-24', label: '2023–24' },
]

export const STUDY_YEARS = [
  { id: '1', label: '1st Year' },
  { id: '2', label: '2nd Year' },
  { id: '3', label: '3rd Year' },
  { id: '4', label: '4th Year' },
]

// ─── Initial Catalog Data (100% User-Content-Driven — Zero Mock Data) ───
export const INITIAL_SUBJECTS: Subject[] = []
export const INITIAL_UNITS: Unit[] = []
export const INITIAL_PAPERS: Paper[] = []
export const INITIAL_TOPICS: Topic[] = []
export const INITIAL_RESOURCES: Resource[] = []
export const INITIAL_LAB_EXPERIMENTS: LabExperiment[] = []
export const INITIAL_VIVA_QUESTIONS: VivaQuestion[] = []
export const UNIT_DISTRIBUTION: Array<{ unit: string; label: string; percentage: number; color: string }> = []

export const EXAM_TYPES: Record<string, string> = {
  midterm:       'Mid Term',
  endterm:       'End Term',
  lab_mid:       'Lab Mid',
  lab_end:       'Lab End',
  supplementary: 'Supplementary',
}

export const RESOURCE_TYPES: Record<string, string> = {
  syllabus:      'Syllabus',
  notes:         'Notes',
  question_bank: 'Question Bank',
  reference:     'Reference',
  lab_manual:    'Lab Manual',
}

export function getFrequencyLabel(appearances: number): string {
  if (appearances >= 6) return 'Very Frequent'
  if (appearances >= 4) return 'Frequent'
  if (appearances >= 2) return 'Moderate'
  return 'Less Frequent'
}

export function getFrequencyClass(appearances: number): string {
  if (appearances >= 6) return 'freq-very-frequent'
  if (appearances >= 4) return 'freq-frequent'
  if (appearances >= 2) return 'freq-moderate'
  return 'freq-less'
}

export function getFrequencyEmoji(appearances: number): string {
  if (appearances >= 6) return '🔥'
  if (appearances >= 4) return '🟠'
  if (appearances >= 2) return '🟡'
  return '⚪'
}
