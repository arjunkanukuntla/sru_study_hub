import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { ArrowLeft, Download, ExternalLink, Flag, Share2, FileText } from 'lucide-react'
import { EXAM_TYPES } from '@/data/catalog'
import { formatBytes } from '@/lib/fileUtils'
import { useAppStore } from '@/lib/store'

export default function PaperDetailPage() {
  const { id } = useParams<{ id: string }>()
  const papers = useAppStore(state => state.papers)
  const paper = papers.find(p => p.id === id)
  const [reported, setReported] = useState(false)

  if (!paper) {
    return (
      <div className="page-wrapper">
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-title">Paper not found</div>
            <div className="empty-state-desc">This paper doesn't exist or has been removed.</div>
            <Link to="/papers" className="btn btn-primary btn-sm">Back to Papers</Link>
          </div>
        </div>
      </div>
    )
  }

  const handleShare = async () => {
    try {
      await navigator.share({ title: paper.subject_name, text: `${paper.exam_label} – ${paper.academic_year}`, url: window.location.href })
    } catch {
      await navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard')
    }
  }

  return (
    <div className="page-wrapper">
      {/* Back */}
      <Link to="/papers" className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem', paddingLeft: 0 }}>
        <ArrowLeft size={15} /> All Papers
      </Link>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 320px',
        gap: '1.25rem',
        alignItems: 'start',
      }}
      className="paper-detail-grid"
      >
        {/* PDF Viewer */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--border-base)',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'var(--bg-muted)',
          }}>
            <FileText size={15} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {paper.subject_name} — {paper.exam_label}
            </span>
          </div>

          {paper.file_url ? (
            paper.file_url.startsWith('data:image/') || paper.file_url.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', background: 'var(--bg-base)', minHeight: 400 }}>
                <img
                  src={paper.file_url}
                  alt={`${paper.subject_name} ${paper.exam_label}`}
                  style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
                />
              </div>
            ) : (
              <iframe
                src={paper.file_url}
                title={`${paper.subject_name} ${paper.exam_label}`}
                style={{ width: '100%', height: 'min(75vh, 700px)', border: 'none', display: 'block' }}
              />
            )
          ) : (
            <div className="empty-state" style={{ minHeight: 320 }}>
              <div className="empty-state-icon"><FileText size={28} /></div>
              <div className="empty-state-title">No file uploaded yet</div>
              <div className="empty-state-desc">
                The file for this paper has not been uploaded yet.
              </div>
              <Link to="/upload" className="btn btn-primary btn-sm">Upload This Paper</Link>
            </div>
          )}
        </div>

        {/* Sidebar info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Paper info */}
          <div className="card" style={{ padding: '1.25rem' }}>

            <h1 style={{ fontSize: '1.125rem', fontWeight: 800, lineHeight: 1.3, marginBottom: '0.25rem' }}>
              {paper.subject_name}
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              {paper.exam_label} · {paper.academic_year}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'Exam Type', value: EXAM_TYPES[paper.exam_type] || paper.exam_label },
                { label: 'Academic Year', value: paper.academic_year },
                { label: 'Branch', value: paper.branch_code },
                { label: 'Semester', value: `Semester ${paper.semester_number}` },
                paper.page_count ? { label: 'Pages', value: String(paper.page_count) } : null,
                paper.file_size ? { label: 'File Size', value: formatBytes(paper.file_size) } : null,
                { label: 'Uploaded By', value: paper.uploaded_by },
              ].filter((x): x is { label: string; value: string } => x !== null).map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontWeight: 600, textAlign: 'right' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {paper.file_url ? (
              <>
                <a href={paper.file_url} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                  <ExternalLink size={14} /> Open in Browser
                </a>
                <a href={paper.file_url} download className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                  <Download size={14} /> Download
                </a>
              </>
            ) : (
              <span className="btn btn-ghost" style={{ justifyContent: 'center', opacity: 0.5, cursor: 'default' }}>
                No file available
              </span>
            )}
            <button className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={handleShare}>
              <Share2 size={14} /> Share
            </button>
            {!reported ? (
              <button
                className="btn btn-ghost btn-sm"
                style={{ justifyContent: 'center', color: 'var(--color-error-500)', fontSize: '0.8rem' }}
                onClick={() => setReported(true)}
              >
                <Flag size={12} /> Report incorrect file
              </button>
            ) : (
              <div className="alert alert-success" style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}>
                ✓ Report received. Thank you!
              </div>
            )}
          </div>

          {/* Subject link */}
          <Link to={`/subjects/${paper.subject_id}`} className="btn btn-secondary" style={{ justifyContent: 'center' }}>
            View Subject Page
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .paper-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
