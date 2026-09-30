import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('lead_auto_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('lead_auto_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('lead_auto_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('lead_auto_user', JSON.stringify(res.data));
        } catch {
          localStorage.removeItem('lead_auto_token');
          localStorage.removeItem('lead_auto_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('lead_auto_token', access_token);
    localStorage.setItem('lead_auto_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password, role = 'BUSINESS_OWNER', phone = '') => {
    const res = await api.post('/auth/register', { name, email, password, role, phone });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('lead_auto_token', access_token);
    localStorage.setItem('lead_auto_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('lead_auto_user', JSON.stringify(userData));
  };

  const logout = () => {
    localStorage.removeItem('lead_auto_token');
    localStorage.removeItem('lead_auto_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const isOwner = user?.role === 'BUSINESS_OWNER';
  const isCustomer = user?.role === 'CUSTOMER';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        updateUser,
        logout,
        isAuthenticated: !!token,
        isOwner,
        isCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

