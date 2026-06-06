import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import PendingPatientsPage from './pages/PendingPatientsPage'
import PaymentsPage from './pages/PaymentsPage'
import DuesPage from './pages/DuesPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/pending-patients" element={<PendingPatientsPage />} />
      <Route path="/payments" element={<PaymentsPage />} />
      <Route path="/dues" element={<DuesPage />} />
    </Routes>
  )
}

export default App
