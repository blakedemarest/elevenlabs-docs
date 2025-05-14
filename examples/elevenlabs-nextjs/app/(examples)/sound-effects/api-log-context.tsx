import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { ApiLogEntry } from '@/components/sound-effect-api-log';

interface ApiLogContextType {
  log: ApiLogEntry[];
  addEntry: (entry: ApiLogEntry) => void;
  clearLog: () => void;
}

const ApiLogContext = createContext<ApiLogContextType | undefined>(undefined);

export const useApiLog = () => {
  const ctx = useContext(ApiLogContext);
  if (!ctx) throw new Error('useApiLog must be used within ApiLogProvider');
  return ctx;
};

export const ApiLogProvider = ({ children }: { children: ReactNode }) => {
  const [log, setLog] = useState<ApiLogEntry[]>([]);

  const addEntry = (entry: ApiLogEntry) =>
    setLog((prev) => [...prev.slice(-199), entry]); // keep last 200
  const clearLog = () => setLog([]);

  return (
    <ApiLogContext.Provider value={{ log, addEntry, clearLog }}>
      {children}
    </ApiLogContext.Provider>
  );
};
