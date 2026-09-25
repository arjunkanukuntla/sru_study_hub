import { useState, useCallback } from 'react'
import { Upload, CheckCircle, AlertCircle, Loader, X, Files } from 'lucide-react'
import {
  validateFile, validateContentSafety, sha256, checkUploadRateLimit, incrementUploadCount,
  formatBytes, optimizeUploadFile, ALLOWED_MIMES
} from '@/lib/fileUtils'
import { getAnonId } from '@/lib/anonId'
import { BRANCHES, ACADEMIC_YEARS, EXAM_TYPES } from '@/data/catalog'
import { useAppStore } from '@/lib/store'
import { uploadFileToStorage, syncPaperToCloud, syncResourceToCloud } from '@/lib/supabaseSync'

const MATERIAL_TYPES = [
  { value: 'paper',         label: '📄 Previous Paper',  desc: 'Mid-term or end-term question paper' },
  { value: 'lab_paper',     label: '🧪 Lab Paper',        desc: 'Lab examination paper' },
  { value: 'syllabus',      label: '📘 Syllabus',         desc: 'Official or student-uploaded syllabus' },
  { value: 'notes',         label: '📝 Notes',            desc: 'Student notes or study material' },
  { value: 'question_bank', label: '📋 Question Bank',    desc: 'Compiled question bank' },
  { value: 'lab_manual',    label: '🔬 Lab Manual',       desc: 'Lab instructions and experiments' },
  { value: 'other',         label: '📁 Other',            desc: 'Any other useful material' },
]

type FileStatus = 'pending' | 'processing' | 'done' | 'duplicate' | 'error'

interface FileEntry {
  file: File
  status: FileStatus
  detail?: string
}

type UploadStep = { id: string; label: string; status: 'pending' | 'active' | 'done' | 'error'; detail?: string }

const makeSteps = (): UploadStep[] => [
  { id: 'validate',  label: 'Checking your file',      status: 'pending' },
  { id: 'compress',  label: 'Optimising file size',     status: 'pending' },
  { id: 'hash',      label: 'Preparing upload',         status: 'pending' },
  { id: 'duplicate', label: 'Checking for duplicates',  status: 'pending' },
  { id: 'upload',    label: 'Uploading file',           status: 'pending' },
  { id: 'meta',      label: 'Saving details',           status: 'pending' },
  { id: 'publish',   label: 'Making it available',      status: 'pending' },
]

export default function UploadPage() {
  const { subjects, papers, resources, addPaper, addResource, findOrCreateSubject } = useAppStore()
  const [materialType, setMaterialType] = useState('paper')
  const [branch, setBranch]             = useState('')
  const [subject, setSubject]           = useState('')
  const [examType, setExamType]         = useState('midterm')
  const [academicYear, setAcademicYear] = useState('2025-26')
  const [description, setDescription]  = useState('')
  const [fileEntries, setFileEntries]   = useState<FileEntry[]>([])
  const [dragOver, setDragOver]         = useState(false)
  const [uploading, setUploading]       = useState(false)
  const [steps, setSteps]               = useState<UploadStep[]>(makeSteps())
  const [currentFileIdx, setCurrentFileIdx] = useState(0)
  const [globalError, setGlobalError]   = useState('')
  const [doneCount, setDoneCount]       = useState(0)

  const rateLimit = checkUploadRateLimit()

  const filteredSubjects = branch
    ? subjects.filter(s => s.branch_id === branch)
    : subjects

  const updateStep = (id: string, status: UploadStep['status'], detail?: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status, detail } : s))
  }

  const addFiles = useCallback((incoming: File[]) => {
    const valid: FileEntry[] = []
    for (const f of incoming) {
      const result = validateFile(f)
      if (!result.valid) {
        setGlobalError(`"${f.name}": ${result.error}`)
        continue
      }
      valid.push({ file: f, status: 'pending' })
    }
    setFileEntries(prev => {
      const existing = new Set(prev.map(e => e.file.name + e.file.size))
      return [...prev, ...valid.filter(v => !existing.has(v.file.name + v.file.size))]
    })
    if (valid.length) setGlobalError('')
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files))
    e.target.value = ''
  }

  const removeFile = (idx: number) => {
    setFileEntries(prev => prev.filter((_, i) => i !== idx))
  }

  const uploadSingleFile = async (entry: FileEntry, idx: number): Promise<'done' | 'duplicate' | 'error'> => {
    const setStatus = (status: FileStatus, detail?: string) => {
      setFileEntries(prev => prev.map((e, i) => i === idx ? { ...e, status, detail } : e))
    }

    const freshSteps = makeSteps()
    setSteps(freshSteps)
    setCurrentFileIdx(idx)
    setStatus('processing')
    const { file } = entry

    try {
      // Step 1: Validate
      updateStep('validate', 'active')
      const validation = validateFile(file)
      if (!validation.valid) throw new Error(validation.error)
      const safetyCheck = validateContentSafety('', description, file.name)
      if (!safetyCheck.safe) throw new Error(safetyCheck.error)
      await new Promise(r => setTimeout(r, 100))
      updateStep('validate', 'done', `${formatBytes(file.size)} ✓`)

      // Step 2: Compress
      updateStep('compress', 'active')
      const compression = await optimizeUploadFile(file)
      const uploadFile = compression.optimizedFile
      if (compression.compressed) {
        const pct = Math.round((1 - compression.optimizedSize / compression.originalSize) * 100)
        updateStep('compress', 'done', `${formatBytes(compression.originalSize)} → ${formatBytes(compression.optimizedSize)} (${pct}% saved)`)
      } else {
        updateStep('compress', 'done', `${formatBytes(compression.optimizedSize)}`)
      }

      // Step 3: Hash
      updateStep('hash', 'active')
      const hash = await sha256(uploadFile)
      updateStep('hash', 'done')

      // Step 4: Duplicate check
      updateStep('duplicate', 'active')
      await new Promise(r => setTimeout(r, 80))
      const existingPaper    = papers.find(p => p.sha256 === hash)
      const existingResource = resources.find(r => r.sha256 === hash)
      if (existingPaper || existingResource) {
        updateStep('duplicate', 'done', 'Already exists — skipped')
        updateStep('upload',    'done', 'Skipped')
        updateStep('meta',      'done', 'Skipped')
        updateStep('publish',   'done', 'Already visible ✓')
        setStatus('duplicate', 'Already in library')
        return 'duplicate'
      }
      updateStep('duplicate', 'done', 'No duplicates ✓')

      // Step 5: Upload to storage
      updateStep('upload', 'active')
      const bucket  = (materialType === 'paper' || materialType === 'lab_paper') ? 'papers' : 'resources'
      const cdnFile = new File([uploadFile], `${hash.slice(0, 12)}_${uploadFile.name}`, { type: uploadFile.type })
      let cdnUrl: string
      try {
        cdnUrl = await uploadFileToStorage(bucket, cdnFile)
      } catch {
        throw new Error('File upload failed. Please check your connection and try again.')
      }
      updateStep('upload', 'done', 'Upload complete ✓')

      // Step 6: Save to DB
      updateStep('meta', 'active')
      const isLab        = materialType === 'lab_paper' || materialType === 'lab_manual'
      const targetSubject = findOrCreateSubject(subject, branch, 'sem1', isLab ? 'lab' : 'theory')
      const branchObj    = BRANCHES.find(b => b.id === branch)
      const autoTitle    = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
      const newId        = `paper-${Date.now()}-${idx}`

      if (materialType === 'paper' || materialType === 'lab_paper') {
        const paperData = {
          id: newId,
          subject_id: targetSubject.id,
          subject_name: targetSubject.name,
          branch_code: branchObj?.code || 'CSE',
          exam_type: (examType || 'midterm') as any,
          exam_label: EXAM_TYPES[examType] || 'Mid Term',
          academic_year: academicYear,
          semester_number: parseInt(targetSubject.semester_id.replace('sem', '')) || 1,
          file_url: cdnUrl,
          uploaded_by: getAnonId(),
          verification_status: 'verified' as const,
          file_size: uploadFile.size,
          sha256: hash,
        }
        await syncPaperToCloud(paperData)
        addPaper(paperData)
      } else {
        const resourceData = {
          id: newId,
          subject_id: targetSubject.id,
          subject_name: targetSubject.name,
          branch_code: branchObj?.code || 'CSE',
          type: (materialType || 'notes') as any,
          title: autoTitle,
          description: description || 'Uploaded study resource',
          file_url: cdnUrl,
          uploaded_by: getAnonId(),
          verification_status: 'verified' as const,
          academic_year: academicYear,
          sha256: hash,
        }
        await syncResourceToCloud(resourceData)
        addResource(resourceData)
      }
      updateStep('meta', 'done', 'Saved ✓')

      // Step 7: Publish
      updateStep('publish', 'active')
      incrementUploadCount()
      updateStep('publish', 'done', 'Live & visible to all students ✓')

      setStatus('done', autoTitle)
      return 'done'
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setStatus('error', msg)
      setSteps(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'error' } : s))
      return 'error'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (fileEntries.length === 0) { setGlobalError('Please add at least one file.'); return }
    if (!branch || !subject)      { setGlobalError('Please select branch and enter subject name.'); return }
    if (!rateLimit.allowed) {
      setGlobalError(`Upload limit reached. Try again after ${new Date(rateLimit.resetAt).toLocaleTimeString()}.`)
      return
    }

    setUploading(true)
    setGlobalError('')
    let done = 0

    for (let i = 0; i < fileEntries.length; i++) {
      if (fileEntries[i].status === 'done' || fileEntries[i].status === 'duplicate') continue
      const result = await uploadSingleFile(fileEntries[i], i)
      if (result === 'done') done++
    }

    setDoneCount(done)
    setUploading(false)
  }

  const handleReset = () => {
    setFileEntries([]); setDescription(''); setGlobalError('')
    setSteps(makeSteps()); setDoneCount(0); setCurrentFileIdx(0)
  }

  const allDone = fileEntries.length > 0 &&
    fileEntries.every(e => e.status === 'done' || e.status === 'duplicate' || e.status === 'error')

  if (allDone && doneCount > 0 && !uploading) {
    const errorCount = fileEntries.filter(e => e.status === 'error').length
    return (
      <div className="page-wrapper" style={{ maxWidth: 560, marginInline: 'auto' }}>
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
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            {doneCount === fileEntries.length
              ? `All ${doneCount} file${doneCount > 1 ? 's' : ''} uploaded!`
              : `${doneCount} of ${fileEntries.length} file${fileEntries.length > 1 ? 's' : ''} uploaded`}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: errorCount ? '0.75rem' : '2rem', lineHeight: 1.7 }}>
            Your materials are now live and available to all SR University students. 🎉
          </p>
          {errorCount > 0 && (
            <p style={{ color: 'var(--color-error-500)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              {errorCount} file{errorCount > 1 ? 's' : ''} failed — you can try uploading again.
            </p>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={handleReset}>Upload More</button>
            {materialType === 'paper' || materialType === 'lab_paper'
              ? <a href="/papers" className="btn btn-secondary">View Papers</a>
              : <a href="/resources" className="btn btn-secondary">View Resources</a>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper" style={{ maxWidth: 700, marginInline: 'auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Upload Material</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Share question papers, notes, and resources with all SR University students.
        </p>
      </div>

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
                placeholder="Type or select subject…"
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

        {/* Multi-file drop zone */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
            <div className="label">
              Files{fileEntries.length > 0 ? ` (${fileEntries.length} selected)` : ' *'}
            </div>
            {fileEntries.length > 0 && !uploading && (
              <button
                type="button"
                style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                + Add more
              </button>
            )}
          </div>

          {/* Drop zone — always visible */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragOver ? 'var(--color-primary-400)' : 'var(--border-base)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: fileEntries.length > 0 ? '1rem 1.5rem' : '2.5rem 1.5rem',
              textAlign: 'center',
              background: dragOver ? 'var(--color-primary-50)' : 'var(--bg-muted)',
              transition: 'all var(--transition-fast)',
              cursor: 'pointer',
            }}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Files size={fileEntries.length > 0 ? 20 : 32} style={{ color: 'var(--text-subtle)', margin: '0 auto 0.5rem' }} />
            <div style={{ fontWeight: 600, fontSize: fileEntries.length > 0 ? '0.85rem' : '1rem', marginBottom: '0.2rem' }}>
              {fileEntries.length > 0 ? 'Drop more files or click to add' : 'Drop files here or click to browse'}
            </div>
            {fileEntries.length === 0 && (
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                PDF, JPEG, PNG, WebP, Word · Max 50 MB each · Multiple files supported
              </div>
            )}
            <input
              id="file-input"
              type="file"
              multiple
              accept={ALLOWED_MIMES.join(',')}
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
          </div>

          {/* File list */}
          {fileEntries.length > 0 && (
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {fileEntries.map((entry, i) => {
                const isCurrentlyProcessing = uploading && i === currentFileIdx && entry.status === 'processing'
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.625rem',
                      padding: '0.625rem 0.875rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid',
                      borderColor: entry.status === 'done'      ? 'var(--color-success-300)'
                                 : entry.status === 'duplicate'  ? 'var(--color-warning-300, #fbbf24)'
                                 : entry.status === 'error'      ? 'var(--color-error-300)'
                                 : entry.status === 'processing' ? 'var(--color-primary-300)'
                                 : 'var(--border-base)',
                      background: entry.status === 'done'       ? 'var(--color-success-50)'
                                : entry.status === 'duplicate'   ? '#fffbeb'
                                : entry.status === 'error'       ? 'var(--color-error-50)'
                                : entry.status === 'processing'  ? 'var(--color-primary-50)'
                                : 'transparent',
                      transition: 'all 0.2s',
                    }}
                  >
                    {/* Status icon */}
                    <div style={{ flexShrink: 0 }}>
                      {entry.status === 'done'       && <CheckCircle size={15} style={{ color: 'var(--color-success-600)' }} />}
                      {entry.status === 'duplicate'  && <CheckCircle size={15} style={{ color: '#d97706' }} />}
                      {entry.status === 'error'      && <AlertCircle size={15} style={{ color: 'var(--color-error-500)' }} />}
                      {entry.status === 'processing' && <Loader size={15} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary-500)' }} />}
                      {entry.status === 'pending'    && <div style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid var(--color-neutral-300)' }} />}
                    </div>

                    {/* File name + detail */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.825rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.file.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {entry.detail
                          ? entry.detail
                          : `${formatBytes(entry.file.size)} · ${entry.file.type || 'file'}`}
                      </div>
                    </div>

                    {/* Remove button (only when not uploading) */}
                    {!uploading && entry.status !== 'done' && (
                      <button type="button" className="btn btn-ghost btn-icon" onClick={() => removeFile(i)}>
                        <X size={13} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Upload progress (current file steps) */}
        {uploading && (
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Processing file {currentFileIdx + 1} of {fileEntries.length}…
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fileEntries[currentFileIdx]?.file.name}
            </div>
            {steps.map(step => (
              <div key={step.id} className={`upload-step ${step.status}`}>
                {step.status === 'done'   ? <CheckCircle size={13} style={{ color: 'var(--color-success-600)', flexShrink: 0 }} /> :
                 step.status === 'active' ? <Loader size={13} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} /> :
                 step.status === 'error'  ? <AlertCircle size={13} style={{ color: 'var(--color-error-500)', flexShrink: 0 }} /> :
                 <div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid var(--color-neutral-300)', flexShrink: 0 }} />}
                <span>{step.label}</span>
                {step.detail && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>— {step.detail}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {globalError && (
          <div className="alert alert-error" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: '0.875rem' }}>{globalError}</div>
          </div>
        )}

        {/* Disclaimer */}
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5, margin: '0' }}>
          By uploading you confirm this is for educational use and agree to our{' '}
          <a href="/terms" style={{ color: 'var(--color-primary-600)', textDecoration: 'underline' }}>Terms of Use</a>
          {' '}and{' '}
          <a href="/privacy" style={{ color: 'var(--color-primary-600)', textDecoration: 'underline' }}>Privacy Policy</a>.
        </p>

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={uploading || fileEntries.length === 0 || !rateLimit.allowed}
        >
          {uploading ? (
            <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Uploading…</>
          ) : fileEntries.length > 1 ? (
            <><Upload size={16} /> Upload {fileEntries.length} Files</>
          ) : (
            <><Upload size={16} /> Submit Upload</>
          )}
        </button>
      </form>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
