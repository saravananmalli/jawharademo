import { createContext, useContext, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('jawhara-user'))
          || JSON.parse(sessionStorage.getItem('jawhara-user'));
    } catch { return null; }
  });
  const [token, setToken] = useState(
    () => localStorage.getItem('jawhara-token') || sessionStorage.getItem('jawhara-token')
  );
  const [loading, setLoading] = useState(false);

  const isAuthenticated = !!token;
  const isAdmin = user?.role === 'admin';

  const persist = (userData, jwt, remember) => {
    setUser(userData);
    setToken(jwt);
    if (remember) {
      localStorage.setItem('jawhara-user', JSON.stringify(userData));
      localStorage.setItem('jawhara-token', jwt);
    } else {
      sessionStorage.setItem('jawhara-user', JSON.stringify(userData));
      sessionStorage.setItem('jawhara-token', jwt);
    }
  };

  const login = async (email, password, rememberMe = true) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      persist(data.data, data.token, rememberMe);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, phone = '') => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password, phone });
      persist(data.data, data.token, true);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('jawhara-user');
    localStorage.removeItem('jawhara-token');
    sessionStorage.removeItem('jawhara-user');
    sessionStorage.removeItem('jawhara-token');
  };

  const updateProfile = async (updates) => {
    setLoading(true);
    try {
      const { data } = await api.put('/auth/profile', updates);
      const updated = { ...user, ...data.data };
      setUser(updated);
      if (localStorage.getItem('jawhara-token')) {
        localStorage.setItem('jawhara-user', JSON.stringify(updated));
      } else {
        sessionStorage.setItem('jawhara-user', JSON.stringify(updated));
      }
      return { success: true, data: data.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Update failed' };
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    setLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Password change failed' };
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Request failed' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user, token, isAuthenticated, isAdmin, loading,
      login, register, logout, updateProfile, changePassword, forgotPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
