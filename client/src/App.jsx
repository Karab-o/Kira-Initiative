import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './screens/Landing.jsx';
import PatientApp from './patient/PatientApp.jsx';
import DoctorApp from './doctor/DoctorApp.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/patient/*" element={<PatientApp />} />
      <Route path="/doctor/*" element={<DoctorApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
