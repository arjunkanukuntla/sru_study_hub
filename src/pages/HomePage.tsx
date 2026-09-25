import { Link } from 'react-router-dom'
import {
  FileText, FlaskConical, Library, BarChart3, Brain, Search,
  ArrowRight, BookOpen, TrendingUp, Upload, Star
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

const CATEGORY_CARDS = [
  {
    title: 'Previous Papers',
    desc: 'Mid-term, end-term and previous-year question papers.',
    to: '/papers',
    icon: FileText,
    color: 'var(--color-primary-600)',
    bg: 'var(--color-primary-50)',
  },
  {
    title: 'Lab Resources',
    desc: 'Lab papers, experiments, viva questions and manuals.',
    to: '/labs',
    icon: FlaskConical,
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
  {
    title: 'Study Resources',
    desc: 'Syllabus, notes and question banks.',
    to: '/resources',
    icon: Library,
    color: '#059669',
    bg: '#ecfdf5',
  },
  {
    title: 'Study Prep',
    desc: 'Prioritized topics and last-minute preparation plans.',
    to: '/study',
    icon: Brain,
    color: '#e11d48',
    bg: '#fff1f2',
  },
  {
    title: 'Search Everything',
    desc: 'Search across subjects, papers and resources.',
    to: '/search',
    icon: Search,
    color: '#0891b2',
    bg: '#ecfeff',
  },
]

export default function HomePage() {
  const { subjects, papers, resources } = useAppStore()

  const STATS = [
    { value: String(subjects.length),  label: 'Subjects',  icon: BookOpen },
    { value: String(papers.length),    label: 'Papers',    icon: FileText },
    { value: String(resources.length), label: 'Resources', icon: Library },
  ]

  return (
    <div className="page-wrapper">
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, var(--color-primary-900) 0%, var(--color-primary-700) 60%, var(--color-primary-600) 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: 'clamp(2rem, 6vw, 3.5rem) clamp(1.25rem, 5vw, 3rem)',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 220, height: 220,
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: '30%',
          width: 300, height: 300,
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />

        <div className="badge badge-amber" style={{ marginBottom: '1rem' }}>
          <Star size={10} /> SR University Academic Resource Hub
        </div>

        <h1 style={{
          fontSize: 'clamp(1.75rem, 5vw, 2.75rem)',
          fontWeight: 900,
          color: '#fff',
          lineHeight: 1.15,
          marginBottom: '0.875rem',
          letterSpacing: '-0.03em',
        }}>
          SRU Study Hub
        </h1>

        <p style={{
          fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
          color: 'rgba(255,255,255,0.8)',
          maxWidth: 540,
          lineHeight: 1.7,
          marginBottom: '1.75rem',
        }}>
          Previous papers, syllabi, lab materials, important topics and exam insights —
          organized specifically for <strong style={{ color: '#fff' }}>SR University</strong> students.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/subjects" className="btn btn-lg" style={{
            background: '#fff',
            color: 'var(--color-primary-800)',
            borderColor: '#fff',
          }}>
            <BookOpen size={18} />
            Find My Subject
          </Link>
          <Link to="/papers" className="btn btn-lg" style={{
            background: 'rgba(255,255,255,0.12)',
            color: '#fff',
            borderColor: 'rgba(255,255,255,0.25)',
          }}>
            <FileText size={18} />
            Browse Papers
          </Link>
        </div>
      </section>

      {/* Stats */}
      <div className="grid-stats" style={{ marginBottom: '2rem' }}>
        {STATS.map(({ value, label, icon: Icon }) => (
          <div key={label} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Icon size={16} style={{ color: 'var(--color-primary-500)' }} />
              <span className="stat-label">{label}</span>
            </div>
            <div className="stat-value">{value}</div>
          </div>
        ))}
      </div>

      {/* Category cards */}
      <div className="section-header">
        <h2 className="section-title">What are you looking for?</h2>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        {CATEGORY_CARDS.map(({ title, desc, to, icon: Icon, color, bg }) => (
          <Link
            key={to}
            to={to}
            className="card card-hover"
            style={{
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              textDecoration: 'none',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              width: 44, height: 44,
              background: bg,
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color,
            }}>
              <Icon size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {title}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {desc}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color, fontSize: '0.8125rem', fontWeight: 600 }}>
              Explore <ArrowRight size={13} />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick access — Recent papers */}
      <div className="section-header">
        <h2 className="section-title">Recent Papers</h2>
        <Link to="/papers" className="btn btn-ghost btn-sm" style={{ color: 'var(--color-primary-600)' }}>
          View all <ArrowRight size={13} />
        </Link>
      </div>

      <div className="grid-papers" style={{ marginBottom: '2rem' }}>
        {papers.slice(0, 3).map((paper) => (
          <Link
            key={paper.id}
            to={`/papers/${paper.id}`}
            className="card card-hover"
            style={{ padding: '1.125rem', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                {paper.subject_name}
              </div>
              <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                <span className="badge badge-blue">{paper.exam_label}</span>
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {paper.academic_year} · {paper.branch_code} · Sem {paper.semester_number}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <span className="btn btn-secondary btn-sm">View Paper</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Upload CTA */}
      <div className="card" style={{
        padding: '1.5rem',
        background: 'linear-gradient(135deg, var(--color-primary-50), #f0fdf4)',
        border: '1px solid var(--color-primary-100)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
        marginBottom: '2rem',
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} style={{ color: 'var(--color-primary-600)' }} />
            Help build SRU Study Hub
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Upload previous papers or study materials. No account required.
          </div>
        </div>
        <Link to="/upload" className="btn btn-primary">
          <Upload size={16} />
          Upload Material
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
        <div>
          <strong>About SRU Study Hub</strong><br />
          This is a student-built utility for SR University. All uploaded content is community-contributed and does not represent official SR University documents unless verified.
        </div>
      </div>
    </div>
  )
}
