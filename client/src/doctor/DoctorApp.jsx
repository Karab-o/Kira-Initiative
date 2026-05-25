import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './screens/Login.jsx';
import Signup from './screens/Signup.jsx';
import Verification from './screens/Verification.jsx';
import Dashboard from './screens/Dashboard.jsx';
import PatientCase from './screens/PatientCase.jsx';
import Consultation from './screens/Consultation.jsx';
import SOAPNote from './screens/SOAPNote.jsx';
import Appointments from './screens/Appointments.jsx';
import Prescriptions from './screens/Prescriptions.jsx';
import Profile from './screens/Profile.jsx';
import SecurityLogs from './screens/SecurityLogs.jsx';
import AuthGuard from './AuthGuard.jsx';

export default function DoctorApp() {
  return (
    <Routes>
      <Route index element={<Navigate to="login" replace />} />
      <Route path="login" element={<Login />} />
      <Route path="signup" element={<Signup />} />
      <Route path="verification" element={<Verification />} />

      <Route element={<AuthGuard />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="case/:escalationId" element={<PatientCase />} />
        <Route path="consultation/:consultationId" element={<Consultation />} />
        <Route path="consultation/:consultationId/soap" element={<SOAPNote />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="prescriptions" element={<Prescriptions />} />
        <Route path="profile" element={<Profile />} />
        <Route path="security" element={<SecurityLogs />} />
      </Route>

      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  );
}
