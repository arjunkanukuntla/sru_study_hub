import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Search, BookOpen, FileText, Library, X } from 'lucide-react'
import { BRANCHES } from '@/data/catalog'
import type { Subject, Paper, Resource } from '@/data/catalog'
import { debounce } from '@/lib/fileUtils'
import { PaperCard } from '@/components/papers/PaperCard'
import { useAppStore } from '@/lib/store'

type SearchResult = {
  subjects: Subject[]
  papers: Paper[]
  resources: Resource[]
}

// Local search — over reactive app store (no external API)
function localSearch(query: string): SearchResult {
  const q = query.toLowerCase().trim()
  if (!q || q.length < 2) return { subjects: [], papers: [], resources: [] }

  const { subjects, papers, resources } = useAppStore.getState()

  return {
    subjects: subjects.filter(s => {
      const b = BRANCHES.find(b => b.id === s.branch_id)
      return (
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.branch_id.toLowerCase().includes(q) ||
        b?.code.toLowerCase().includes(q) ||
        b?.name.toLowerCase().includes(q)
      )
    }),
    papers: papers.filter(p =>
      p.subject_name.toLowerCase().includes(q) ||
      p.academic_year.includes(q) ||
      p.branch_code.toLowerCase().includes(q) ||
      p.exam_label.toLowerCase().includes(q)
    ),
    resources: resources.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.subject_name.toLowerCase().includes(q) ||
      r.type.includes(q) ||
      r.description.toLowerCase().includes(q)
    ),
  }
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQ = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQ)
  const [displayQuery, setDisplayQuery] = useState(initialQ)
  const [results, setResults] = useState<SearchResult>(() => localSearch(initialQ))
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Debounced search — 300ms delay, no API needed for local search
  const debouncedSearch = useMemo(() =>
    debounce((...args: unknown[]) => {
      const q = args[0] as string
      const r = localSearch(q)
      setResults(r)
      setDisplayQuery(q)
      if (q) setSearchParams({ q }, { replace: true })
      else setSearchParams({}, { replace: true })
    }, 300),
    [setSearchParams]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    debouncedSearch(val)
  }

  const handleClear = () => {
    setQuery('')
    setResults({ subjects: [], papers: [], resources: [] })
    setDisplayQuery('')
    setSearchParams({})
    inputRef.current?.focus()
  }

  const totalResults = results.subjects.length + results.papers.length + results.resources.length
  const hasQuery = displayQuery.length >= 2

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Search</h1>
      </div>

      {/* Large search bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        background: 'var(--bg-surface)',
        border: '2px solid var(--color-primary-300)',
        borderRadius: 'var(--radius-xl)',
        padding: '0.75rem 1.25rem',
        marginBottom: '1.5rem',
        boxShadow: '0 0 0 4px var(--color-primary-50)',
      }}>

        <Search size={20} style={{ color: 'var(--color-primary-500)', flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={handleChange}
          placeholder="Search subjects, papers, topics, resources…"
          style={{
            border: 'none', background: 'transparent', outline: 'none',
            flex: 1, fontSize: '1rem', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)',
          }}
          id="search-input"
          aria-label="Search SRU Study Hub"
        />
        {query && (
          <button onClick={handleClear} className="btn btn-ghost btn-icon" style={{ padding: '0.25rem', flexShrink: 0 }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Suggestions when empty */}
      {!hasQuery && (
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
            Try searching for
          </div>
          <div className="filter-bar" style={{ flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {[
              'Data Structures Mid Term', 'AVL tree', 'Python lab', 'DBMS syllabus',
              '2025 end term', 'Machine Learning', 'CSE-AIML', 'viva questions',
            ].map(s => (
              <button
                key={s}
                className="chip"
                onClick={() => { setQuery(s); debouncedSearch(s) }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {hasQuery && (
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            {totalResults === 0
              ? `No results for "${displayQuery}"`
              : `${totalResults} result${totalResults !== 1 ? 's' : ''} for "${displayQuery}"`
            }
          </div>

          {/* Subjects */}
          {results.subjects.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <BookOpen size={15} style={{ color: 'var(--color-primary-500)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Subjects ({results.subjects.length})</span>
              </div>
              <div className="grid-subjects">
                {results.subjects.map(s => {
                  const branch = BRANCHES.find(b => b.id === s.branch_id)
                  return (
                    <Link key={s.id} to={`/subjects/${s.id}`} className="card card-hover" style={{ padding: '1rem', textDecoration: 'none', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', flexShrink: 0 }}>📖</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{s.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.code} · {branch?.code} · Sem {s.semester_id.replace('sem', '')}</div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Papers */}
          {results.papers.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <FileText size={15} style={{ color: 'var(--color-primary-500)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Papers ({results.papers.length})</span>
              </div>
              <div className="grid-papers">
                {results.papers.map(p => <PaperCard key={p.id} paper={p} />)}
              </div>
            </div>
          )}

          {/* Resources */}
          {results.resources.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Library size={15} style={{ color: 'var(--color-primary-500)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Resources ({results.resources.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {results.resources.map(r => (
                  <div key={r.id} className="card" style={{ padding: '0.875rem 1.125rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>
                      {r.type === 'syllabus' ? '📘' : r.type === 'lab_manual' ? '🧪' : r.type === 'notes' ? '📝' : '📋'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.subject_name} · {r.type.replace('_', ' ')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalResults === 0 && (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon"><Search size={24} /></div>
                <div className="empty-state-title">No results found</div>
                <div className="empty-state-desc">
                  Try a different search. You can also upload missing papers and resources.
                </div>
                <Link to="/upload" className="btn btn-primary btn-sm">Upload Material</Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
