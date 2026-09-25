import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { ArrowLeft, FileText, Library, BarChart3, BookOpen, Brain, Upload, FlaskConical } from 'lucide-react'
import { BRANCHES, getFrequencyLabel, getFrequencyClass, getFrequencyEmoji } from '@/data/catalog'
import { PaperCard } from '@/components/papers/PaperCard'
import { useAppStore } from '@/lib/store'

const TABS = ['Overview', 'Papers', 'Topics', 'Resources'] as const
type Tab = typeof TABS[number]

export default function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('Overview')

  const { subjects, papers, resources, units: allUnits, topics: allTopics } = useAppStore()

  const subject = subjects.find(s => s.id === id)

  if (!subject) {
    return (
      <div className="page-wrapper">
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-title">Subject not found</div>
            <div className="empty-state-desc">This subject doesn't exist or hasn't been added yet.</div>
            <Link to="/subjects" className="btn btn-primary btn-sm">Back to Subjects</Link>
          </div>
        </div>
      </div>
    )
  }

  const branch = BRANCHES.find(b => b.id === subject.branch_id)
  const subjectPapers = papers.filter(p => p.subject_id === id || p.subject_name.toLowerCase() === subject.name.toLowerCase())
  const subjectTopics = allTopics.filter(t => t.subject_id === id).sort((a, b) => b.appearances - a.appearances)
  const subjectResources = resources.filter(r => r.subject_id === id || r.subject_name.toLowerCase() === subject.name.toLowerCase())
  const units = allUnits.filter(u => u.subject_id === id)

  return (
    <div className="page-wrapper">
      {/* Back */}
      <Link to="/subjects" className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem', paddingLeft: 0 }}>
        <ArrowLeft size={15} /> All Subjects
      </Link>

      {/* Subject header */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>{subject.name}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {branch?.code} · Semester {subject.semester_id.replace('sem', '')} · {subject.credits} Credits
            </p>
          </div>
          <span className="badge badge-neutral" style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}>
            {subject.code}
          </span>
        </div>

        {/* Quick stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: '0.75rem',
          marginTop: '1.25rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-base)',
        }}>
          {[
            { label: 'Credits', value: subject.credits },
            { label: 'Units', value: subject.units_count },
            { label: 'Papers', value: subjectPapers.length },
            { label: 'Topics', value: subjectTopics.length },
            { label: 'Resources', value: subjectResources.length },
            { label: 'Type', value: subject.type === 'both' ? 'Theory+Lab' : subject.type },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-700)' }}>{value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-list" style={{ marginBottom: '1.25rem' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            className={`tab-trigger ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Units */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div className="section-header" style={{ marginBottom: '1rem' }}>
              <h2 className="section-title">Syllabus Units</h2>
            </div>
            {units.length === 0 ? (
              <div className="empty-state" style={{ padding: '1.5rem' }}>
                <div className="empty-state-desc">No units added yet.</div>
                <Link to="/upload" className="btn btn-secondary btn-sm">Upload Syllabus</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {units.map(unit => (
                  <div key={unit.id} style={{
                    display: 'flex', gap: '0.75rem',
                    padding: '0.75rem', background: 'var(--bg-muted)',
                    borderRadius: 'var(--radius-md)',
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-primary-100)', color: 'var(--color-primary-700)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.8rem', flexShrink: 0,
                    }}>
                      {unit.number}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{unit.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{unit.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {[
              { label: 'View Papers', to: `/subjects/${id}`, tab: 'Papers', icon: FileText, color: 'var(--color-primary-600)', bg: 'var(--color-primary-50)' },
              { label: 'Study Resources', to: `/subjects/${id}`, tab: 'Resources', icon: Library, color: '#059669', bg: '#ecfdf5' },
              { label: 'Study Plan', to: '/study', icon: Brain, color: '#e11d48', bg: '#fff1f2' },
            ].map(({ label, to, tab, icon: Icon, color, bg }) => (
              <button
                key={label}
                onClick={() => tab ? setActiveTab(tab as Tab) : undefined}
                className="card card-hover"
                style={{
                  padding: '1rem', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', gap: '0.5rem',
                  border: 'none', textAlign: 'left', fontFamily: 'var(--font-sans)',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-md)',
                  background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={17} style={{ color }} />
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Papers' && (
        <div>
          {subjectPapers.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon"><FileText size={24} /></div>
                <div className="empty-state-title">No papers uploaded yet</div>
                <div className="empty-state-desc">
                  Help build SRU Study Hub by uploading previous papers for this subject.
                </div>
                <Link to="/upload" className="btn btn-primary btn-sm">
                  <Upload size={14} /> Upload Paper
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid-papers">
              {subjectPapers.map(paper => (
                <PaperCard key={paper.id} paper={paper} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Topics' && (
        <div>
          <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.8125rem' }}>
              <strong>Disclaimer:</strong> Topic importance is calculated from available uploaded papers only.
              This does not guarantee that these topics will appear in future exams.
            </div>
          </div>

          {subjectTopics.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-title">Not enough data</div>
                <div className="empty-state-desc">Upload more previous papers to generate topic insights.</div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-base)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Topic Frequency</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Based on {subjectPapers.length} uploaded papers</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-muted)', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '0.625rem 1.25rem', textAlign: 'left' }}>Topic</th>
                      <th style={{ padding: '0.625rem 1rem', textAlign: 'center' }}>Unit</th>
                      <th style={{ padding: '0.625rem 1rem', textAlign: 'center' }}>Appearances</th>
                      <th style={{ padding: '0.625rem 1rem', textAlign: 'left' }}>Frequency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectTopics.map((topic, i) => (
                      <tr key={topic.id} style={{ borderTop: '1px solid var(--border-muted)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-muted)' }}>
                        <td style={{ padding: '0.75rem 1.25rem', fontWeight: 600, fontSize: '0.875rem' }}>
                          {getFrequencyEmoji(topic.appearances)} {topic.name}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          Unit {topic.unit_number}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-primary-700)' }}>
                          {topic.appearances}×
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className={`badge ${getFrequencyClass(topic.appearances) === 'freq-very-frequent' ? 'badge-red' : getFrequencyClass(topic.appearances) === 'freq-frequent' ? 'badge-amber' : getFrequencyClass(topic.appearances) === 'freq-moderate' ? 'badge-blue' : 'badge-neutral'}`}>
                            {getFrequencyLabel(topic.appearances)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Resources' && (
        <div>
          {subjectResources.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon"><BookOpen size={24} /></div>
                <div className="empty-state-title">No resources yet</div>
                <div className="empty-state-desc">Upload syllabus, notes, or question banks for this subject.</div>
                <Link to="/upload" className="btn btn-primary btn-sm">Upload Resource</Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {subjectResources.map(res => (
                <div key={res.id} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-md)', flexShrink: 0,
                    background: 'var(--color-primary-50)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem',
                  }}>
                    {res.type === 'syllabus' ? (
                      <BookOpen size={18} style={{ color: 'var(--color-primary-600)' }} />
                    ) : res.type === 'lab_manual' ? (
                      <FlaskConical size={18} style={{ color: '#7c3aed' }} />
                    ) : res.type === 'notes' ? (
                      <FileText size={18} style={{ color: '#059669' }} />
                    ) : (
                      <Library size={18} style={{ color: '#d97706' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.2rem' }}>{res.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{res.description}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.375rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-blue">{res.type.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    {res.file_url ? (
                      <a href={res.file_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">View</a>
                    ) : (
                      <span className="btn btn-ghost btn-sm" style={{ cursor: 'default', opacity: 0.5 }}>No file</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
