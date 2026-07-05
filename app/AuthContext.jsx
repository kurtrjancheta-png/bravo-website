'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.success && data.user) {
          setAdminUser(data.user);
          localStorage.setItem('bravo_admin_user', JSON.stringify(data.user));
        } else {
          setAdminUser(null);
          localStorage.removeItem('bravo_admin_user');
        }
      } catch (e) {
        // Fallback to offline localStorage if offline / network error
        const storedUser = localStorage.getItem('bravo_admin_user');
        if (storedUser) {
          try {
            setAdminUser(JSON.parse(storedUser));
          } catch (err) {
            localStorage.removeItem('bravo_admin_user');
          }
        }
      } finally {
        setIsLoaded(true);
      }
    }
    checkSession();
  }, []);

  const login = (userData) => {
    setAdminUser(userData);
    localStorage.setItem('bravo_admin_user', JSON.stringify(userData));
  };

  const logout = async () => {
    setAdminUser(null);
    localStorage.removeItem('bravo_admin_user');
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Failed to logout on server:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ adminUser, login, logout, isLoaded }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
