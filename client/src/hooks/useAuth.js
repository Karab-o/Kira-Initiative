import { useCallback } from 'react';
import { api, apiError } from '../lib/api.js';
import { useDoctorStore } from '../stores/doctorStore.js';

export function useAuth() {
  const store = useDoctorStore();

  const login = useCallback(async ({ email, medicalId, password, twoFAToken, accessCode, ...rest }) => {
    const { data } = await api.post('/auth/login', {
      email,
      medicalId,
      password,
      twoFAToken,
      accessCode,
    });
    if (data.token && data.doctor) {
      store.login({ token: data.token, doctor: data.doctor });
    }
    return data;
  }, [store]);

  const signup = useCallback(async (formData) => {
    const { data } = await api.post('/auth/signup', formData);
    return data;
  }, []);

  const validateCode = useCallback(async (code) => {
    const { data } = await api.post('/auth/validate-code', { code });
    return data;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    store.logout();
  }, [store]);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      store.setDoctor(data.doctor);
      return data.doctor;
    } catch (err) {
      if (err?.response?.status === 401) store.logout();
      throw err;
    }
  }, [store]);

  return {
    doctor: store.doctor,
    token: store.token,
    isAuthenticated: store.isAuthenticated,
    login,
    signup,
    validateCode,
    logout,
    refresh,
    apiError,
  };
}
