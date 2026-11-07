import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('ustaad_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [profile, setProfile] = useState(() => {
    try {
      const stored = localStorage.getItem('ustaad_profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('ustaad_token'));
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    const storedToken = localStorage.getItem('ustaad_token');
    if (!storedToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      if (res.data?.success && res.data.data) {
        setUser(res.data.data.user);
        setProfile(res.data.data.profile);
        localStorage.setItem('ustaad_user', JSON.stringify(res.data.data.user));
        if (res.data.data.profile) {
          localStorage.setItem('ustaad_profile', JSON.stringify(res.data.data.profile));
        }
      }
    } catch (err) {
      console.warn('Failed to verify session token:', err.message);
      localStorage.removeItem('ustaad_token');
      localStorage.removeItem('ustaad_user');
      localStorage.removeItem('ustaad_profile');
      setUser(null);
      setProfile(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = (authData) => {
    const { token: newToken, user: newUser, mechanicProfile } = authData;
    localStorage.setItem('ustaad_token', newToken);
    localStorage.setItem('ustaad_user', JSON.stringify(newUser));
    if (mechanicProfile) {
      localStorage.setItem('ustaad_profile', JSON.stringify(mechanicProfile));
      setProfile(mechanicProfile);
    }
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Continue even if network error
    } finally {
      localStorage.removeItem('ustaad_token');
      localStorage.removeItem('ustaad_user');
      localStorage.removeItem('ustaad_profile');
      setUser(null);
      setProfile(null);
      setToken(null);
    }
  };

  const updateProfileState = (newProfile) => {
    setProfile(newProfile);
    localStorage.setItem('ustaad_profile', JSON.stringify(newProfile));
  };

  const getDashboardPath = (role = user?.role) => {
    switch (role) {
      case 'mechanic':
        return '/dashboard';
      case 'dealer':
        return '/dealer';
      case 'regional_manager':
      case 'super_admin':
        return '/admin';
      default:
        return '/';
    }
  };

  const value = {
    user,
    profile,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    role: user?.role,
    isMechanic: user?.role === 'mechanic',
    isDealer: user?.role === 'dealer',
    isRegionalManager: user?.role === 'regional_manager',
    isSuperAdmin: user?.role === 'super_admin',
    isAdmin: user?.role === 'regional_manager' || user?.role === 'super_admin',
    login,
    logout,
    refreshUser: fetchCurrentUser,
    updateProfileState,
    getDashboardPath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

