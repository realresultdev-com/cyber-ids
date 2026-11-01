import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ids_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('ids_token'));
  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await authAPI.login({
        username: username.trim(),
        password: password.trim(),
      });
      const { access_token, user: userData } = res.data;
      localStorage.setItem('ids_token', access_token);
      localStorage.setItem('ids_user', JSON.stringify(userData));
      setToken(access_token);
      setUser(userData);
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        (err.code === 'ERR_NETWORK'
          ? 'Cannot connect to backend server. Make sure the backend is running on http://127.0.0.1:8000'
          : 'Invalid username or password');
      return {
        success: false,
        message,
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('ids_token');
    localStorage.removeItem('ids_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
