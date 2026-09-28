import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const activeUser = authService.getCurrentUser();
      setUser(activeUser);
    } catch (err) {
      console.error('Failed to load user session:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const sessionUser = await authService.login(email, password);
    setUser(sessionUser);
    return sessionUser;
  };

  const register = async (userData) => {
    const sessionUser = await authService.register(userData);
    setUser(sessionUser);
    return sessionUser;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: Boolean(user),
    loading,
    login,
    register,
    logout,
    isAdmin: user?.role === 'Admin',
    isHouseHolder: user?.role === 'House Holder',
    isEngineer: user?.role === 'Engineer',
    isManager: user?.role === 'Manager',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
