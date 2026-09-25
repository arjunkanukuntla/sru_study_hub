import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Analytics } from '@vercel/analytics/react'
import { BookOpen } from 'lucide-react'
import { RootLayout } from '@/components/layout/RootLayout'
import { getAnonId } from '@/lib/anonId'
import { useAppStore } from '@/lib/store'
import { fetchSiteSettings, isLocalEnvironment, type SiteSettings } from '@/lib/adminUtils'

// Lazy load all pages for optimal bundle splitting
const HomePage          = lazy(() => import('@/pages/HomePage'))
const SubjectsPage      = lazy(() => import('@/pages/SubjectsPage'))
const SubjectDetailPage  = lazy(() => import('@/pages/SubjectDetailPage'))
const PapersPage        = lazy(() => import('@/pages/PapersPage'))
const PaperDetailPage   = lazy(() => import('@/pages/PaperDetailPage'))
const LabsPage          = lazy(() => import('@/pages/LabsPage'))
const LabDetailPage     = lazy(() => import('@/pages/LabDetailPage'))
const ResourcesPage     = lazy(() => import('@/pages/ResourcesPage'))
const AnalyticsPage     = lazy(() => import('@/pages/AnalyticsPage'))
const StudyPage         = lazy(() => import('@/pages/StudyPage'))
const SearchPage        = lazy(() => import('@/pages/SearchPage'))
const UploadPage        = lazy(() => import('@/pages/UploadPage'))
const MyStudyPage       = lazy(() => import('@/pages/MyStudyPage'))
const AboutPage         = lazy(() => import('@/pages/AboutPage'))
const TermsPage         = lazy(() => import('@/pages/TermsPage'))
const PrivacyPage       = lazy(() => import('@/pages/PrivacyPage'))
const AdminLogin        = lazy(() => import('@/pages/admin/AdminLogin'))
const AdminDashboard    = lazy(() => import('@/pages/admin/AdminDashboard'))
const MaintenancePage  = lazy(() => import('@/pages/MaintenancePage'))

// React Query client — aggressive caching, minimal refetching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:    5 * 60 * 1000,  // 5 minutes
      gcTime:       30 * 60 * 1000, // 30 minutes
      retry:        1,
      refetchOnWindowFocus: false,
    },
  },
})

// Initialize anonymous ID on app load
getAnonId()

// Loading fallback — minimal, fast
function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: 200, padding: '2rem',
    }}>
      <div style={{
        width: 36, height: 36,
        border: '3px solid var(--color-primary-100)',
        borderTopColor: 'var(--color-primary-600)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function App() {
  const initCloudSync = useAppStore(state => state.initCloudSync)
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const isLocal = isLocalEnvironment()

  useEffect(() => {
    initCloudSync()
    fetchSiteSettings().then(s => setSettings(s)).catch(() => {})
  }, [initCloudSync])

  const isAdminRoute = window.location.pathname.startsWith('/admin')

  if (settings?.maintenance_mode && !isAdminRoute) {
    return (
      <Suspense fallback={<PageLoader />}>
        <MaintenancePage message={settings.maintenance_message} />
      </Suspense>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Admin Routes (Local Environment Only) */}
            {isLocal && (
              <>
                <Route path="/admin"           element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
              </>
            )}

            {/* Public Routes (within main layout) */}
            <Route element={<RootLayout />}>
              <Route path="/"             element={<HomePage />} />
              <Route path="/subjects"     element={<SubjectsPage />} />
              <Route path="/subjects/:id" element={<SubjectDetailPage />} />
              <Route path="/papers"       element={<PapersPage />} />
              <Route path="/papers/:id"   element={<PaperDetailPage />} />
              <Route path="/labs"         element={<LabsPage />} />
              <Route path="/labs/:id"     element={<LabDetailPage />} />
              <Route path="/resources"    element={<ResourcesPage />} />
              <Route path="/analytics"    element={<AnalyticsPage />} />
              <Route path="/study"        element={<StudyPage />} />
              <Route path="/search"       element={<SearchPage />} />
              <Route path="/upload"       element={<UploadPage />} />
              <Route path="/my-study"     element={<MyStudyPage />} />
              <Route path="/about"        element={<AboutPage />} />
              <Route path="/terms"        element={<TermsPage />} />
              <Route path="/privacy"      element={<PrivacyPage />} />
              <Route path="*"             element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
        <Analytics />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

function NotFoundPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '2rem' }}>
      <BookOpen size={48} style={{ color: 'var(--color-primary-500)', marginBottom: '1rem' }} />
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Page not found</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>The page you're looking for doesn't exist.</p>
      <a href="/" className="btn btn-primary">Go Home</a>
    </div>
  )
}
