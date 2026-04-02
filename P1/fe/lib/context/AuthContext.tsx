'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserInfo } from './api/types';
import { authService } from './api/authService';

interface AuthContextType {
  user: UserInfo | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 초기 로드 시 localStorage에서 사용자 정보 가져오기
    const currentUser = authService.getUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const refreshUser = () => {
    const currentUser = authService.getUser();
    setUser(currentUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: user !== null,
        isLoading,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
