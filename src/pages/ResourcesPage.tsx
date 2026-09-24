import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Library, Upload } from 'lucide-react'
import { BRANCHES, ACADEMIC_YEARS, RESOURCE_TYPES } from '@/data/catalog'
import { useAppStore } from '@/lib/store'

const TYPE_TABS = [
  { value: '', label: '📚 All' },
  { value: 'syllabus', label: '📘 Syllabus' },
  { value: 'notes', label: '📝 Notes' },
  { value: 'question_bank', label: '📋 Question Banks' },
  { value: 'reference', label: '📖 Reference' },
  { value: 'lab_manual', label: '🧪 Lab Manuals' },
]

export default function ResourcesPage() {
  const resources = useAppStore(state => state.resources)
  const [typeFilter, setTypeFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')

  const filtered = resources.filter(r => {
    if (typeFilter && r.type !== typeFilter) return false
    if (branchFilter && r.branch_code.toLowerCase() !== branchFilter.toLowerCase()) return false
    if (yearFilter && r.academic_year !== yearFilter) return false
    return true
  })

  return (
    <div className="page-wrapper">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Study Resources</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Syllabus, notes, question banks and more
          </p>
        </div>
        <Link to="/upload" className="btn btn-primary btn-sm">
          <Upload size={14} /> Upload Resource
        </Link>
      </div>

      {/* Type tabs */}
      <div className="tabs-list" style={{ marginBottom: '1rem' }}>
        {TYPE_TABS.map(tab => (
          <button
            key={tab.value}
            className={`tab-trigger ${typeFilter === tab.value ? 'active' : ''}`}
            onClick={() => setTypeFilter(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Secondary filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <select className="input select" value={branchFilter} onChange={e => setBranchFilter(e.target.value)} style={{ width: 'auto', minWidth: 140 }} id="res-branch">
          <option value="">All branches</option>
          {BRANCHES.map(b => <option key={b.id} value={b.code}>{b.code}</option>)}
        </select>
        <select className="input select" value={yearFilter} onChange={e => setYearFilter(e.target.value)} style={{ width: 'auto', minWidth: 140 }} id="res-year">
          <option value="">All years</option>
          {ACADEMIC_YEARS.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}
        </select>
        {(branchFilter || yearFilter) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setBranchFilter(''); setYearFilter('') }}>Clear</button>
        )}
      </div>

      {/* Resources list */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Library size={24} /></div>
            <div className="empty-state-title">No resources found</div>
            <div className="empty-state-desc">Upload resources to help fellow students!</div>
            <Link to="/upload" className="btn btn-primary btn-sm">Upload Resource</Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(res => (
            <div key={res.id} className="card card-hover" style={{
              padding: '1rem 1.25rem',
              display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 'var(--radius-md)', flexShrink: 0,
                background: 'var(--color-primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.375rem',
              }}>
                {res.type === 'syllabus' ? '📘' : res.type === 'lab_manual' ? '🧪' : res.type === 'notes' ? '📝' : res.type === 'question_bank' ? '📋' : '📖'}
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.2rem' }}>{res.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{res.description}</div>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-blue">{RESOURCE_TYPES[res.type]}</span>
                  <span className="badge badge-neutral">{res.branch_code}</span>
                  <span className="badge badge-neutral">{res.academic_year}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                {res.file_url ? (
                  <>
                    <a href={res.file_url} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">View</a>
                    <a href={res.file_url} download className="btn btn-secondary btn-sm">Download</a>
                  </>
                ) : (
                  <span className="btn btn-ghost btn-sm" style={{ opacity: 0.4, cursor: 'default' }}>No file</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
