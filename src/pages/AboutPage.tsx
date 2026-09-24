import { Link } from 'react-router-dom'
import { GraduationCap, Upload, BookOpen, FileText } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="page-wrapper" style={{ maxWidth: 780, marginInline: 'auto' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary-900), var(--color-primary-700))',
        borderRadius: 'var(--radius-xl)',
        padding: '2.5rem 2rem',
        marginBottom: '2rem',
        textAlign: 'center',
        color: '#fff',
      }}>
        <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-xl)', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '2rem' }}>
          <GraduationCap size={34} color="#fff" />
        </div>
        <h1 style={{ fontSize: '1.875rem', color: '#fff', marginBottom: '0.625rem' }}>SRU Study Hub</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
          A student-built academic resource platform for SR University students.
          Built to help students find previous papers, understand exam patterns, and prepare effectively.
        </p>
      </div>

      {/* What it is */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>What is SRU Study Hub?</h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '1rem' }}>
          SRU Study Hub is a student utility platform — not a commercial product. Its only purpose is to help
          SR University students find and organize academic material: previous exam papers, lab resources,
          syllabi, and study materials.
        </p>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>
          The platform includes analytics that show which topics have historically appeared in uploaded papers.
          These analytics are based purely on community-uploaded materials and <strong>do not represent official
          SR University predictions or endorsements</strong>.
        </p>
      </div>

      {/* Important disclaimer */}
      <div className="alert alert-warning" style={{ marginBottom: '1.25rem' }}>
        <div style={{ lineHeight: 1.7 }}>
          <strong>Important Disclaimers:</strong>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <li>This is a student project — not an official SR University platform.</li>
            <li>Topic frequency analytics are based on uploaded papers only — not exam predictions.</li>
            <li>Community-uploaded documents are not verified as official unless explicitly marked.</li>
            <li>Always refer to your faculty and official university materials.</li>
            <li>No personal data is collected. Users are identified only by anonymous random IDs.</li>
          </ul>
        </div>
      </div>

      {/* Features */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Features</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {[
            { icon: '📄', title: 'Previous Papers', desc: 'Mid-term and end-term papers organized by subject and year' },
            { icon: '🧪', title: 'Lab Resources', desc: 'Lab papers, experiments, viva questions and manuals' },
            { icon: '📚', title: 'Study Resources', desc: 'Syllabus, notes and question banks' },
            { icon: '📊', title: 'Exam Analytics', desc: 'Historical topic frequency from uploaded papers' },
            { icon: '🎯', title: 'Study Planner', desc: 'Personalized study plans based on available time' },
            { icon: '🔍', title: 'Smart Search', desc: 'Search across all subjects, papers and resources' },
            { icon: '⬆️', title: 'Community Upload', desc: 'Students contribute papers — no login required' },
            { icon: '🔒', title: 'Privacy First', desc: 'No accounts, no tracking — anonymous IDs only' },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ padding: '0.875rem', background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '1.375rem', marginBottom: '0.375rem' }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.2rem' }}>{title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>Privacy & Data</h2>
        <div style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '0.875rem' }}>
          <p>SRU Study Hub is designed with privacy first:</p>
          <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <li>No user registration or login required.</li>
            <li>You are identified only by a random anonymous ID (e.g., <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>user_7f3a92c1</code>) stored in your browser.</li>
            <li>No IP addresses are stored or displayed publicly.</li>
            <li>No personal data is collected or sold.</li>
            <li>All saved favorites and study progress are stored locally on your device only.</li>
          </ul>
        </div>
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '2rem' }}>
        <Link to="/papers" className="btn btn-primary">
          <FileText size={16} /> Browse Papers
        </Link>
        <Link to="/subjects" className="btn btn-secondary">
          <BookOpen size={16} /> Explore Subjects
        </Link>
        <Link to="/upload" className="btn btn-secondary">
          <Upload size={16} /> Upload Material
        </Link>
      </div>
    </div>
  )
}
