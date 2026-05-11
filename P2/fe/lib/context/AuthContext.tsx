'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserInfo } from '../api/types';
import { authService } from '../api/authService';

interface AuthContextType {
  user: UserInfo | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  logout: () => void;
  refreshUser: () => void;
  hasValidToken: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 초기 로드 시 localStorage에서 user 정보 복원
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentUser = authService.getUser();
      const token = authService.getAccessToken();
      
      console.log('[AuthContext] 초기 로드:', {
        hasUser: !!currentUser,
        hasToken: !!token,
        tokenLength: token?.length || 0,
      });
      
      setUser(currentUser);
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    authService.logout();
    setUser(null);
    console.log('[AuthContext] 로그아웃 완료');
  };

  const refreshUser = () => {
    const currentUser = authService.getUser();
    const token = authService.getAccessToken();
    
    console.log('[AuthContext] refreshUser 호출:', {
      hasUser: !!currentUser,
      hasToken: !!token,
      tokenLength: token?.length || 0,
    });
    
    setUser(currentUser);
  };

  const hasValidToken = () => {
    if (typeof window === 'undefined') return false;
    const token = authService.getAccessToken();
    return !!token && token.length > 0;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: user !== null && hasValidToken(),
        isLoading,
        logout,
        refreshUser,
        hasValidToken,
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
