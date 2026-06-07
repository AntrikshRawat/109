import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import PendingPatientsPage from './pages/PendingPatientsPage'
import PaymentsPage from './pages/PaymentsPage'
import DuesPage from './pages/DuesPage'
import LocationsPage from './pages/LocationsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/pending-patients" element={<PendingPatientsPage />} />
      <Route path="/payments" element={<PaymentsPage />} />
      <Route path="/dues" element={<DuesPage />} />
      <Route path="/locations" element={<LocationsPage />} />
    </Routes>
  )
}

export default App
