import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Inbox, CalendarDays, FileText, UserCircle,
  ShieldAlert, LogOut, Menu, X, Stethoscope,
} from 'lucide-react';
import { useDoctorStore } from '../../stores/doctorStore.js';
import { useAuth } from '../../hooks/useAuth.js';
import { cn } from '../../lib/cn.js';

const NAV = [
  { to: '/doctor/dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/doctor/appointments', label: 'Appointments',  icon: CalendarDays },
  { to: '/doctor/prescriptions',label: 'Prescriptions', icon: FileText },
  { to: '/doctor/profile',      label: 'Profile',       icon: UserCircle },
  { to: '/doctor/security',     label: 'Security logs', icon: ShieldAlert, adminOnly: true },
];

export default function DoctorShell({ children }) {
  const { doctor } = useDoctorStore();
  const { logout }  = useAuth();
  const navigate    = useNavigate();
  const [open, setOpen] = useState(false);

  const initials = doctor?.fullName
    ?.split(' ').slice(-2).map((s) => s[0]).join('').toUpperCase() || 'DR';

  const onLogout = async () => {
    await logout();
    navigate('/doctor/login', { replace: true });
  };

  const items = NAV.filter((i) => !i.adminOnly || doctor?.role === 'admin');

  return (
    <div className="min-h-screen bg-cream flex">

      {/* ── Sidebar ────────────────────────────────────────── */}
      <aside className={cn(
        'fixed lg:static z-40 inset-y-0 left-0 w-64',
        'bg-white border-r border-[#E5DDD7] flex flex-col',
        'transition-transform duration-200',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[#E5DDD7] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sage-300 to-sage-500 flex items-center justify-center shadow-green">
              <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none">
                <path d="M11 8v16M11 16l8-8M11 16l8 8" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="font-display font-bold text-[15px] text-coal leading-tight">Kira</p>
              <p className="text-[10px] font-mono uppercase tracking-wider text-coal-muted">Clinical Portal</p>
            </div>
          </div>
          <button className="lg:hidden text-coal-muted hover:text-coal" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Specialty badge */}
        {doctor?.specialty && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-sage-50 border border-sage-100 flex items-center gap-2">
            <Stethoscope size={13} className="text-sage-500 flex-shrink-0" />
            <span className="text-[12px] font-medium text-sage-600 truncate">{doctor.specialty}</span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition',
                isActive
                  ? 'bg-sage-50 text-sage-600 border border-sage-200'
                  : 'text-coal-muted hover:text-coal hover:bg-sage-50/60 border border-transparent',
              )}
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Doctor info */}
        <div className="px-3 py-3 border-t border-[#E5DDD7]">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-sage-50 transition">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sage-300 to-sage-500 flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-coal truncate">{doctor?.fullName || 'Doctor'}</p>
              <p className="text-[11px] text-coal-muted truncate">{doctor?.hospitalName || 'Kira Initiative'}</p>
            </div>
            <button onClick={onLogout} className="text-coal-muted hover:text-care-red transition" title="Sign out">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden px-5 py-4 border-b border-[#E5DDD7] flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur z-30">
          <button onClick={() => setOpen(true)} className="text-coal-muted">
            <Menu size={20} />
          </button>
          <p className="font-display font-bold text-coal">Kira Clinical</p>
          <button onClick={onLogout} className="text-coal-muted hover:text-care-red transition">
            <LogOut size={18} />
          </button>
        </header>

        <main className="flex-1 p-5 md:p-8">{children}</main>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div onClick={() => setOpen(false)} className="lg:hidden fixed inset-0 bg-coal/30 backdrop-blur-sm z-30" />
      )}
    </div>
  );
}
