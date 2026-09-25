import { Wrench } from 'lucide-react'

export default function MaintenancePage({ message }: { message?: string }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-sans)', padding: '1.5rem', textAlign: 'center',
    }}>
      <div style={{ maxWidth: 500, width: '100%' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem', boxShadow: '0 0 40px rgba(245,158,11,0.3)',
        }}>
          <Wrench size={38} color="white" />
        </div>
        <h1 style={{ color: '#fff', fontSize: '1.875rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Under Scheduled Maintenance
        </h1>
        <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          {message || 'SRU Study Hub is currently undergoing scheduled system updates to improve performance. We will be back online shortly!'}
        </p>
        <div style={{
          display: 'inline-block', background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
          padding: '0.75rem 1.25rem', color: '#94a3b8', fontSize: '0.8125rem',
        }}>
          Thank you for your patience. — SRU Study Hub Team
        </div>
      </div>
    </div>
  )
}
