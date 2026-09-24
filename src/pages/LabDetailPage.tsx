import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { ArrowLeft, FlaskConical } from 'lucide-react'
import { PaperCard } from '@/components/papers/PaperCard'
import { useAppStore } from '@/lib/store'

const TABS = ['Experiments', 'Viva Questions', 'Lab Papers'] as const
type Tab = typeof TABS[number]

export default function LabDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('Experiments')
  const [selectedExp, setSelectedExp] = useState<string | null>(null)

  const { subjects, papers, labExperiments, vivaQuestions } = useAppStore()

  const subject = subjects.find(s => s.id === id)
  const labId = `lab-${id?.replace('sub-', '')}`
  const experiments = labExperiments.filter(e => e.lab_id === labId)
  const allViva = vivaQuestions.filter(v => v.lab_id === labId)
  const vivaToShow = selectedExp ? allViva.filter(v => v.experiment_id === selectedExp) : allViva
  const labPapers = papers.filter(p => (p.subject_id === id || p.subject_name.toLowerCase() === subject?.name.toLowerCase()) && (p.exam_type === 'lab_mid' || p.exam_type === 'lab_end'))

  if (!subject) {
    return (
      <div className="page-wrapper">
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-title">Lab not found</div>
            <Link to="/labs" className="btn btn-primary btn-sm">Back to Labs</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <Link to="/labs" className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem', paddingLeft: 0 }}>
        <ArrowLeft size={15} /> All Labs
      </Link>

      {/* Header */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem', background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '1px solid #ddd6fe' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FlaskConical size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{subject.name}</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{subject.code}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span className="badge badge-blue">{experiments.length} Experiments</span>
          <span className="badge badge-blue">{allViva.length} Viva Questions</span>
          <span className="badge badge-blue">{labPapers.length} Lab Papers</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-list" style={{ marginBottom: '1.25rem' }}>
        {TABS.map(tab => (
          <button key={tab} className={`tab-trigger ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Experiments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {experiments.length === 0 ? (
            <div className="card"><div className="empty-state"><div className="empty-state-title">No experiments yet</div><Link to="/upload" className="btn btn-primary btn-sm">Upload Lab Manual</Link></div></div>
          ) : experiments.map(exp => (
            <div key={exp.id} className="card" style={{ padding: '1.125rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', background: '#7c3aed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.875rem', flexShrink: 0 }}>
                  {exp.number}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{exp.title}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{exp.description}</div>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ marginTop: '0.5rem', paddingLeft: 0, color: 'var(--color-primary-600)', fontSize: '0.8rem' }}
                    onClick={() => { setActiveTab('Viva Questions'); setSelectedExp(exp.id) }}
                  >
                    View viva questions →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Viva Questions' && (
        <div>
          {/* Experiment filter */}
          <div className="filter-bar" style={{ marginBottom: '1rem' }}>
            <button className={`chip ${!selectedExp ? 'active' : ''}`} onClick={() => setSelectedExp(null)}>All experiments</button>
            {experiments.map(exp => (
              <button key={exp.id} className={`chip ${selectedExp === exp.id ? 'active' : ''}`} onClick={() => setSelectedExp(exp.id)}>
                Exp {exp.number}
              </button>
            ))}
          </div>

          {vivaToShow.length === 0 ? (
            <div className="card"><div className="empty-state"><div className="empty-state-title">No viva questions yet</div></div></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {vivaToShow.map((vq, i) => (
                <details key={vq.id} className="card" style={{ padding: '1rem 1.125rem' }}>
                  <summary style={{ fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', listStyle: 'none', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <span style={{ flexShrink: 0, color: 'var(--color-primary-600)', fontWeight: 800 }}>Q{i + 1}.</span>
                    <span>{vq.question}</span>
                  </summary>
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-muted)', fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, paddingLeft: '1.5rem' }}>
                    <strong style={{ color: 'var(--color-success-600)' }}>Answer: </strong>{vq.answer}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Lab Papers' && (
        <div>
          {labPapers.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon"><FlaskConical size={24} /></div>
                <div className="empty-state-title">No lab papers yet</div>
                <div className="empty-state-desc">Upload previous lab exam papers for this subject.</div>
                <Link to="/upload" className="btn btn-primary btn-sm">Upload Lab Paper</Link>
              </div>
            </div>
          ) : (
            <div className="grid-papers">
              {labPapers.map(paper => <PaperCard key={paper.id} paper={paper} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
