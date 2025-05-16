import React, { createContext, useContext, useState } from 'react';

export interface ApiLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

interface ApiLogContextType {
  log: ApiLogEntry[];
  addLog: (entry: ApiLogEntry) => void;
}

const ApiLogContext = createContext<ApiLogContextType | undefined>(undefined);

export const ApiLogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [log, setLog] = useState<ApiLogEntry[]>([]);

  const addLog = (entry: ApiLogEntry) => {
    setLog((prev) => [entry, ...prev]);
  };

  return (
    <ApiLogContext.Provider value={{ log, addLog }}>
      {children}
    </ApiLogContext.Provider>
  );
};

export const useApiLog = () => {
  const context = useContext(ApiLogContext);
  if (!context) {
    throw new Error('useApiLog must be used within an ApiLogProvider');
  }
  return context;
};
