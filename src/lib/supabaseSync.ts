import { supabase } from './supabase'
import type { Subject, Paper, Resource } from '@/data/catalog'


/**
 * Deterministic UUID from a string — same input always → same UUID.
 * Used to convert local text IDs into consistent UUID values for Supabase uuid columns.
 * If the string is already a valid UUID, it's returned as-is.
 */
function deterministicUuid(str: string): string {
  if (!str) return crypto.randomUUID()
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    return str
  }
  // djb2-based hash into 4 unsigned 32-bit buckets → UUID v4 format
  let h1 = 0x811c9dc5, h2 = 0xd3a06c80, h3 = 0xde2b3b24, h4 = 0x9e3779b9
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i)
    h1 = (Math.imul(h1 ^ c, 0x01000193)) >>> 0
    h2 = (Math.imul(h2 ^ c, 0x811c9dc5)) >>> 0
    h3 = (Math.imul(h3 ^ c, 0xd3a06c80)) >>> 0
    h4 = (Math.imul(h4 ^ c, 0xde2b3b24)) >>> 0
  }
  // Always use >>> 0 before toString(16) to keep values unsigned (avoids '-' in hex)
  const f = (n: number) => (n >>> 0).toString(16).padStart(8, '0')
  const xor1 = ((h1 ^ h2) >>> 0)
  const xor2 = ((h3 ^ h4) >>> 0)
  return [
    f(h1),
    f(h2).slice(0, 4),
    '4' + f(h3).slice(1, 4),
    (8 + (h4 & 3)).toString(16) + f(h4).slice(1, 4),
    f(xor1) + f(xor2).slice(0, 4),
  ].join('-')
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
      supabase.from('subjects').select('*').order('created_at', { ascending: false }),
      supabase.from('papers').select('*').order('created_at', { ascending: false }),
      supabase.from('resources').select('*').order('created_at', { ascending: false }),
    ])

    if (subRes.error) console.warn('Subjects fetch error:', subRes.error.message)
    if (paperRes.error) console.warn('Papers fetch error:', paperRes.error.message)
    if (resRes.error) console.warn('Resources fetch error:', resRes.error.message)

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

    const papers: Paper[] = (paperRes.data || [])
      .filter((p: any) => p.file_url && !p.file_url.startsWith('data:'))
      .map((p: any) => ({
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

    const resources: Resource[] = (resRes.data || [])
      .filter((r: any) => r.file_url && !r.file_url.startsWith('data:'))
      .map((r: any) => ({
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
 * Upload a binary File object to Supabase Storage and return the permanent public URL.
 * This is the ONLY way files should be stored — no DataURLs in the DB.
 */
export async function uploadFileToStorage(
  bucketName: 'papers' | 'resources',
  file: File,
): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `uploads/${Date.now()}_${safeName}`

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: '31536000', // 1-year CDN cache
    })

  if (error) {
    throw new Error(`Storage upload failed (${bucketName}): ${error.message}`)
  }

  const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(data.path)
  if (!urlData?.publicUrl) {
    throw new Error('Could not get public URL from Supabase Storage')
  }

  return urlData.publicUrl
}

/**
 * Write a paper record to Supabase DB after the file has been uploaded to Storage.
 * paper.file_url must already be a permanent CDN URL (not a DataURL).
 * THROWS on error so callers can handle the failure.
 */
export async function syncPaperToCloud(paper: Paper): Promise<void> {
  if (!paper.file_url || paper.file_url.startsWith('data:')) {
    throw new Error('syncPaperToCloud: file_url must be a permanent CDN URL, not a DataURL. Upload to Storage first.')
  }

  // Use original string IDs — papers/subjects tables use TEXT primary keys, not UUID
  const row = {
    id: crypto.randomUUID(),   // Supabase id column is uuid type
    subject_id: deterministicUuid(paper.subject_id),  // consistent UUID per subject
    subject_name: paper.subject_name,
    branch_code: paper.branch_code,
    exam_type: mapExamType(paper.exam_type),
    exam_label: paper.exam_label,
    academic_year: paper.academic_year,
    semester_number: paper.semester_number || 1,
    file_url: paper.file_url,
    uploaded_by: paper.uploaded_by,
    verification_status: 'verified',
    file_size: paper.file_size,
    sha256: paper.sha256,
  }

  // Upsert: if same file (sha256) already exists in DB, update it (no-op for immutable files)
  // onConflict: 'sha256' is the server-side deduplication guard
  const { error } = await supabase.from('papers').upsert([row], {
    onConflict: 'sha256',
    ignoreDuplicates: false,
  })
  if (error) {
    console.error('[syncPaperToCloud]', error.message, error.code)
    throw new Error('Unable to save your upload at this time. Please check your connection and try again.')
  }
  console.log('✅ Paper synced to cloud DB:', paper.id)
}

/**
 * Write a resource record to Supabase DB after the file has been uploaded to Storage.
 * resource.file_url must already be a permanent CDN URL (not a DataURL).
 * THROWS on error so callers can handle the failure.
 */
export async function syncResourceToCloud(resource: Resource): Promise<void> {
  if (!resource.file_url || resource.file_url.startsWith('data:')) {
    throw new Error('syncResourceToCloud: file_url must be a permanent CDN URL. Upload to Storage first.')
  }

  // Use original string IDs — resources/subjects tables use TEXT primary keys, not UUID
  const row = {
    id: crypto.randomUUID(),   // Supabase id column is uuid type
    subject_id: deterministicUuid(resource.subject_id),  // consistent UUID per subject
    subject_name: resource.subject_name,
    branch_code: resource.branch_code,
    type: resource.type,
    title: resource.title,
    description: resource.description,
    file_url: resource.file_url,
    uploaded_by: resource.uploaded_by,
    verification_status: 'verified',
    academic_year: resource.academic_year,
    sha256: resource.sha256,
  }

  // Upsert: if same file (sha256) already exists in DB, update it (no-op for immutable files)
  // onConflict: 'sha256' is the server-side deduplication guard
  const { error } = await supabase.from('resources').upsert([row], {
    onConflict: 'sha256',
    ignoreDuplicates: false,
  })
  if (error) {
    console.error('[syncResourceToCloud]', error.message, error.code)
    throw new Error('Unable to save your upload at this time. Please check your connection and try again.')
  }
  console.log('✅ Resource synced to cloud DB:', resource.id)
}

/**
 * Upload a new subject directly to Supabase cloud database
 */
export async function syncSubjectToCloud(subject: Subject): Promise<void> {
  try {
    // Use deterministic UUID for subjects so same local ID → same Supabase UUID
    const row = {
      id: deterministicUuid(subject.id),
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
      console.error('Cloud Subject Sync Error:', error.message)
    } else {
      console.log('✅ Subject synced to cloud:', subject.id)
    }
  } catch (err) {
    console.error('Failed to sync subject to Supabase:', err)
  }
}

/** Helper to map a raw Supabase paper row → Paper */
export function mapPaperRow(p: any): Paper {
  return {
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
}

/** Helper to map a raw Supabase resource row → Resource */
export function mapResourceRow(r: any): Resource {
  return {
    id: r.id,
    subject_id: r.subject_id,
    subject_name: r.subject_name || 'Subject Resource',
    branch_code: r.branch_code || 'CSE',
    type: r.type || r.resource_type || 'notes',
    title: r.title,
    description: r.description || '',
    file_url: r.file_url,
    uploaded_by: r.uploaded_by || 'Anonymous',
    verification_status: 'verified',
    academic_year: r.academic_year || '2025-26',
    sha256: r.sha256,
  }
}
