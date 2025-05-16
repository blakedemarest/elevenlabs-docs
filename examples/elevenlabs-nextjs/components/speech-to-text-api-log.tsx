import React from 'react';
import { useApiLog, ApiLogEntry } from '../app/(examples)/speech-to-text/api-log-context';



export const SpeechToTextApiLog: React.FC = () => {
  const { log } = useApiLog();
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded p-2 mt-4 text-xs max-h-48 overflow-y-auto">
      <div className="font-bold mb-2 text-zinc-200">Speech to Text API Log</div>
      {log.length === 0 ? (
        <div className="text-zinc-400">No API activity yet.</div>
      ) : (
        <ul className="space-y-1">
          {log.map((entry: ApiLogEntry, i: number) => (
            <li key={i} className={`text-${entry.level === 'error' ? 'red' : entry.level === 'warn' ? 'yellow' : 'zinc'}-400`}>
              <span className="text-zinc-500">[{entry.timestamp}]</span> <span className="capitalize">{entry.level}</span>: {entry.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
