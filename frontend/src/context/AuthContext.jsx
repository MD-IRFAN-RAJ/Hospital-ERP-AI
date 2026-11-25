import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const DEMO_ROLES = [
  { role: 'HOSPITAL_ADMIN', name: 'System Admin', email: 'admin@medicore.com', label: 'Admin' },
  { role: 'DOCTOR', name: 'Dr. Sagun Adhikari', email: 'doctor@medicore.com', label: 'Doctor (OPD)' },
  { role: 'RECEPTIONIST', name: 'Suman Sunuwar', email: 'receptionist@medicore.com', label: 'Receptionist' },
  { role: 'NURSE', name: 'Sarah Jenkins', email: 'nurse@medicore.com', label: 'Nurse' },
  { role: 'PHARMACIST', name: 'David Vance', email: 'pharmacist@medicore.com', label: 'Pharmacist' },
  { role: 'LAB_TECHNICIAN', name: 'Maya Sharma', email: 'labtech@medicore.com', label: 'Lab Tech' },
  { role: 'ACCOUNTANT', name: 'James Wilson', email: 'accountant@medicore.com', label: 'Accountant' },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('medicore_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize or fetch current user
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success) {
            setUser(res.data.data);
          }
        } catch (err) {
          console.warn('Could not verify existing token, logging in default demo user...');
          await switchRole('DOCTOR');
        }
      } else {
        // Auto log in default Doctor role for immediate out-of-the-box demo
        await switchRole('DOCTOR');
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password = 'password123') => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success) {
        const { token: newToken, user: userData } = res.data.data;
        localStorage.setItem('medicore_token', newToken);
        setToken(newToken);
        setUser(userData);
        return { success: true };
      }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('medicore_token');
    setToken(null);
    setUser(null);
  };

  const switchRole = async (targetRole) => {
    const roleDef = DEMO_ROLES.find(r => r.role === targetRole) || DEMO_ROLES[1];
    return await login(roleDef.email, 'password123');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

