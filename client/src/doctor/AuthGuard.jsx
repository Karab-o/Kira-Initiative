import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useDoctorStore } from '../stores/doctorStore.js';
import DoctorShell from './components/DoctorShell.jsx';

export default function AuthGuard() {
  const { isAuthenticated, doctor } = useDoctorStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/doctor/login" state={{ from: location }} replace />;
  }

  if (doctor && doctor.verificationStatus !== 'approved') {
    if (!location.pathname.includes('/verification')) {
      return <Navigate to="/doctor/verification" replace />;
    }
  }

  return (
    <DoctorShell>
      <Outlet />
    </DoctorShell>
  );
}
