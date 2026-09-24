import { useState, useMemo } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { BarChart3, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  UNIT_DISTRIBUTION, BRANCHES, getFrequencyLabel, getFrequencyClass, getFrequencyEmoji
} from '@/data/catalog'
import { useAppStore } from '@/lib/store'

export default function AnalyticsPage() {
  const { subjects, papers: allPapers, topics: allTopics } = useAppStore()
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id || '')

  const subject = subjects.find(s => s.id === selectedSubject)
  const topics = useMemo(() => allTopics.filter(t => t.subject_id === selectedSubject).sort((a, b) => b.appearances - a.appearances), [allTopics, selectedSubject])
  const papers = allPapers.filter(p => p.subject_id === selectedSubject)

  // Build topic chart data
  const topicChartData = topics.slice(0, 8).map(t => ({
    name: t.name.length > 20 ? t.name.slice(0, 18) + '…' : t.name,
    appearances: t.appearances,
    fill: t.appearances >= 6 ? '#dc2626' : t.appearances >= 4 ? '#d97706' : '#3b82f6',
  }))

  // Unit distribution data
  const unitData = subject?.id === 'sub-dsa' ? UNIT_DISTRIBUTION : []

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Exam Analytics</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Historical topic frequency from uploaded papers</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="alert alert-warning" style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
        <div style={{ fontSize: '0.8125rem', lineHeight: 1.6 }}>
          <strong>Important Disclaimer:</strong> All analytics are based exclusively on available uploaded papers.
          Topic frequency represents historical appearances only — not predictions of future exam questions.
          Frequency labels ("Very Frequent", "Frequent") describe past patterns only.
        </div>
      </div>

      {/* Subject selector */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
        <div className="form-group">
          <label className="label" htmlFor="analytics-subject">Select Subject</label>
          <select
            id="analytics-subject"
            className="input select"
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            style={{ maxWidth: 400 }}
          >
            {subjects.map(s => {
              const branch = BRANCHES.find(b => b.id === s.branch_id)
              return (
                <option key={s.id} value={s.id}>
                  {s.name} ({branch?.code})
                </option>
              )
            })}
          </select>
        </div>
      </div>

      {/* Paper count warning */}
      {papers.length < 2 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><BarChart3 size={24} /></div>
            <div className="empty-state-title">Not enough papers</div>
            <div className="empty-state-desc">
              Upload at least 2 previous papers for this subject to generate meaningful analytics.
            </div>
            <Link to="/upload" className="btn btn-primary btn-sm">Upload Paper</Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Stats row */}
          <div className="grid-stats">
            <div className="stat-card">
              <div className="stat-label">Papers analyzed</div>
              <div className="stat-value">{papers.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Topics tracked</div>
              <div className="stat-value">{topics.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Most frequent</div>
              <div className="stat-value" style={{ fontSize: '1rem', lineHeight: 1.3 }}>{topics[0]?.name || '—'}</div>
              {topics[0] && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Appeared {topics[0].appearances}×</div>}
            </div>
          </div>

          {/* Topic Frequency Bar Chart */}
          {topicChartData.length > 0 && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '1rem' }}>
                📊 Topic Frequency (based on {papers.length} uploaded papers)
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topicChartData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-primary)' }} width={140} />
                  <Tooltip
                    formatter={(value) => [`${value} appearances`, 'Count']}
                    contentStyle={{ fontSize: '0.8125rem', borderRadius: 8, border: '1px solid var(--border-base)' }}
                  />
                  <Bar dataKey="appearances" radius={[0, 4, 4, 0]}>
                    {topicChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 10, height: 10, background: '#dc2626', borderRadius: 2, display: 'inline-block' }} /> Very Frequent (6+)</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 10, height: 10, background: '#d97706', borderRadius: 2, display: 'inline-block' }} /> Frequent (4–5)</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 10, height: 10, background: '#3b82f6', borderRadius: 2, display: 'inline-block' }} /> Moderate (2–3)</span>
              </div>
            </div>
          )}

          {/* Unit distribution pie chart */}
          {unitData.length > 0 && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '1rem' }}>
                🥧 Unit Weightage Distribution (based on available papers)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '1rem', alignItems: 'center' }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={unitData}
                      dataKey="percentage"
                      nameKey="unit"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                      labelLine={false}
                    >
                      {unitData.map((entry: { color: string }, i: number) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v}%`, 'Weight']} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {unitData.map((u: { unit: string; label: string; percentage: number; color: string }) => (
                    <div key={u.unit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                      <span style={{ width: 10, height: 10, background: u.color, borderRadius: 2, flexShrink: 0 }} />
                      <span style={{ fontWeight: 600 }}>{u.unit}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{u.label}</span>
                      <span style={{ fontWeight: 700, color: u.color, marginLeft: 'auto' }}>{u.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Topic frequency table */}
          {topics.length > 0 && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-base)', fontWeight: 700, fontSize: '0.9375rem' }}>
                🔥 Important Topics — Historical Frequency
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-muted)', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '0.625rem 1.25rem', textAlign: 'left' }}>Topic</th>
                      <th style={{ padding: '0.625rem 1rem', textAlign: 'center' }}>Unit</th>
                      <th style={{ padding: '0.625rem 1rem', textAlign: 'center' }}>Appearances</th>
                      <th style={{ padding: '0.625rem 1rem', textAlign: 'left' }}>Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topics.map((topic, i) => (
                      <tr key={topic.id} style={{ borderTop: '1px solid var(--border-muted)', background: i % 2 === 1 ? 'var(--bg-muted)' : 'transparent' }}>
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
              <div style={{ padding: '0.75rem 1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-muted)' }}>
                Based on {papers.length} uploaded papers · Importance calculated from historical frequency only.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
