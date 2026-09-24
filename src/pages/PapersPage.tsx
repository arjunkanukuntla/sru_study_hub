import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Upload } from 'lucide-react'
import { BRANCHES, ACADEMIC_YEARS } from '@/data/catalog'
import { PaperCard } from '@/components/papers/PaperCard'
import { useAppStore } from '@/lib/store'

const EXAM_TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'midterm', label: 'Mid Term' },
  { value: 'endterm', label: 'End Term' },
  { value: 'lab_mid', label: 'Lab Mid' },
  { value: 'lab_end', label: 'Lab End' },
  { value: 'supplementary', label: 'Supplementary' },
]

export default function PapersPage() {
  const papers = useAppStore(state => state.papers)
  const [branchFilter, setBranchFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')

  const filtered = useMemo(() => {
    return papers.filter(p => {
      if (branchFilter && p.branch_code.toLowerCase() !== branchFilter.toLowerCase()) return false
      if (typeFilter && p.exam_type !== typeFilter) return false
      if (yearFilter && p.academic_year !== yearFilter) return false
      return true
    })
  }, [papers, branchFilter, typeFilter, yearFilter])

  const hasFilters = branchFilter || typeFilter || yearFilter

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Previous Papers</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {filtered.length} paper{filtered.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Link to="/upload" className="btn btn-primary btn-sm">
          <Upload size={14} /> Upload Paper
        </Link>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="label" htmlFor="paper-branch">Branch</label>
            <select id="paper-branch" className="input select" value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
              <option value="">All branches</option>
              {BRANCHES.map(b => <option key={b.id} value={b.code}>{b.code}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="paper-type">Exam Type</label>
            <select id="paper-type" className="input select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              {EXAM_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="paper-year">Academic Year</label>
            <select id="paper-year" className="input select" value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
              <option value="">All years</option>
              {ACADEMIC_YEARS.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}
            </select>
          </div>
        </div>

        {hasFilters && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginTop: '0.5rem' }}
            onClick={() => { setBranchFilter(''); setTypeFilter(''); setYearFilter('') }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Papers grid */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><FileText size={24} /></div>
            <div className="empty-state-title">No papers found</div>
            <div className="empty-state-desc">
              {hasFilters ? 'Try changing your filters.' : 'No papers uploaded yet. Help the community by uploading one!'}
            </div>
            <Link to="/upload" className="btn btn-primary btn-sm">Upload Paper</Link>
          </div>
        </div>
      ) : (
        <div className="grid-papers">
          {filtered.map(paper => (
            <PaperCard key={paper.id} paper={paper} />
          ))}
        </div>
      )}
    </div>
  )
}
