import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Inbox, CalendarDays, FileText, UserCircle,
  ShieldAlert, LogOut, Menu, X,
} from 'lucide-react';
import { useDoctorStore } from '../../stores/doctorStore.js';
import { useAuth } from '../../hooks/useAuth.js';
import { cn } from '../../lib/cn.js';

const NAV = [
  { to: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/doctor/appointments', label: 'Appointments', icon: CalendarDays },
  { to: '/doctor/prescriptions', label: 'Prescriptions', icon: FileText },
  { to: '/doctor/profile', label: 'Profile', icon: UserCircle },
  { to: '/doctor/security', label: 'Security', icon: ShieldAlert, adminOnly: true },
];

export default function DoctorShell({ children }) {
  const { doctor } = useDoctorStore();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const initials = doctor?.fullName?.split(' ').slice(-2).map((s) => s[0]).join('').toUpperCase() || 'DR';

  const onLogout = async () => {
    await logout();
    navigate('/doctor/login', { replace: true });
  };

  const items = NAV.filter((i) => !i.adminOnly || doctor?.role === 'admin');

  return (
    <div className="min-h-screen bg-ink-950 text-white flex">
      {/* Sidebar */}
      <aside className={cn(
        'fixed lg:static z-40 inset-y-0 left-0 w-64 bg-ink-900 border-r border-mint-300/10 flex flex-col',
        'transition-transform duration-200',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}>
        <div className="px-5 py-6 border-b border-mint-300/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-mint-300 to-mint-500 flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none">
                <path d="M11 8v16M11 16l8-8M11 16l8 8" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="font-display text-base leading-tight">Kira</p>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-fg">Clinical</p>
            </div>
          </div>
          <button className="lg:hidden text-muted-fg" onClick={() => setOpen(false)}><X size={18} /></button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition',
                isActive
                  ? 'bg-mint-300/10 text-white border border-mint-300/20'
                  : 'text-muted-fg hover:text-white hover:bg-mint-300/5 border border-transparent',
              )}
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-mint-300/10">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-mint-400 to-mint-600 flex items-center justify-center text-sm font-display">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{doctor?.fullName}</p>
              <p className="text-[11px] text-muted-fg truncate">{doctor?.specialty}</p>
            </div>
            <button onClick={onLogout} className="text-muted-fg hover:text-care-red transition" title="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="lg:hidden px-5 py-4 border-b border-mint-300/10 flex items-center justify-between sticky top-0 bg-ink-900/90 backdrop-blur z-30">
          <button onClick={() => setOpen(true)} className="text-muted-fg"><Menu size={20} /></button>
          <p className="font-display">Kira Clinical</p>
          <button onClick={onLogout} className="text-muted-fg"><LogOut size={18} /></button>
        </header>
        <main className="p-5 md:p-8">{children}</main>
      </div>

      {open && <div onClick={() => setOpen(false)} className="lg:hidden fixed inset-0 bg-ink-950/60 z-30" />}
    </div>
  );
}
