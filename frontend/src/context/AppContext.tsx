import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { HealthStatus, LLMHealthStatus } from '../types';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface AppContextType {
  health: HealthStatus | null;
  llmHealth: LLMHealthStatus | null;
  isOnline: boolean;
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message?: string) => void;
  removeToast: (id: string) => void;
  refreshHealth: () => Promise<void>;
  isDemoModalOpen: boolean;
  setIsDemoModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [llmHealth, setLlmHealth] = useState<LLMHealthStatus | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState<boolean>(false);

  const addToast = useCallback((type: ToastMessage['type'], title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const refreshHealth = useCallback(async () => {
    try {
      const [h, llm] = await Promise.all([api.getHealth(), api.getLLMHealth()]);
      setHealth(h);
      setLlmHealth(llm);
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    }
  }, []);

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, 20000);
    return () => clearInterval(interval);
  }, [refreshHealth]);

  return (
    <AppContext.Provider
      value={{
        health,
        llmHealth,
        isOnline,
        toasts,
        addToast,
        removeToast,
        refreshHealth,
        isDemoModalOpen,
        setIsDemoModalOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
};
