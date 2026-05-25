import { create } from 'zustand';

// Doctor session: JWT is persisted in localStorage (it's the doctor's own credential).
// This is different from patient sessions which must be ephemeral.

const TOKEN_KEY = 'kira_doctor_token';
const DOCTOR_KEY = 'kira_doctor_profile';

function readPersisted() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const doctorRaw = localStorage.getItem(DOCTOR_KEY);
    return { token, doctor: doctorRaw ? JSON.parse(doctorRaw) : null };
  } catch {
    return { token: null, doctor: null };
  }
}

const initial = readPersisted();

export const useDoctorStore = create((set) => ({
  doctor: initial.doctor,
  token: initial.token,
  isAuthenticated: !!initial.token,

  login: ({ token, doctor }) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(DOCTOR_KEY, JSON.stringify(doctor));
    set({ token, doctor, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(DOCTOR_KEY);
    set({ token: null, doctor: null, isAuthenticated: false });
  },

  setDoctor: (doctor) => {
    localStorage.setItem(DOCTOR_KEY, JSON.stringify(doctor));
    set({ doctor });
  },
}));
