import { Routes, Route, Navigate } from 'react-router-dom';
import { useSessionStore } from '../stores/sessionStore.js';
import Onboarding from './screens/Onboarding.jsx';
import Home from './screens/Home.jsx';
import SessionStart from './screens/SessionStart.jsx';
import Chat from './screens/Chat.jsx';
import Scan from './screens/Scan.jsx';
import ScanLocked from './screens/ScanLocked.jsx';
import EscalationConsent from './screens/EscalationConsent.jsx';
import DoctorConnection from './screens/DoctorConnection.jsx';
import ConsultationChat from './screens/ConsultationChat.jsx';
import CallHelpdesk from './screens/CallHelpdesk.jsx';
import OthersAsked from './screens/OthersAsked.jsx';

// Entry gate: first-time visitors see onboarding, returning ones go straight home.
function PatientEntry() {
  const hasOnboarded = useSessionStore((s) => s.hasOnboarded);
  return <Navigate to={hasOnboarded ? 'home' : 'onboarding'} replace />;
}

export default function PatientApp() {
  return (
    <div className="min-h-screen bg-cream">
      <Routes>
        <Route index element={<PatientEntry />} />
        <Route path="onboarding" element={<Onboarding />} />
        <Route path="home" element={<Home />} />
        <Route path="session" element={<SessionStart />} />
        <Route path="chat" element={<Chat />} />
        <Route path="scan" element={<Scan />} />
        <Route path="scan-locked" element={<ScanLocked />} />
        <Route path="escalation" element={<EscalationConsent />} />
        <Route path="doctor-connect" element={<DoctorConnection />} />
        <Route path="consultation" element={<ConsultationChat />} />
        <Route path="helpdesk" element={<CallHelpdesk />} />
        <Route path="others-asked" element={<OthersAsked />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </div>
  );
}
