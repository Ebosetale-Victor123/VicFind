import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { ToastProvider } from './components/ToastContext'
import { ThemeProvider } from './components/ThemeContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LoadingSpinner from './components/LoadingSpinner'

// Each page's loader is shared between lazy() (loads on first visit)
// and the idle-time prefetcher below (loads in the background after landing).
const pageLoaders = {
  reportLost: () => import('./pages/ReportLost'),
  reportFound: () => import('./pages/ReportFound'),
  matches: () => import('./pages/Matches'),
  items: () => import('./pages/AllLostItems'),
  heatmap: () => import('./pages/Heatmap'),
}

// Lazy load every page — only downloads when visited
const Home = lazy(() => import('./pages/Home'))
const ReportLost = lazy(pageLoaders.reportLost)
const ReportFound = lazy(pageLoaders.reportFound)
const Matches = lazy(pageLoaders.matches)
const AllLostItems = lazy(pageLoaders.items)
const Heatmap = lazy(pageLoaders.heatmap)
const Admin = lazy(() => import('./pages/Admin'))
const Verify = lazy(() => import('./pages/Verify'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Once the browser is idle after the first page paints, quietly download the
// other commonly-visited pages so navigating to them feels instant.
// Skipped on slow connections / data-saver mode so it never competes with
// the bandwidth someone on a kbps connection needs for the page they're on.
function usePagePrefetch() {
  useEffect(() => {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    const isSlow = conn && (conn.saveData || /^(slow-2g|2g)$/.test(conn.effectiveType || ''))
    if (isSlow) return

    const prefetch = () => Object.values(pageLoaders).forEach(load => load())

    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(prefetch, { timeout: 5000 })
      return () => cancelIdleCallback(id)
    }
    const id = setTimeout(prefetch, 2500)
    return () => clearTimeout(id)
  }, [])
}

function PageLoader() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingSpinner size="lg" />
    </div>
  )
}

export default function App() {
  usePagePrefetch()

  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <main style={{ flex: 1 }}>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/report-lost" element={<ReportLost />} />
                  <Route path="/report-found" element={<ReportFound />} />
                  <Route path="/matches" element={<Matches />} />
                  <Route path="/items" element={<AllLostItems />} />
                  <Route path="/heatmap" element={<Heatmap />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/verify/:lostItemId/:foundItemId" element={<Verify />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}