import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield, Trash2, Flag, Settings, LogOut, RefreshCw,
  CheckCircle, AlertTriangle, FileText, BookOpen, Bell,
  Eye, ChevronDown, ChevronUp, X,
} from 'lucide-react'
import { isAdminLoggedIn, adminLogout, fetchAllPapersAdmin, fetchAllResourcesAdmin,
  fetchAllReports, deleteContent, updateReportStatus, fetchSiteSettings,
  updateSiteSettings, type Report } from '@/lib/adminUtils'
import { formatBytes } from '@/lib/fileUtils'

type Tab = 'papers' | 'resources' | 'reports' | 'settings'

const REPORT_AUTO_FLAG = 10 // auto-flag threshold

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('papers')
  const [papers, setPapers]       = useState<any[]>([])
  const [resources, setResources] = useState<any[]>([])
  const [reports, setReports]     = useState<Report[]>([])
  const [settings, setSettings]   = useState({ maintenance_mode: false, maintenance_message: '', announcement: '' })
  const [loading, setLoading]     = useState(true)
  const [deleting, setDeleting]   = useState<string | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)
  const [toast, setToast]         = useState('')

  useEffect(() => {
    if (!isAdminLoggedIn()) { navigate('/admin'); return }
    loadAll()
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [p, r, rep, s] = await Promise.all([
      fetchAllPapersAdmin(),
      fetchAllResourcesAdmin(),
      fetchAllReports(),
      fetchSiteSettings(),
    ])
    setPapers(p)
    setResources(r)
    setReports(rep)
    setSettings(s)
    setLoading(false)
  }, [])

  const handleDelete = async (table: 'papers' | 'resources', id: string, fileUrl: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    const result = await deleteContent(table, id, fileUrl)
    if (result.ok) {
      if (table === 'papers') setPapers(prev => prev.filter(p => p.id !== id))
      else setResources(prev => prev.filter(r => r.id !== id))
      showToast(`✅ "${name}" deleted successfully.`)
    } else {
      showToast(`❌ Delete failed: ${result.error}`)
    }
    setDeleting(null)
  }

  const handleReportAction = async (reportId: string, status: 'reviewed' | 'dismissed') => {
    await updateReportStatus(reportId, status)
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r))
    showToast(`Report marked as ${status}.`)
  }

  const handleDeleteFromReport = async (report: Report) => {
    const table = report.paper_id ? 'papers' : 'resources'
    const id    = (report.paper_id || report.resource_id)!
    const allItems = table === 'papers' ? papers : resources
    const item  = allItems.find(p => p.id === id)
    if (!confirm(`Delete this ${table === 'papers' ? 'paper' : 'resource'}? This cannot be undone.`)) return
    setDeleting(id)
    const result = await deleteContent(table, id, item?.file_url)
    if (result.ok) {
      if (table === 'papers') setPapers(prev => prev.filter(p => p.id !== id))
      else setResources(prev => prev.filter(r => r.id !== id))
      setReports(prev => prev.map(r =>
        (r.paper_id === id || r.resource_id === id) ? { ...r, status: 'dismissed' } : r
      ))
      showToast('Content deleted and reports dismissed.')
    }
    setDeleting(null)
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    await updateSiteSettings(settings)
    setSavingSettings(false)
    showToast('✅ Settings saved.')
  }

  const logout = () => { adminLogout(); navigate('/admin') }

  // Stats
  const openReports    = reports.filter(r => r.status === 'open').length
  const flaggedPapers  = papers.filter(p => (p.report_count || 0) >= REPORT_AUTO_FLAG).length
  const flaggedRes     = resources.filter(r => (r.report_count || 0) >= REPORT_AUTO_FLAG).length

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#94a3b8', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', fontFamily: 'var(--font-sans)', color: '#e2e8f0' }}>
      {/* Top bar */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0 1.5rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Shield size={20} style={{ color: '#818cf8' }} />
          <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#f1f5f9' }}>SRU Admin Panel</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {settings.maintenance_mode && (
            <span style={{ background: '#f59e0b20', color: '#f59e0b', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4, border: '1px solid #f59e0b40' }}>
              🚧 MAINTENANCE ON
            </span>
          )}
          <button onClick={loadAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem' }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={logout} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', padding: '4px 10px' }}>
            <LogOut size={12} /> Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, marginInline: 'auto', padding: '1.5rem' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.875rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Papers', value: papers.length, icon: <FileText size={18} />, color: '#6366f1' },
            { label: 'Total Resources', value: resources.length, icon: <BookOpen size={18} />, color: '#0ea5e9' },
            { label: 'Open Reports', value: openReports, icon: <Flag size={18} />, color: openReports > 0 ? '#f59e0b' : '#22c55e' },
            { label: 'Flagged Content', value: flaggedPapers + flaggedRes, icon: <AlertTriangle size={18} />, color: (flaggedPapers + flaggedRes) > 0 ? '#ef4444' : '#22c55e' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12, padding: '1rem 1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f1f5f9' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '0.25rem', width: 'fit-content' }}>
          {([
            { id: 'papers',    label: 'Papers',    icon: <FileText size={14} /> },
            { id: 'resources', label: 'Resources', icon: <BookOpen size={14} /> },
            { id: 'reports',   label: `Reports${openReports > 0 ? ` (${openReports})` : ''}`, icon: <Flag size={14} /> },
            { id: 'settings',  label: 'Settings',  icon: <Settings size={14} /> },
          ] as { id: Tab; label: string; icon: React.ReactNode }[]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.5rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontSize: '0.8125rem', fontWeight: 600,
              background: tab === t.id ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
              color: tab === t.id ? '#fff' : '#64748b',
              transition: 'all 0.15s',
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'papers' && (
          <ContentTable
            items={papers}
            type="papers"
            deleting={deleting}
            onDelete={(id, url, name) => handleDelete('papers', id, url, name)}
            flagThreshold={REPORT_AUTO_FLAG}
          />
        )}

        {tab === 'resources' && (
          <ContentTable
            items={resources}
            type="resources"
            deleting={deleting}
            onDelete={(id, url, name) => handleDelete('resources', id, url, name)}
            flagThreshold={REPORT_AUTO_FLAG}
          />
        )}

        {tab === 'reports' && (
          <ReportsTable
            reports={reports}
            papers={papers}
            resources={resources}
            deleting={deleting}
            onStatusChange={handleReportAction}
            onDelete={handleDeleteFromReport}
          />
        )}

        {tab === 'settings' && (
          <SettingsPanel
            settings={settings}
            onChange={patch => setSettings(prev => ({ ...prev, ...patch }))}
            onSave={handleSaveSettings}
            saving={savingSettings}
          />
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
          color: '#f1f5f9', padding: '0.75rem 1.25rem', borderRadius: 10,
          fontSize: '0.875rem', fontWeight: 500, zIndex: 9999,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast}
        </div>
      )}
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ContentTable({ items, type, deleting, onDelete, flagThreshold }: {
  items: any[]
  type: 'papers' | 'resources'
  deleting: string | null
  onDelete: (id: string, url: string, name: string) => void
  flagThreshold: number
}) {
  const [search, setSearch] = useState('')
  const filtered = items.filter(item => {
    const q = search.toLowerCase()
    return !q || (item.subject_name || '').toLowerCase().includes(q) || (item.title || '').toLowerCase().includes(q)
  })

  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{type === 'papers' ? 'Papers' : 'Resources'} ({items.length})</span>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search…"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 10px', color: '#e2e8f0', fontSize: '0.8rem', outline: 'none', fontFamily: 'var(--font-sans)' }}
        />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)', fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {['Subject / Title', 'Branch', type === 'papers' ? 'Exam' : 'Type', 'Size', 'Reports', 'Actions'].map(h => (
                <th key={h} style={{ padding: '0.625rem 1rem', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#475569' }}>No items found.</td></tr>
            ) : filtered.map(item => {
              const isFlag = (item.report_count || 0) >= flagThreshold
              return (
                <tr key={item.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: isFlag ? 'rgba(239,68,68,0.05)' : 'transparent' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.825rem', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {isFlag && <AlertTriangle size={12} style={{ color: '#ef4444', flexShrink: 0 }} />}
                      {item.subject_name || item.title || '—'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '0.1rem' }}>{item.id?.slice(0, 20)}…</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#94a3b8' }}>{item.branch_code || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#94a3b8' }}>{item.exam_type || item.type || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{item.file_size ? formatBytes(item.file_size) : '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                      background: isFlag ? 'rgba(239,68,68,0.15)' : (item.report_count || 0) > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.1)',
                      color: isFlag ? '#f87171' : (item.report_count || 0) > 0 ? '#fbbf24' : '#4ade80',
                    }}>
                      {item.report_count || 0} {isFlag ? '⚠️ flagged' : ''}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <a href={item.file_url} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: 'none', borderRadius: 5, padding: '4px 8px', fontSize: '0.72rem', fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}>
                        <Eye size={11} /> View
                      </a>
                      <button
                        onClick={() => onDelete(item.id, item.file_url, item.subject_name || item.title || item.id)}
                        disabled={deleting === item.id}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: 'none', borderRadius: 5, padding: '4px 8px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                        {deleting === item.id ? '…' : <><Trash2 size={11} /> Delete</>}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ReportsTable({ reports, papers, resources, deleting, onStatusChange, onDelete }: {
  reports: Report[]
  papers: any[]
  resources: any[]
  deleting: string | null
  onStatusChange: (id: string, status: 'reviewed' | 'dismissed') => void
  onDelete: (report: Report) => void
}) {
  const [filter, setFilter] = useState<'all' | 'open' | 'reviewed' | 'dismissed'>('open')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter)

  const getItemName = (r: Report) => {
    if (r.paper_id) {
      const p = papers.find(p => p.id === r.paper_id)
      return p ? `${p.subject_name} (${p.exam_type || ''})` : r.paper_id
    }
    if (r.resource_id) {
      const res = resources.find(x => x.id === r.resource_id)
      return res ? res.title || res.subject_name : r.resource_id
    }
    return 'Unknown'
  }

  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Reports ({reports.length})</span>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {(['all', 'open', 'reviewed', 'dismissed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '3px 10px', borderRadius: 5, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: 600,
              background: filter === f ? '#6366f1' : 'rgba(255,255,255,0.05)',
              color: filter === f ? '#fff' : '#64748b',
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#475569' }}>
          <CheckCircle size={32} style={{ margin: '0 auto 0.75rem', color: '#22c55e' }} />
          <div style={{ fontWeight: 600 }}>No {filter === 'all' ? '' : filter} reports</div>
        </div>
      ) : filtered.map(r => (
        <div key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: r.status === 'open' ? 'rgba(245,158,11,0.03)' : 'transparent' }}>
          <div
            onClick={() => setExpanded(expanded === r.id ? null : r.id)}
            style={{ padding: '0.875rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}
          >
            <Flag size={14} style={{ color: r.status === 'open' ? '#f59e0b' : '#475569', flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#e2e8f0' }}>
                  {getItemName(r)}
                </span>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700, padding: '1px 7px', borderRadius: 3,
                  background: r.status === 'open' ? 'rgba(245,158,11,0.2)' : r.status === 'reviewed' ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.2)',
                  color: r.status === 'open' ? '#fbbf24' : r.status === 'reviewed' ? '#4ade80' : '#94a3b8',
                }}>
                  {r.status}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#475569', marginLeft: 'auto' }}>
                  {new Date(r.reported_at).toLocaleDateString()}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                <strong>Reason:</strong> {r.reason}
                {r.message && <> · "{r.message}"</>}
              </div>
            </div>
            {expanded === r.id ? <ChevronUp size={14} style={{ color: '#475569', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: '#475569', flexShrink: 0 }} />}
          </div>

          {expanded === r.id && (
            <div style={{ padding: '0 1.25rem 1rem 3.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {r.status === 'open' && (
                <button onClick={() => onStatusChange(r.id, 'reviewed')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: 'none', borderRadius: 5, padding: '5px 10px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                  <CheckCircle size={11} /> Mark Reviewed
                </button>
              )}
              {r.status !== 'dismissed' && (
                <button onClick={() => onStatusChange(r.id, 'dismissed')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: 'none', borderRadius: 5, padding: '5px 10px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                  <X size={11} /> Dismiss
                </button>
              )}
              <button
                onClick={() => onDelete(r)}
                disabled={deleting !== null}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: 'none', borderRadius: 5, padding: '5px 10px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                <Trash2 size={11} /> Delete Content
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function SettingsPanel({ settings, onChange, onSave, saving }: {
  settings: { maintenance_mode: boolean; maintenance_message: string; announcement: string }
  onChange: (patch: Partial<typeof settings>) => void
  onSave: () => void
  saving: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Maintenance */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1.5rem' }}>
        <div style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Maintenance Mode
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: '1rem' }}>
          <div
            onClick={() => onChange({ maintenance_mode: !settings.maintenance_mode })}
            style={{
              width: 44, height: 24, borderRadius: 12, position: 'relative', cursor: 'pointer',
              background: settings.maintenance_mode ? '#6366f1' : 'rgba(255,255,255,0.1)',
              transition: 'background 0.2s',
            }}
          >
            <div style={{
              position: 'absolute', top: 3, left: settings.maintenance_mode ? 23 : 3,
              width: 18, height: 18, borderRadius: '50%', background: '#fff',
              transition: 'left 0.2s',
            }} />
          </div>
          <span style={{ fontSize: '0.875rem', color: settings.maintenance_mode ? '#818cf8' : '#64748b', fontWeight: 600 }}>
            {settings.maintenance_mode ? 'Maintenance mode is ON' : 'Maintenance mode is OFF'}
          </span>
        </label>
        <div>
          <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.375rem' }}>Maintenance Message</label>
          <textarea
            value={settings.maintenance_message}
            onChange={e => onChange({ maintenance_message: e.target.value })}
            rows={3}
            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0', padding: '0.625rem', fontSize: '0.8375rem', resize: 'vertical', outline: 'none', fontFamily: 'var(--font-sans)' }}
          />
        </div>
      </div>

      {/* Announcement banner */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1.5rem' }}>
        <div style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bell size={16} style={{ color: '#818cf8' }} /> Site Announcement Banner
        </div>
        <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
          Shown as a banner at the top of every page. Leave empty to hide.
        </p>
        <textarea
          value={settings.announcement}
          onChange={e => onChange({ announcement: e.target.value })}
          rows={2}
          placeholder="e.g. Mid-term papers for EEE 2025-26 have been added!"
          style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0', padding: '0.625rem', fontSize: '0.8375rem', resize: 'vertical', outline: 'none', fontFamily: 'var(--font-sans)' }}
        />
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        style={{
          background: saving ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          border: 'none', borderRadius: 10, color: '#fff', padding: '0.875rem',
          fontWeight: 700, fontSize: '0.9375rem', cursor: saving ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-sans)', boxShadow: saving ? 'none' : '0 4px 20px rgba(99,102,241,0.3)',
        }}
      >
        {saving ? 'Saving…' : '💾 Save Settings'}
      </button>
    </div>
  )
}
