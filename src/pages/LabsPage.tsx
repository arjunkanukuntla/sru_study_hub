import { Link } from 'react-router-dom'
import { FlaskConical, ArrowRight } from 'lucide-react'
import { useAppStore } from '@/lib/store'

export default function LabsPage() {
  const { subjects, labExperiments, vivaQuestions } = useAppStore()
  const LAB_SUBJECTS = subjects.filter(s => s.type === 'lab' || s.type === 'both')
  return (
    <div className="page-wrapper">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Lab Resources</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Lab papers, experiments, viva questions and manuals
          </p>
        </div>
        <Link to="/upload" className="btn btn-primary btn-sm">
          <FlaskConical size={14} /> Upload Lab Material
        </Link>
      </div>

      {LAB_SUBJECTS.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><FlaskConical size={24} /></div>
            <div className="empty-state-title">No lab subjects yet</div>
            <div className="empty-state-desc">Upload lab papers or experiments to get started.</div>
            <Link to="/upload" className="btn btn-primary btn-sm">Upload Lab Material</Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {LAB_SUBJECTS.map(subject => {
            const experiments = labExperiments.filter(e => e.lab_id === `lab-${subject.id.replace('sub-', '')}`)
            const vivaCount = vivaQuestions.filter(v => v.lab_id === `lab-${subject.id.replace('sub-', '')}`).length

            return (
              <div key={subject.id} className="card" style={{ overflow: 'hidden' }}>
                {/* Lab header */}
                <div style={{
                  padding: '1.125rem 1.25rem',
                  background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                  borderBottom: '1px solid var(--border-base)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 'var(--radius-md)',
                      background: '#7c3aed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FlaskConical size={20} color="#fff" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem' }}>{subject.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {subject.code} · {experiments.length} experiments · {vivaCount} viva questions
                      </div>
                    </div>
                  </div>
                  <Link to={`/labs/${subject.id}`} className="btn btn-secondary btn-sm">
                    View Lab <ArrowRight size={13} />
                  </Link>
                </div>

                {/* Experiments list */}
                {experiments.length > 0 && (
                  <div style={{ padding: '0.875rem 1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                      Experiments
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      {experiments.slice(0, 4).map(exp => (
                        <div key={exp.id} style={{
                          display: 'flex', gap: '0.625rem', alignItems: 'flex-start',
                          fontSize: '0.875rem',
                        }}>
                          <span style={{
                            flexShrink: 0, width: 22, height: 22,
                            background: 'var(--color-primary-100)', color: 'var(--color-primary-700)',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '0.72rem',
                          }}>
                            {exp.number}
                          </span>
                          <div>
                            <span style={{ fontWeight: 600 }}>{exp.title}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}> — {exp.description}</span>
                          </div>
                        </div>
                      ))}
                      {experiments.length > 4 && (
                        <Link to={`/labs/${subject.id}`} style={{ fontSize: '0.8125rem', color: 'var(--color-primary-600)', fontWeight: 600, marginTop: '0.25rem' }}>
                          +{experiments.length - 4} more experiments →
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
