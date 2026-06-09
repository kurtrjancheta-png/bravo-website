'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check localStorage on mount
    const storedUser = localStorage.getItem('bravo_admin_user');
    if (storedUser) {
      try {
        setAdminUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('bravo_admin_user');
      }
    }
    setIsLoaded(true);
  }, []);

  const login = (userData) => {
    setAdminUser(userData);
    localStorage.setItem('bravo_admin_user', JSON.stringify(userData));
  };

  const logout = () => {
    setAdminUser(null);
    localStorage.removeItem('bravo_admin_user');
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
