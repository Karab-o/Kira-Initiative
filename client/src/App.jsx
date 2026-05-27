import { Routes, Route, Navigate } from 'react-router-dom';
import Splash from './screens/Splash.jsx';
import Landing from './screens/Landing.jsx';
import PatientApp from './patient/PatientApp.jsx';
import DoctorApp from './doctor/DoctorApp.jsx';

export default function App() {
  return (
    <Routes>
      {/* 1. Root splash — entry point for every visitor */}
      <Route path="/" element={<Splash />} />

      {/* 2. Two-card portal selector */}
      <Route path="/home" element={<Landing />} />

      {/* 3. Patient experience */}
      <Route path="/patient/*" element={<PatientApp />} />

      {/* 4. Doctor experience */}
      <Route path="/doctor/*" element={<DoctorApp />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
