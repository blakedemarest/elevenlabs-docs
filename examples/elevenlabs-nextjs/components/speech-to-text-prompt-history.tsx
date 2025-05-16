import React from 'react';

export interface PromptHistoryEntry {
  prompt: string;
  timestamp: string;
}

export const SpeechToTextPromptHistory: React.FC<{ history: PromptHistoryEntry[] }> = ({ history }) => {
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded p-2 mt-4 text-xs max-h-48 overflow-y-auto">
      <div className="font-bold mb-2 text-zinc-200">Prompt History</div>
      {history.length === 0 ? (
        <div className="text-zinc-400">No prompts yet.</div>
      ) : (
        <ul className="space-y-1">
          {history.map((entry, i) => (
            <li key={i}>
              <span className="text-zinc-500">[{entry.timestamp}]</span> {entry.prompt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
