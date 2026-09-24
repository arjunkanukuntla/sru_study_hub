import { supabase } from './supabase'
import type { Subject, Paper, Resource } from '@/data/catalog'

function toUuid(id: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id
  }
  return crypto.randomUUID()
}

function mapExamType(type: string): string {
  if (type === 'midterm' || type === 'mid1') return 'mid1'
  if (type === 'mid2') return 'mid2'
  if (type === 'endterm' || type === 'end_term') return 'endterm'
  if (type === 'lab_mid') return 'lab_mid'
  if (type === 'lab_end') return 'lab_end'
  if (type === 'supplementary') return 'supplementary'
  return 'mid1'
}

/**
 * Fetch all community-uploaded subjects, papers, and resources from Supabase
 */
export async function fetchCloudData(): Promise<{
  subjects: Subject[]
  papers: Paper[]
  resources: Resource[]
}> {
  try {
    const [subRes, paperRes, resRes] = await Promise.all([
      supabase.from('subjects').select('*'),
      supabase.from('papers').select('*'),
      supabase.from('resources').select('*'),
    ])

    const subjects: Subject[] = (subRes.data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      code: s.code || 'SUB101',
      branch_id: s.branch_id || 'cse',
      semester_id: s.semester_id || 'sem1',
      credits: s.credits || 3,
      type: s.type || s.subject_type || 'theory',
      units_count: s.units_count || 5,
    }))

    const papers: Paper[] = (paperRes.data || []).map((p: any) => ({
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
      verification_status: p.verification_status || 'verified',
      file_size: p.file_size ? Number(p.file_size) : undefined,
      sha256: p.sha256,
    }))

    const resources: Resource[] = (resRes.data || []).map((r: any) => ({
      id: r.id,
      subject_id: r.subject_id,
      subject_name: r.subject_name || 'Subject Resource',
      branch_code: r.branch_code || 'CSE',
      type: r.type || r.resource_type || 'notes',
      title: r.title,
      description: r.description || '',
      file_url: r.file_url,
      uploaded_by: r.uploaded_by || 'Anonymous',
      verification_status: r.verification_status || 'verified',
      academic_year: r.academic_year || '2025-26',
      sha256: r.sha256,
    }))

    return { subjects, papers, resources }
  } catch (err) {
    console.warn('Failed to fetch data from Supabase cloud:', err)
    return { subjects: [], papers: [], resources: [] }
  }
}

/**
 * Upload binary file to Supabase Storage Bucket and return public URL
 */
export async function uploadFileToStorage(
  bucketName: 'papers' | 'resources',
  fileOrDataUrl: File | string,
  fileName: string
): Promise<string> {
  try {
    let blob: Blob
    let mimeType = 'application/pdf'

    if (typeof fileOrDataUrl === 'string') {
      const match = fileOrDataUrl.match(/^data:(.*?);base64,(.*)$/)
      if (match) {
        mimeType = match[1]
        const byteCharacters = atob(match[2])
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        blob = new Blob([new Uint8Array(byteNumbers)], { type: mimeType })
      } else {
        return fileOrDataUrl
      }
    } else {
      blob = fileOrDataUrl
      mimeType = fileOrDataUrl.type
    }

    const cleanPath = `uploads/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(cleanPath, blob, { upsert: true, contentType: mimeType })

    if (error) {
      console.warn(`Supabase Storage upload warning (${bucketName}):`, error.message)
      // Return Data URL if storage upload failed
      return typeof fileOrDataUrl === 'string' ? fileOrDataUrl : ''
    }

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(cleanPath)
    return publicUrlData.publicUrl || (typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '')
  } catch (err) {
    console.warn('Storage upload fallback:', err)
    return typeof fileOrDataUrl === 'string' ? fileOrDataUrl : ''
  }
}

/**
 * Upload a paper directly to Supabase cloud database & storage
 */
export async function syncPaperToCloud(paper: Paper): Promise<void> {
  try {
    let fileUrl = paper.file_url || ''

    // If file_url is a Data URL, upload to Storage Bucket first to get a lean CDN URL
    if (fileUrl.startsWith('data:')) {
      const storageUrl = await uploadFileToStorage('papers', fileUrl, `${paper.subject_name}_paper.pdf`)
      if (storageUrl && !storageUrl.startsWith('data:')) {
        fileUrl = storageUrl
      }
    }

    const row = {
      id: toUuid(paper.id),
      subject_id: toUuid(paper.subject_id),
      subject_name: paper.subject_name,
      branch_code: paper.branch_code,
      exam_type: mapExamType(paper.exam_type),
      exam_label: paper.exam_label,
      academic_year: paper.academic_year,
      semester_number: paper.semester_number || 1,
      file_url: fileUrl,
      uploaded_by: paper.uploaded_by,
      verification_status: 'verified',
      file_size: paper.file_size,
      sha256: paper.sha256,
    }
    const { error } = await supabase.from('papers').upsert([row])
    if (error) {
      console.error('Cloud Paper Sync Error:', error)
    } else {
      console.log('Successfully synced paper to Supabase cloud:', paper.id)
    }
  } catch (err) {
    console.error('Failed to sync paper to Supabase:', err)
  }
}

/**
 * Upload a resource directly to Supabase cloud database & storage
 */
export async function syncResourceToCloud(resource: Resource): Promise<void> {
  try {
    let fileUrl = resource.file_url || ''

    if (fileUrl.startsWith('data:')) {
      const storageUrl = await uploadFileToStorage('resources', fileUrl, `${resource.title}.pdf`)
      if (storageUrl && !storageUrl.startsWith('data:')) {
        fileUrl = storageUrl
      }
    }

    const row = {
      id: toUuid(resource.id),
      subject_id: toUuid(resource.subject_id),
      subject_name: resource.subject_name,
      branch_code: resource.branch_code,
      type: resource.type,
      title: resource.title,
      description: resource.description,
      file_url: fileUrl,
      uploaded_by: resource.uploaded_by,
      verification_status: 'verified',
      academic_year: resource.academic_year,
      sha256: resource.sha256,
    }
    const { error } = await supabase.from('resources').upsert([row])
    if (error) {
      console.error('Cloud Resource Sync Error:', error)
    } else {
      console.log('Successfully synced resource to Supabase cloud:', resource.id)
    }
  } catch (err) {
    console.error('Failed to sync resource to Supabase:', err)
  }
}

/**
 * Upload a new subject directly to Supabase cloud database
 */
export async function syncSubjectToCloud(subject: Subject): Promise<void> {
  try {
    const row = {
      id: toUuid(subject.id),
      name: subject.name,
      code: subject.code,
      branch_id: subject.branch_id,
      semester_id: subject.semester_id,
      semester_num: 1,
      credits: subject.credits,
      type: subject.type,
      units_count: subject.units_count,
    }
    const { error } = await supabase.from('subjects').upsert([row])
    if (error) {
      console.error('Cloud Subject Sync Error:', error)
    } else {
      console.log('Successfully synced subject to Supabase cloud:', subject.id)
    }
  } catch (err) {
    console.error('Failed to sync subject to Supabase:', err)
  }
}

