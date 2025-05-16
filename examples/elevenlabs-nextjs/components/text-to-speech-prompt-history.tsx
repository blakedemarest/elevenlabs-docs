import React from 'react';

export interface PromptHistoryEntry {
  prompt: string;
  timestamp: string;
}

import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

export const TextToSpeechPromptHistory: React.FC<{ history: PromptHistoryEntry[]; onReusePrompt?: (prompt: string) => void }> = ({ history, onReusePrompt }) => {
  return (
    <Card className="h-[300px] bg-card text-card-foreground border-card border shadow-lg flex flex-col">
      <div className="p-4 pb-2 border-b border-border">
        <h2 className="font-semibold">Prompt History</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 pt-2">
        {history.length === 0 ? (
          <div className="text-muted-foreground text-sm">No prompts yet.</div>
        ) : (
          history.map((entry, i) => (
            <Card
              key={i}
              className="mb-3 p-3 rounded transition-colors cursor-pointer border border-transparent hover:border-accent"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs truncate max-w-[120px]">{entry.prompt.slice(0, 32)}{entry.prompt.length > 32 ? '...' : ''}</span>
                <span className="text-muted-foreground text-[10px]">{
                  isNaN(new Date(entry.timestamp).getTime())
                    ? entry.timestamp
                    : formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })
                }</span>
              </div>
              <div className="text-muted-foreground text-xs mb-1 truncate max-w-[180px]">
                {entry.prompt}
              </div>
              {onReusePrompt && (
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    className="text-muted-foreground text-xs font-bold px-2 py-1 rounded transition-colors cursor-pointer hover:text-orange-500 hover:bg-accent"
                    style={{ minWidth: 0 }}
                    onClick={() => onReusePrompt(entry.prompt)}
                  >
                    reuse
                  </button>
                  {/* Placeholder for future resubmit functionality */}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </Card>
  );
};
