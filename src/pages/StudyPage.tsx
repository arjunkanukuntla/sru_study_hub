import { useState, useMemo } from 'react'
import { Brain, Clock, CheckCircle, Circle, BookOpen } from 'lucide-react'
import { BRANCHES, getFrequencyLabel, getFrequencyEmoji } from '@/data/catalog'
import { useAppStore } from '@/lib/store'

const TIME_OPTIONS = [
  { value: '2', label: '2 hours', hours: 2 },
  { value: '6', label: '6 hours', hours: 6 },
  { value: '12', label: '12 hours', hours: 12 },
  { value: '24', label: '1 day', hours: 24 },
  { value: '72', label: '3 days', hours: 72 },
  { value: '168', label: '7 days', hours: 168 },
]

type ChecklistItem = { id: string; label: string; priority: number; done: boolean }

function generatePlan(subjectId: string, hours: number, topics: any[], units: any[]): ChecklistItem[] {
  const sortedTopics = [...topics].sort((a, b) => b.appearances - a.appearances)
  const items: ChecklistItem[] = []

  if (hours <= 2) {
    sortedTopics.slice(0, 3).forEach((t, i) => {
      items.push({ id: t.id, label: `${getFrequencyEmoji(t.appearances)} ${t.name} (Unit ${t.unit_number})`, priority: i + 1, done: false })
    })
    items.push({ id: 'prev', label: '📝 Review any available previous papers', priority: 4, done: false })
  } else if (hours <= 12) {
    sortedTopics.slice(0, 5).forEach((t, i) => {
      items.push({ id: t.id, label: `${getFrequencyEmoji(t.appearances)} ${t.name} (Unit ${t.unit_number}) — ${getFrequencyLabel(t.appearances)}`, priority: i + 1, done: false })
    })
    items.push({ id: 'prev-paper', label: '📄 Previous paper practice', priority: 6, done: false })
    items.push({ id: 'revision', label: '🔄 Quick revision of key formulas/concepts', priority: 7, done: false })
  } else {
    units.forEach((u) => {
      items.push({ id: `u-${u.id}`, label: `📘 Unit ${u.number}: ${u.title}`, priority: u.number, done: false })
    })
    items.push({ id: 'practice', label: '📄 Previous paper practice', priority: units.length + 1, done: false })
    items.push({ id: 'revision', label: '🔄 Full revision', priority: units.length + 2, done: false })
  }

  return items
}

export default function StudyPage() {
  const { subjects, topics: allTopics, units: allUnits } = useAppStore()
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id || '')
  const [selectedTime, setSelectedTime] = useState('6')
  const [checklist, setChecklist] = useState<ChecklistItem[] | null>(null)
  const [generatedFor, setGeneratedFor] = useState<{ subjectId: string; hours: number } | null>(null)

  const subject = subjects.find(s => s.id === selectedSubject)
  const topics = useMemo(() => allTopics.filter(t => t.subject_id === selectedSubject).sort((a, b) => b.appearances - a.appearances), [allTopics, selectedSubject])
  const units = allUnits.filter(u => u.subject_id === selectedSubject)

  const selectedTimeOption = TIME_OPTIONS.find(t => t.value === selectedTime)

  const handleGenerate = () => {
    const hours = parseInt(selectedTime)
    const plan = generatePlan(selectedSubject, hours, topics, units)
    setChecklist(plan)
    setGeneratedFor({ subjectId: selectedSubject, hours })
  }

  const toggleItem = (id: string) => {
    setChecklist(prev => prev?.map(item => item.id === id ? { ...item, done: !item.done } : item) ?? null)
  }

  const completedCount = checklist?.filter(i => i.done).length ?? 0
  const totalCount = checklist?.length ?? 0

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Study Preparation</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Study strategies and last-minute preparation plans
        </p>
      </div>

      {/* Last-Minute Mode Card */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderColor: 'var(--color-primary-200)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.0625rem' }}>Last-Minute Study Mode</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Generate a prioritized study checklist based on historical paper data</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label className="label" htmlFor="study-subject">Subject</label>
            <select
              id="study-subject"
              className="input select"
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
            >
              {subjects.map(s => {
                const branch = BRANCHES.find(b => b.id === s.branch_id)
                return <option key={s.id} value={s.id}>{s.name} ({branch?.code})</option>
              })}
            </select>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="study-time">Available Time</label>
            <select
              id="study-time"
              className="input select"
              value={selectedTime}
              onChange={e => setSelectedTime(e.target.value)}
            >
              {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleGenerate}>
          <Brain size={16} /> Generate Study Plan
        </button>

        <div className="alert alert-info" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
          Plans are generated from available historical paper data. Always refer to your official syllabus.
        </div>
      </div>

      {/* Generated Plan */}
      {checklist && generatedFor && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Clock size={15} style={{ color: 'var(--color-primary-600)' }} />
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                  {selectedTimeOption?.label} Plan — {subjects.find(s => s.id === generatedFor.subjectId)?.name}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {completedCount}/{totalCount} completed · Based on available paper data
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.375rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: completedCount === totalCount ? 'var(--color-success-600)' : 'var(--color-primary-600)' }}>
                {Math.round((completedCount / totalCount) * 100)}% done
              </div>
              <div className="progress-bar" style={{ width: 120 }}>
                <div className="progress-fill" style={{ width: `${(completedCount / totalCount) * 100}%`, background: completedCount === totalCount ? 'var(--color-success-500)' : undefined }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {checklist.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem',
                  background: item.done ? 'var(--color-success-50)' : 'var(--bg-muted)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${item.done ? 'var(--color-success-500)' : 'var(--border-muted)'}`,
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)',
                  transition: 'all var(--transition-fast)',
                  width: '100%',
                }}
              >
                {item.done
                  ? <CheckCircle size={18} style={{ color: 'var(--color-success-600)', flexShrink: 0 }} />
                  : <Circle size={18} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
                }
                <span style={{
                  fontSize: '0.875rem', fontWeight: 500,
                  textDecoration: item.done ? 'line-through' : 'none',
                  color: item.done ? 'var(--text-muted)' : 'var(--text-primary)',
                }}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          {completedCount === totalCount && totalCount > 0 && (
            <div className="alert alert-success" style={{ marginTop: '1rem' }}>
              🎉 All done! Good luck with your exam!
            </div>
          )}
        </div>
      )}

      {/* Strategy cards */}
      <div className="section-header" style={{ marginBottom: '1rem' }}>
        <h2 className="section-title">General Study Strategies</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {[
          {
            title: '7-Day Plan',
            icon: '📅',
            steps: ['Day 1 → Unit 1', 'Day 2 → Unit 2', 'Day 3 → Unit 3', 'Day 4 → Unit 4', 'Day 5 → Unit 5', 'Day 6 → Previous papers', 'Day 7 → Revision'],
          },
          {
            title: '1-Day Emergency Plan',
            icon: '⚡',
            steps: ['Priority 1 → Frequently appeared topics', 'Priority 2 → High-weightage units', 'Priority 3 → Repeated questions', 'Priority 4 → Remaining syllabus'],
          },
          {
            title: 'Paper Practice Strategy',
            icon: '📄',
            steps: ['Solve 2–3 previous papers', 'Note repeated question patterns', 'Identify your weak topics', 'Revise those topics focused', 'Re-attempt weak sections'],
          },
        ].map(({ title, icon, steps }) => (
          <div key={title} className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.875rem' }}>
              <span style={{ fontSize: '1.375rem' }}>{icon}</span>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{title}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start', fontSize: '0.8125rem' }}>
                  <span style={{ flexShrink: 0, width: 18, height: 18, background: 'var(--color-primary-100)', color: 'var(--color-primary-700)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.65rem' }}>
                    {i + 1}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="alert alert-info" style={{ marginTop: '1.5rem' }}>
        <BookOpen size={15} style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.8125rem' }}>
          Study recommendations are based on available historical paper data and general exam preparation best practices.
          Always follow your faculty's guidance and official syllabus.
        </div>
      </div>
    </div>
  )
}
