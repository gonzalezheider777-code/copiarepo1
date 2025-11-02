import React, { createContext, useContext, useState, useCallback } from 'react';

interface ErrorContextType {
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
  logError: (error: Error | string, context?: string) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const logError = useCallback((error: Error | string, context?: string) => {
    const errorMessage = error instanceof Error ? error.message : error;
    const fullMessage = context ? `[${context}] ${errorMessage}` : errorMessage;

    console.error(fullMessage);

    if (typeof window !== 'undefined' && window.__ERROR_LOG__) {
      window.__ERROR_LOG__.push({
        message: fullMessage,
        timestamp: new Date().toISOString(),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    setError(errorMessage);
  }, []);

  return (
    <ErrorContext.Provider value={{ error, setError, clearError, logError }}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within ErrorProvider');
  }
  return context;
};

declare global {
  interface Window {
    __ERROR_LOG__?: Array<{
      message: string;
      timestamp: string;
      stack?: string;
    }>;
  }
}
