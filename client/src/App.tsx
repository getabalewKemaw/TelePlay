import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import PlayerDashboard from './pages/PlayerDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<PlayerDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
