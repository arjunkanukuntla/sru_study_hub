import { Link } from 'react-router-dom'
import { FileText, Download, Eye } from 'lucide-react'
import type { Paper } from '@/data/catalog'
import { EXAM_TYPES } from '@/data/catalog'
import { formatBytes } from '@/lib/fileUtils'

interface PaperCardProps {
  paper: Paper
}

const EXAM_TYPE_COLORS: Record<string, { badge: string; bg: string; color: string }> = {
  midterm:       { badge: 'badge-blue',    bg: 'var(--color-primary-50)', color: 'var(--color-primary-600)' },
  endterm:       { badge: 'badge-red',     bg: '#fef2f2',                  color: '#dc2626' },
  lab_mid:       { badge: 'badge-neutral', bg: '#f5f3ff',                  color: '#7c3aed' },
  lab_end:       { badge: 'badge-neutral', bg: '#f5f3ff',                  color: '#7c3aed' },
  supplementary: { badge: 'badge-amber',   bg: 'var(--color-accent-50)',   color: 'var(--color-accent-600)' },
}

export function PaperCard({ paper }: PaperCardProps) {
  const colors = EXAM_TYPE_COLORS[paper.exam_type] || EXAM_TYPE_COLORS.midterm

  return (
    <div className="card card-hover" style={{ padding: '1.125rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', overflow: 'hidden' }}>


      {/* Type + year row */}
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
        <span className={`badge ${colors.badge}`}>{EXAM_TYPES[paper.exam_type] || paper.exam_label}</span>
        <span className="badge badge-neutral">{paper.academic_year}</span>
      </div>

      {/* Subject name */}
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.9375rem', lineHeight: 1.3, marginBottom: '0.25rem' }}>
          {paper.subject_name}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {paper.branch_code} · Semester {paper.semester_number}
        </div>
      </div>

      {/* File info */}
      {(paper.page_count || paper.file_size) && (
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
          {paper.page_count && <span>{paper.page_count} pages</span>}
          {paper.file_size && <span>{formatBytes(paper.file_size)}</span>}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
        <Link
          to={`/papers/${paper.id}`}
          className="btn btn-primary btn-sm"
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <Eye size={13} /> View Paper
        </Link>
        {paper.file_url ? (
          <a href={paper.file_url} download className="btn btn-secondary btn-sm" title="Download">
            <Download size={13} />
          </a>
        ) : (
          <span className="btn btn-secondary btn-sm" style={{ opacity: 0.4, cursor: 'not-allowed' }} title="No file yet">
            <Download size={13} />
          </span>
        )}
      </div>
    </div>
  )
}
