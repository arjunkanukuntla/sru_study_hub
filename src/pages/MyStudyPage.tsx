import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Star, FileText, Library, Clock, Trash2, BookOpen, Upload } from 'lucide-react'
import { getAnonId } from '@/lib/anonId'
import { useAppStore } from '@/lib/store'

const FAVORITES_KEY = 'sru_favorites'
const RECENT_KEY = 'sru_recent'

type FavoriteItem = { type: 'paper' | 'subject' | 'resource'; id: string; addedAt: string }
type RecentItem = { type: 'paper' | 'subject'; id: string; viewedAt: string }

function loadFavorites(): FavoriteItem[] {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]') } catch { return [] }
}

function loadRecent(): RecentItem[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(loadFavorites)

  const toggle = (type: FavoriteItem['type'], id: string) => {
    setFavorites(prev => {
      const exists = prev.find(f => f.type === type && f.id === id)
      const next = exists
        ? prev.filter(f => !(f.type === type && f.id === id))
        : [...prev, { type, id, addedAt: new Date().toISOString() }]
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
      return next
    })
  }

  const isFav = (type: FavoriteItem['type'], id: string) => favorites.some(f => f.type === type && f.id === id)

  return { favorites, toggle, isFav }
}

export function FavoriteButton({ type, id }: { type: FavoriteItem['type']; id: string }) {
  const { toggle, isFav } = useFavorites()
  const active = isFav(type, id)
  return (
    <button
      className="btn btn-ghost btn-icon"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(type, id) }}
      title={active ? 'Remove from favorites' : 'Add to favorites'}
      style={{ color: active ? '#f59e0b' : 'var(--text-subtle)' }}
      aria-label={active ? 'Remove favorite' : 'Add favorite'}
    >
      <Star size={16} fill={active ? '#f59e0b' : 'none'} />
    </button>
  )
}

export default function MyStudyPage() {
  const { favorites } = useFavorites()
  const [recent, setRecent] = useState<RecentItem[]>(loadRecent)
  const { papers, subjects, resources } = useAppStore()

  const anonId = getAnonId()

  const myUploadedPapers = papers.filter(p => p.uploaded_by === anonId)
  const myUploadedResources = resources.filter(r => r.uploaded_by === anonId)

  const favPapers = favorites.filter(f => f.type === 'paper').map(f => papers.find(p => p.id === f.id)).filter(Boolean)
  const favSubjects = favorites.filter(f => f.type === 'subject').map(f => subjects.find(s => s.id === f.id)).filter(Boolean)
  const favResources = favorites.filter(f => f.type === 'resource').map(f => resources.find(r => r.id === f.id)).filter(Boolean)

  const recentPapers = recent.slice(0, 5).map(r => papers.find(p => p.id === r.id)).filter(Boolean)
  const recentSubjects = recent.filter(r => r.type === 'subject').slice(0, 3).map(r => subjects.find(s => s.id === r.id)).filter(Boolean)

  const clearRecent = () => {
    localStorage.removeItem(RECENT_KEY)
    setRecent([])
  }

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>My Study</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Saved materials and contributions · ID: <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', background: 'var(--bg-muted)', padding: '1px 5px', borderRadius: 3 }}>{anonId}</code>
          </p>
        </div>
        <Link to="/upload" className="btn btn-primary btn-sm">
          <Upload size={14} /> Upload Material
        </Link>
      </div>

      {/* My Uploads */}
      {(myUploadedPapers.length > 0 || myUploadedResources.length > 0) && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="section-header" style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Upload size={16} style={{ color: 'var(--color-primary-600)' }} />
              <h2 className="section-title">My Uploaded Materials ({myUploadedPapers.length + myUploadedResources.length})</h2>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {myUploadedPapers.map(p => (
              <div key={p.id} className="card" style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span className="badge badge-blue">📄 {p.exam_label}</span>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.subject_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.branch_code} · {p.academic_year}</div>
                </div>
                <Link to={`/papers/${p.id}`} className="btn btn-secondary btn-sm">View</Link>
              </div>
            ))}
            {myUploadedResources.map(r => (
              <div key={r.id} className="card" style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span className="badge badge-blue">📚 {r.type}</span>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.subject_name} · {r.branch_code}</div>
                </div>
                <Link to="/resources" className="btn btn-secondary btn-sm">View</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Favorites sections */}
      {favorites.length === 0 && recent.length === 0 ? (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="empty-state">
            <div className="empty-state-icon"><Star size={24} /></div>
            <div className="empty-state-title">Nothing saved yet</div>
            <div className="empty-state-desc">
              Star papers, subjects and resources to save them here. Your saved items are stored on this device.
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link to="/papers" className="btn btn-primary btn-sm">Browse Papers</Link>
              <Link to="/subjects" className="btn btn-secondary btn-sm">Browse Subjects</Link>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Saved subjects */}
          {favSubjects.length > 0 && (
            <div>
              <div className="section-header" style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BookOpen size={15} style={{ color: 'var(--color-accent-500)' }} />
                  <h2 className="section-title">Saved Subjects</h2>
                </div>
              </div>
              <div className="grid-subjects">
                {favSubjects.map(s => s && (
                  <Link key={s.id} to={`/subjects/${s.id}`} className="card card-hover" style={{ padding: '1rem', textDecoration: 'none', display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', flexShrink: 0 }}>📖</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.code}</div>
                    </div>
                    <Star size={14} fill="#f59e0b" color="#f59e0b" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Saved papers */}
          {favPapers.length > 0 && (
            <div>
              <div className="section-header" style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={15} style={{ color: 'var(--color-accent-500)' }} />
                  <h2 className="section-title">Saved Papers</h2>
                </div>
              </div>
              <div className="grid-papers">
                {favPapers.map(p => p && (
                  <Link key={p.id} to={`/papers/${p.id}`} className="card card-hover" style={{ padding: '1rem', textDecoration: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span className="badge badge-blue">{p.exam_label}</span>
                      <Star size={14} fill="#f59e0b" color="#f59e0b" />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{p.subject_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.academic_year} · {p.branch_code}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Saved resources */}
          {favResources.length > 0 && (
            <div>
              <div className="section-header" style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Library size={15} style={{ color: 'var(--color-accent-500)' }} />
                  <h2 className="section-title">Saved Resources</h2>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {favResources.map(r => r && (
                  <div key={r.id} className="card" style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>{r.type === 'syllabus' ? '📘' : r.type === 'notes' ? '📝' : '📋'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.subject_name}</div>
                    </div>
                    <Star size={14} fill="#f59e0b" color="#f59e0b" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recently viewed */}
          {recentPapers.length > 0 && (
            <div>
              <div className="section-header" style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={15} style={{ color: 'var(--text-muted)' }} />
                  <h2 className="section-title" style={{ fontSize: '1rem' }}>Recently Viewed</h2>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error-500)', fontSize: '0.8rem' }} onClick={clearRecent}>
                  <Trash2 size={12} /> Clear
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {recentPapers.map(p => p && (
                  <Link key={p.id} to={`/papers/${p.id}`} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.625rem 0.875rem', background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', textDecoration: 'none', color: 'var(--text-primary)' }}>
                    <Clock size={13} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.subject_name}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.375rem' }}>— {p.exam_label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="alert alert-info" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
        Your saved items are stored locally on this device. They will be available as long as you don't clear your browser data.
      </div>
    </div>
  )
}
