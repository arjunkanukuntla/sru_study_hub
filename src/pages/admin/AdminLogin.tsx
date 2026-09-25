import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, Lock } from 'lucide-react'
import { adminLogin } from '@/lib/adminUtils'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [show, setShow]         = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    await new Promise(r => setTimeout(r, 400)) // simulate check
    if (adminLogin(password)) {
      navigate('/admin/dashboard')
    } else {
      setError('Incorrect password. Access denied.')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{
        width: '100%', maxWidth: 420, padding: '0 1.5rem',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 0 40px rgba(99,102,241,0.4)',
          }}>
            <Shield size={30} color="white" />
          </div>
          <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
            Admin Panel
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            SRU Study Hub — Restricted Access
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: '2rem',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Admin Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  autoFocus
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '0.75rem 2.75rem 0.75rem 2.5rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: 10, color: '#f1f5f9',
                    fontSize: '0.9375rem',
                    outline: 'none', fontFamily: 'var(--font-sans)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {error && (
                <p style={{ color: '#f87171', fontSize: '0.8125rem', marginTop: '0.5rem', margin: '0.375rem 0 0' }}>
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              style={{
                padding: '0.875rem',
                background: loading || !password
                  ? 'rgba(99,102,241,0.4)'
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none', borderRadius: 10, color: '#fff',
                fontWeight: 700, fontSize: '0.9375rem', cursor: loading || !password ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.2s',
                boxShadow: loading || !password ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
              }}
            >
              {loading ? 'Verifying…' : 'Access Admin Panel →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: '#475569', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          This area is restricted to authorised administrators only.
        </p>
      </div>
    </div>
  )
}
