import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ToastProvider } from './components/ToastContext'
import { ThemeProvider } from './components/ThemeContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LoadingSpinner from './components/LoadingSpinner'

// Lazy load every page — only downloads when visited
const Home = lazy(() => import('./pages/Home'))
const ReportLost = lazy(() => import('./pages/ReportLost'))
const ReportFound = lazy(() => import('./pages/ReportFound'))
const Matches = lazy(() => import('./pages/Matches'))
const AllLostItems = lazy(() => import('./pages/AllLostItems'))
const Heatmap = lazy(() => import('./pages/Heatmap'))
const Admin = lazy(() => import('./pages/Admin'))
const Verify = lazy(() => import('./pages/Verify'))
const NotFound = lazy(() => import('./pages/NotFound'))

function PageLoader() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingSpinner size="lg" />
    </div>
  )
}

export default function App() {
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