import { useState } from 'react'
import { Flag, X, Send, AlertCircle, CheckCircle } from 'lucide-react'
import { submitReport } from '@/lib/adminUtils'
import { getAnonId } from '@/lib/anonId'

const REASONS = [
  'Incorrect / wrong paper',
  'Cannot open / corrupted file',
  'Wrong subject or branch',
  'Duplicate of existing paper',
  'Inappropriate content',
  'Copyright infringement',
  'Other',
]

interface Props {
  paperId?: string
  resourceId?: string
  label?: string
}

export default function ReportButton({ paperId, resourceId, label }: Props) {
  const [open, setOpen]       = useState(false)
  const [reason, setReason]   = useState('')
  const [message, setMessage] = useState('')
  const [state, setState]     = useState<'idle' | 'loading' | 'success' | 'error' | 'already'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason) return
    setState('loading')
    const result = await submitReport({
      paperId, resourceId, reason, message: message.trim() || undefined,
      anonId: getAnonId(),
    })
    if (result.alreadyReported) { setState('already'); return }
    setState(result.ok ? 'success' : 'error')
  }

  const handleClose = () => {
    setOpen(false)
    setTimeout(() => { setReason(''); setMessage(''); setState('idle') }, 300)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={label || 'Report this file'}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-subtle)', fontSize: '0.72rem',
          padding: '4px 6px', borderRadius: 4,
          transition: 'color 0.15s',
          fontFamily: 'var(--font-sans)',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-error-500)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-subtle)')}
      >
        <Flag size={11} />
        {label && <span>{label}</span>}
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          onClick={handleClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)', zIndex: 9000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-elevated, #fff)', borderRadius: 16,
              padding: '1.5rem', width: '100%', maxWidth: 440,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Flag size={16} style={{ color: 'var(--color-error-500)' }} />
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>Report this file</span>
              </div>
              <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            {/* States */}
            {state === 'success' && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <CheckCircle size={40} style={{ color: 'var(--color-success-600)', margin: '0 auto 0.75rem' }} />
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Report submitted</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Thank you. Our team will review this file shortly.
                </p>
                <button className="btn btn-secondary btn-sm" onClick={handleClose} style={{ marginTop: '1rem' }}>Close</button>
              </div>
            )}

            {state === 'already' && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <AlertCircle size={36} style={{ color: '#f59e0b', margin: '0 auto 0.75rem' }} />
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Already reported</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  You have already reported this file. Our team will review it.
                </p>
                <button className="btn btn-secondary btn-sm" onClick={handleClose} style={{ marginTop: '1rem' }}>Close</button>
              </div>
            )}

            {state === 'error' && (
              <div style={{ marginBottom: '1rem' }}>
                <div className="alert alert-error" style={{ fontSize: '0.8375rem' }}>
                  Something went wrong. Please try again.
                </div>
              </div>
            )}

            {(state === 'idle' || state === 'loading' || state === 'error') && (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    Reason *
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {REASONS.map(r => (
                      <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', fontSize: '0.875rem', padding: '0.375rem 0.5rem', borderRadius: 6, background: reason === r ? 'var(--color-primary-50)' : 'transparent', transition: 'background 0.1s' }}>
                        <input
                          type="radio" name="reason" value={r}
                          checked={reason === r} onChange={() => setReason(r)}
                          style={{ accentColor: 'var(--color-primary-500)' }}
                        />
                        {r}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--text-primary)' }}>
                    Additional message <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <textarea
                    className="input"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={2}
                    maxLength={300}
                    placeholder="Any extra details to help us review…"
                    style={{ resize: 'vertical', fontSize: '0.875rem' }}
                  />
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '0.2rem' }}>
                    {message.length}/300
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!reason || state === 'loading'}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  {state === 'loading'
                    ? 'Submitting…'
                    : <><Send size={14} /> Submit Report</>}
                </button>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
                  Reports are reviewed by the SRU Study Hub team. False reports are ignored.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
