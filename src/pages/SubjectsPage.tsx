import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Search, Plus, X } from 'lucide-react'
import { BRANCHES, STUDY_YEARS } from '@/data/catalog'
import { useAppStore } from '@/lib/store'

const SEMESTER_OPTIONS = ['1', '2', '3', '4', '5', '6', '7', '8']

export default function SubjectsPage() {
  const subjects = useAppStore(state => state.subjects)
  const papers = useAppStore(state => state.papers)
  const addSubject = useAppStore(state => state.addSubject)

  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [semFilter, setSemFilter] = useState('')

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [newSubName, setNewSubName] = useState('')
  const [newSubCode, setNewSubCode] = useState('')
  const [newSubBranch, setNewSubBranch] = useState('cse')
  const [newSubSem, setNewSubSem] = useState('sem1')
  const [newSubCredits, setNewSubCredits] = useState(3)
  const [newSubPosType, setNewSubPosType] = useState<'theory' | 'lab' | 'both'>('theory')

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubName.trim()) return

    const code = newSubCode.trim() || newSubName.trim().split(' ').map(w => w[0]?.toUpperCase() || '').join('').slice(0, 4) + '101'
    addSubject({
      name: newSubName.trim(),
      code,
      branch_id: newSubBranch,
      semester_id: newSubSem,
      credits: newSubCredits,
      type: newSubPosType,
      units_count: 5,
    })

    setNewSubName('')
    setNewSubCode('')
    setShowAddModal(false)
  }

  const filtered = useMemo(() => {
    return subjects.filter((s) => {
      const q = search.toLowerCase().trim()
      const branch = BRANCHES.find(b => b.id === s.branch_id)

      if (q) {
        const matchesName = s.name.toLowerCase().includes(q)
        const matchesCode = s.code.toLowerCase().includes(q)
        const matchesBranchId = s.branch_id.toLowerCase().includes(q)
        const matchesBranchCode = branch?.code.toLowerCase().includes(q)
        const matchesBranchName = branch?.name.toLowerCase().includes(q)
        if (!matchesName && !matchesCode && !matchesBranchId && !matchesBranchCode && !matchesBranchName) {
          return false
        }
      }

      if (branchFilter && s.branch_id !== branchFilter) return false

      if (yearFilter) {
        const semNum = parseInt(s.semester_id.replace('sem', '')) || 1
        const targetYear = parseInt(yearFilter) || 1
        const expectedSems = [targetYear * 2 - 1, targetYear * 2]
        if (!expectedSems.includes(semNum)) return false
      }

      if (semFilter && !s.semester_id.includes(semFilter)) return false
      return true
    })
  }, [subjects, search, branchFilter, yearFilter, semFilter])

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Subjects</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {filtered.length} subject{filtered.length !== 1 ? 's' : ''} available
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
          <Plus size={14} /> Add Subject
        </button>
      </div>

      {/* Add Subject Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 480, padding: '1.5rem', background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Add New Subject</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateSubject} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className="form-group">
                <label className="label" htmlFor="new-sub-name">Subject Name *</label>
                <input
                  id="new-sub-name"
                  className="input"
                  value={newSubName}
                  onChange={e => setNewSubName(e.target.value)}
                  placeholder="e.g. Electrical Circuit Analysis"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="label" htmlFor="new-sub-code">Code (optional)</label>
                  <input
                    id="new-sub-code"
                    className="input"
                    value={newSubCode}
                    onChange={e => setNewSubCode(e.target.value)}
                    placeholder="e.g. EEE301"
                  />
                </div>
                <div className="form-group">
                  <label className="label" htmlFor="new-sub-branch">Branch *</label>
                  <select
                    id="new-sub-branch"
                    className="input select"
                    value={newSubBranch}
                    onChange={e => setNewSubBranch(e.target.value)}
                  >
                    {BRANCHES.map(b => <option key={b.id} value={b.id}>{b.code} ({b.name})</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="label" htmlFor="new-sub-sem">Semester *</label>
                  <select
                    id="new-sub-sem"
                    className="input select"
                    value={newSubSem}
                    onChange={e => setNewSubSem(e.target.value)}
                  >
                    {SEMESTER_OPTIONS.map(s => <option key={s} value={`sem${s}`}>Semester {s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label" htmlFor="new-sub-type">Type *</label>
                  <select
                    id="new-sub-type"
                    className="input select"
                    value={newSubPosType}
                    onChange={e => setNewSubPosType(e.target.value as any)}
                  >
                    <option value="theory">Theory</option>
                    <option value="lab">Lab</option>
                    <option value="both">Theory + Lab</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {/* Search */}
          <div style={{ position: 'relative', gridColumn: 'span 2' }}>
            <Search size={14} style={{
              position: 'absolute', left: '0.75rem', top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-subtle)',
            }} />
            <input
              className="input"
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Search subjects or codes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="subject-search"
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="branch-filter">Branch</label>
            <select
              id="branch-filter"
              className="input select"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value="">All branches</option>
              {BRANCHES.map(b => (
                <option key={b.id} value={b.id}>{b.code}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="year-filter">Year</label>
            <select
              id="year-filter"
              className="input select"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="">All years</option>
              {STUDY_YEARS.map(y => (
                <option key={y.id} value={y.id}>{y.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="sem-filter">Semester</label>
            <select
              id="sem-filter"
              className="input select"
              value={semFilter}
              onChange={(e) => setSemFilter(e.target.value)}
            >
              <option value="">All semesters</option>
              {SEMESTER_OPTIONS.map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Subject grid */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><BookOpen size={24} /></div>
            <div className="empty-state-title">No subjects found</div>
            <div className="empty-state-desc">Add your course subjects or upload previous papers to get started.</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
                <Plus size={14} /> Add Subject
              </button>
              <Link to="/upload" className="btn btn-secondary btn-sm">Upload Material</Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid-subjects">
          {filtered.map((subject) => {
            const branch = BRANCHES.find(b => b.id === subject.branch_id)
            const paperCount = papers.filter(p => p.subject_id === subject.id || p.subject_name.toLowerCase() === subject.name.toLowerCase()).length
            return (
              <Link
                key={subject.id}
                to={`/subjects/${subject.id}`}
                className="card card-hover"
                style={{
                  padding: '1.25rem',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >

                {/* Subject type indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: 38, height: 38,
                    background: subject.type === 'lab' ? '#f5f3ff' : subject.type === 'both' ? '#ecfdf5' : 'var(--color-primary-50)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.125rem',
                  }}>
                    {subject.type === 'lab' ? '🧪' : subject.type === 'both' ? '📚' : '📖'}
                  </div>
                  <div>
                    <span className="badge badge-neutral">{subject.code}</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', lineHeight: 1.3, marginBottom: '0.375rem' }}>
                    {subject.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {branch?.code} · Sem {subject.semester_id.replace('sem', '')} · {subject.credits} credits
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-blue">{subject.units_count} Units</span>
                  <span className="badge badge-neutral">{subject.type === 'both' ? 'Theory + Lab' : subject.type === 'lab' ? 'Lab' : 'Theory'}</span>
                  {paperCount > 0 && <span className="badge badge-green">{paperCount} Papers</span>}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
