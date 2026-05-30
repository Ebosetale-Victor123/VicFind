import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/ToastContext'
import { ThemeProvider } from './components/ThemeContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import ReportLost from './pages/ReportLost'
import ReportFound from './pages/ReportFound'
import Matches from './pages/Matches'
import AllLostItems from './pages/AllLostItems'
import Heatmap from './pages/Heatmap'
import Admin from './pages/Admin'
import Verify from './pages/Verify'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <main style={{ flex: 1 }}>
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
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
