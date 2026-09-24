import { useState, useCallback } from 'react'
import { Upload, CheckCircle, AlertCircle, Loader, X, CloudUpload } from 'lucide-react'
import {
  validateFile, validateContentSafety, sha256, checkUploadRateLimit, incrementUploadCount,
  formatBytes, optimizeUploadFile, ALLOWED_MIMES
} from '@/lib/fileUtils'
import { getAnonId } from '@/lib/anonId'
import { BRANCHES, ACADEMIC_YEARS, EXAM_TYPES } from '@/data/catalog'
import { useAppStore } from '@/lib/store'
import { uploadFileToStorage } from '@/lib/supabaseSync'

const MATERIAL_TYPES = [
  { value: 'paper', label: '📄 Previous Paper', desc: 'Mid-term or end-term question paper' },
  { value: 'lab_paper', label: '🧪 Lab Paper', desc: 'Lab examination paper' },
  { value: 'syllabus', label: '📘 Syllabus', desc: 'Official or student-uploaded syllabus' },
  { value: 'notes', label: '📝 Notes', desc: 'Student notes or study material' },
  { value: 'question_bank', label: '📋 Question Bank', desc: 'Compiled question bank' },
  { value: 'lab_manual', label: '🔬 Lab Manual', desc: 'Lab instructions and experiments' },
  { value: 'other', label: '📁 Other', desc: 'Any other useful material' },
]

type UploadStep = { id: string; label: string; status: 'pending' | 'active' | 'done' | 'error'; detail?: string }

const INITIAL_STEPS: UploadStep[] = [
  { id: 'validate', label: 'Validating file & content safety', status: 'pending' },
  { id: 'compress', label: 'Optimizing & compressing file', status: 'pending' },
  { id: 'hash', label: 'Calculating file hash (SHA-256)', status: 'pending' },
  { id: 'duplicate', label: 'Checking for duplicates', status: 'pending' },
  { id: 'upload', label: 'Uploading to Supabase Storage (CDN)', status: 'pending' },
  { id: 'meta', label: 'Saving metadata to database', status: 'pending' },
  { id: 'publish', label: 'Publishing & broadcasting to all users', status: 'pending' },
]

export default function UploadPage() {
  const { subjects, papers, resources, addPaper, addResource, findOrCreateSubject } = useAppStore()
  const [materialType, setMaterialType] = useState('paper')
  const [branch, setBranch] = useState('')
  const [subject, setSubject] = useState('')
  const [examType, setExamType] = useState('midterm')
  const [academicYear, setAcademicYear] = useState('2025-26')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [steps, setSteps] = useState<UploadStep[]>(INITIAL_STEPS)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState('')

  const rateLimit = checkUploadRateLimit()

  const filteredSubjects = branch
    ? subjects.filter(s => s.branch_id === branch)
    : subjects

  const updateStep = (id: string, status: UploadStep['status'], detail?: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status, detail } : s))
  }

  const handleFileDrop = useCallback((f: File) => {
    const result = validateFile(f)
    if (!result.valid) {
      setError(result.error || 'Invalid file')
      return
    }
    setFile(f)
    setError('')
    if (!title) {
      setTitle(f.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '))
    }
  }, [title])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) handleFileDrop(droppedFile)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFileDrop(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { setError('Please select a file.'); return }
    if (!branch || !subject) { setError('Please select branch and enter subject name.'); return }

    if (!rateLimit.allowed) {
      setError(`Upload limit reached. You can upload again after ${new Date(rateLimit.resetAt).toLocaleTimeString()}.`)
      return
    }

    setUploading(true)
    setError('')
    setSteps(INITIAL_STEPS)
    setUploadedUrl('')

    try {
      // ── Step 1: Validate ──────────────────────────────────────────────────
      updateStep('validate', 'active')
      const validation = validateFile(file)
      if (!validation.valid) throw new Error(validation.error)

      const safetyCheck = validateContentSafety(title, description, file.name)
      if (!safetyCheck.safe) throw new Error(safetyCheck.error)

      await new Promise(r => setTimeout(r, 150))
      updateStep('validate', 'done', `${formatBytes(file.size)} · Content validated ✓`)

      // ── Step 2: Compress ──────────────────────────────────────────────────
      updateStep('compress', 'active')
      const compression = await optimizeUploadFile(file)
      const uploadFile = compression.optimizedFile
      if (compression.compressed) {
        const savedPct = Math.round((1 - compression.optimizedSize / compression.originalSize) * 100)
        updateStep('compress', 'done', `${compression.fileTypeLabel}: ${formatBytes(compression.originalSize)} → ${formatBytes(compression.optimizedSize)} (${savedPct}% saved)`)
      } else {
        updateStep('compress', 'done', `Optimal size (${formatBytes(compression.optimizedSize)})`)
      }

      // ── Step 3: Hash ──────────────────────────────────────────────────────
      updateStep('hash', 'active')
      const hash = await sha256(uploadFile)
      updateStep('hash', 'done', `${hash.slice(0, 20)}…`)

      // ── Step 4: Duplicate check ───────────────────────────────────────────
      updateStep('duplicate', 'active')
      await new Promise(r => setTimeout(r, 100))
      const existingPaper = papers.find(p => p.sha256 === hash)
      const existingResource = resources.find(r => r.sha256 === hash)

      if (existingPaper || existingResource) {
        updateStep('duplicate', 'done', 'Exact file already exists — no re-upload needed')
        updateStep('upload', 'done', 'Deduplicated (using existing CDN link)')
        updateStep('meta', 'done', 'Already published')
        updateStep('publish', 'done', 'Already visible to all users ✓')
        setUploadedUrl(existingPaper?.file_url || existingResource?.file_url || '')
        setSuccess(true)
        setUploading(false)
        return
      }
      updateStep('duplicate', 'done', 'No duplicates found ✓')

      // ── Step 5: Upload to Supabase Storage (real CDN URL) ─────────────────
      updateStep('upload', 'active')
      const bucket = (materialType === 'paper' || materialType === 'lab_paper') ? 'papers' : 'resources'

      // Rename file to include hash prefix to aid CDN deduplication
      const cdnFile = new File([uploadFile], `${hash.slice(0, 12)}_${uploadFile.name}`, { type: uploadFile.type })

      let cdnUrl: string
      try {
        cdnUrl = await uploadFileToStorage(bucket, cdnFile)
      } catch (storageErr) {
        throw new Error(`Storage upload failed: ${storageErr instanceof Error ? storageErr.message : storageErr}. Check that your Supabase Storage buckets "papers" and "resources" are created and set to Public.`)
      }
      setUploadedUrl(cdnUrl)
      updateStep('upload', 'done', `CDN URL secured ✓`)

      // ── Step 6: Save metadata to database ────────────────────────────────
      updateStep('meta', 'active')
      await new Promise(r => setTimeout(r, 100))

      const isLab = materialType === 'lab_paper' || materialType === 'lab_manual'
      const targetSubject = findOrCreateSubject(subject, branch, 'sem1', isLab ? 'lab' : 'theory')
      const branchObj = BRANCHES.find(b => b.id === branch)

      if (materialType === 'paper' || materialType === 'lab_paper') {
        addPaper({
          subject_id: targetSubject.id,
          subject_name: targetSubject.name,
          branch_code: branchObj?.code || 'CSE',
          exam_type: (examType || 'midterm') as any,
          exam_label: EXAM_TYPES[examType] || 'Mid Term',
          academic_year: academicYear,
          semester_number: parseInt(targetSubject.semester_id.replace('sem', '')) || 1,
          file_url: cdnUrl,          // ✅ Permanent Supabase CDN URL
          uploaded_by: getAnonId(),
          verification_status: 'verified',
          file_size: uploadFile.size,
          sha256: hash,
        })
      } else {
        addResource({
          subject_id: targetSubject.id,
          subject_name: targetSubject.name,
          branch_code: branchObj?.code || 'CSE',
          type: (materialType || 'notes') as any,
          title: title || `${targetSubject.name} ${materialType}`,
          description: description || 'Uploaded study resource',
          file_url: cdnUrl,          // ✅ Permanent Supabase CDN URL
          uploaded_by: getAnonId(),
          verification_status: 'verified',
          academic_year: academicYear,
          sha256: hash,
        })
      }

      updateStep('meta', 'done', 'Record saved to Supabase DB ✓')

      // ── Step 7: Publish ───────────────────────────────────────────────────
      updateStep('publish', 'active')
      await new Promise(r => setTimeout(r, 200))
      incrementUploadCount()
      updateStep('publish', 'done', 'Live & visible to ALL users instantly ✓')

      setSuccess(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setError(msg)
      setSteps(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'error' } : s))
    } finally {
      setUploading(false)
    }
  }

  const handleReset = () => {
    setFile(null); setTitle(''); setDescription(''); setSuccess(false)
    setSteps(INITIAL_STEPS); setError(''); setUploadedUrl('')
  }

  if (success) {
    return (
      <div className="page-wrapper" style={{ maxWidth: 640, marginInline: 'auto' }}>
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
            boxShadow: '0 0 0 12px rgba(34,197,94,0.15)',
          }}>
            <CheckCircle size={36} color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>Upload Live!</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Your file is now stored on <strong>Supabase CDN</strong> and immediately visible to
            every SR University student — in any browser, on any device.
          </p>

          {uploadedUrl && (
            <div className="alert alert-success" style={{ marginBottom: '1.25rem', textAlign: 'left', wordBreak: 'break-all' }}>
              <div style={{ fontSize: '0.8125rem' }}>
                <strong>🌐 Public CDN URL:</strong><br />
                <a href={uploadedUrl} target="_blank" rel="noopener noreferrer"
                   style={{ color: 'var(--color-primary-500)', fontSize: '0.75rem' }}>
                  {uploadedUrl}
                </a>
              </div>
            </div>
          )}

          <div className="alert" style={{
            background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)',
            marginBottom: '1.5rem', textAlign: 'left',
          }}>
            <div style={{ fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div>✅ <strong>Uploaded to Supabase Storage</strong> — permanent CDN link</div>
              <div>✅ <strong>Saved to Supabase Database</strong> — visible to all users</div>
              <div>✅ <strong>Realtime broadcast</strong> — other open tabs get it instantly</div>
              <div>✅ <strong>Zero duplicates</strong> — SHA-256 hash deduplication active</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={handleReset}>Upload Another</button>
            {materialType === 'paper' || materialType === 'lab_paper' ? (
              <a href="/papers" className="btn btn-secondary">View Papers</a>
            ) : (
              <a href="/resources" className="btn btn-secondary">View Resources</a>
            )}
            <a href="/my-study" className="btn btn-secondary">My Uploads</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper" style={{ maxWidth: 700, marginInline: 'auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CloudUpload size={24} style={{ color: 'var(--color-primary-500)' }} />
          Upload Material
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Files are uploaded to <strong>Supabase Cloud Storage</strong> — visible to all students instantly.
          Anonymous ID: <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', background: 'var(--bg-muted)', padding: '1px 5px', borderRadius: 4 }}>{getAnonId()}</code>
        </p>
      </div>

      {/* Rate limit warning */}
      {!rateLimit.allowed && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          Upload limit reached ({rateLimit.remaining} remaining). Resets at {new Date(rateLimit.resetAt).toLocaleTimeString()}.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Material type */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="label" style={{ marginBottom: '0.75rem' }}>Material Type</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
            {MATERIAL_TYPES.map(mt => (
              <button
                key={mt.value}
                type="button"
                onClick={() => setMaterialType(mt.value)}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${materialType === mt.value ? 'var(--color-primary-500)' : 'var(--border-base)'}`,
                  background: materialType === mt.value ? 'var(--color-primary-50)' : 'transparent',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.125rem' }}>{mt.label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{mt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Academic details */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label" htmlFor="up-branch">Branch *</label>
              <select id="up-branch" className="input select" value={branch} onChange={e => setBranch(e.target.value)} required>
                <option value="">Select branch</option>
                {BRANCHES.map(b => <option key={b.id} value={b.id}>{b.code}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="up-subject">Subject Name *</label>
              <input
                id="up-subject"
                className="input"
                list="subject-suggestions"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Type or select subject name…"
                required
              />
              <datalist id="subject-suggestions">
                {filteredSubjects.map(s => <option key={s.id} value={s.name} />)}
              </datalist>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="up-year">Academic Year</label>
              <select id="up-year" className="input select" value={academicYear} onChange={e => setAcademicYear(e.target.value)}>
                {ACADEMIC_YEARS.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}
              </select>
            </div>

            {(materialType === 'paper' || materialType === 'lab_paper') && (
              <div className="form-group">
                <label className="label" htmlFor="up-exam-type">Exam Type</label>
                <select id="up-exam-type" className="input select" value={examType} onChange={e => setExamType(e.target.value)}>
                  {Object.entries(EXAM_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            )}

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="label" htmlFor="up-title">Title</label>
              <input
                id="up-title"
                className="input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Data Structures Mid Term 2025-26"
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="label" htmlFor="up-desc">Description (optional)</label>
              <textarea
                id="up-desc"
                className="input"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                placeholder="Any additional notes about this material…"
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>
        </div>

        {/* File drop zone */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="label" style={{ marginBottom: '0.625rem' }}>File *</div>

          {!file ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragOver ? 'var(--color-primary-400)' : 'var(--border-base)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                background: dragOver ? 'var(--color-primary-50)' : 'var(--bg-muted)',
                transition: 'all var(--transition-fast)',
                cursor: 'pointer',
              }}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload size={32} style={{ color: 'var(--text-subtle)', margin: '0 auto 0.75rem' }} />
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Drop your file here or click to browse</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                PDF, JPEG, PNG, WebP, Word · Max 50 MB
              </div>
              <input
                id="file-input"
                type="file"
                accept={ALLOWED_MIMES.join(',')}
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.875rem 1rem',
              background: 'var(--color-success-50)',
              border: '1px solid var(--color-success-500)',
              borderRadius: 'var(--radius-md)',
            }}>
              <CheckCircle size={18} style={{ color: 'var(--color-success-600)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatBytes(file.size)} · {file.type}</div>
              </div>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setFile(null)}>
                <X size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Upload progress */}
        {uploading && (
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} />
              Uploading to Supabase Cloud…
            </div>
            {steps.map(step => (
              <div key={step.id} className={`upload-step ${step.status}`}>
                {step.status === 'done' ? <CheckCircle size={14} style={{ color: 'var(--color-success-600)', flexShrink: 0 }} /> :
                 step.status === 'active' ? <Loader size={14} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} /> :
                 step.status === 'error' ? <AlertCircle size={14} style={{ color: 'var(--color-error-500)', flexShrink: 0 }} /> :
                 <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--color-neutral-300)', flexShrink: 0 }} />
                }
                <span>{step.label}</span>
                {step.detail && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>— {step.detail}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="alert alert-error" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: '0.875rem' }}>{error}</div>
          </div>
        )}

        {/* Info */}
        <div className="alert alert-info" style={{ fontSize: '0.8rem' }}>
          <div>
            ☁️ Files are uploaded directly to <strong>Supabase Storage CDN</strong> — anyone can access them instantly.
            Duplicates are skipped via SHA-256 hash. Your anonymous ID (<code style={{ fontFamily: 'var(--font-mono)' }}>{getAnonId()}</code>) is used for contributor credit.
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={uploading || !file || !rateLimit.allowed}
        >
          {uploading ? (
            <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Uploading to Cloud…</>
          ) : (
            <><CloudUpload size={16} /> Upload to Cloud</>
          )}
        </button>
      </form>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
