import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import EntryGate from './pages/EntryGate';
import AdminGate from './pages/AdminGate';
import AdminSetup from './pages/AdminSetup';
import AdminDashboard from './pages/AdminDashboard';
import UserGate from './pages/UserGate';
import FacultyDashboard from './pages/FacultyDashboard';
import StudentDashboard from './pages/StudentDashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<EntryGate />} />
        <Route path="/admin" element={<AdminGate />} />
        <Route path="/admin-setup" element={<AdminSetup />} />
        <Route path="/admin-dashboard/*" element={<AdminDashboard />} />
        <Route path="/user-gate" element={<UserGate />} />
        <Route path="/faculty-dashboard/*" element={<FacultyDashboard />} />
        <Route path="/student-dashboard/*" element={<StudentDashboard />} />
      </Routes>
    </Router>
  );
}
