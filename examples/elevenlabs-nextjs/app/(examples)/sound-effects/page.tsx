'use client';

import { formatDistanceToNow } from 'date-fns';
import { nanoid } from 'nanoid';
import Image from 'next/image';
import { useState } from 'react';

import { AudioPlayer } from '@/app/(examples)/text-to-speech/components/audio-player';
import { SoundEffectPromptBar } from '@/components/prompt-bar/sound-effect';

// Extend SoundEffect type locally to include params
export type SoundEffectWithParams = {
  id: string;
  prompt: string;
  audioBase64: string;
  createdAt: Date;
  status: 'loading' | 'complete';
  duration_seconds: number | 'auto';
  prompt_influence: number;
};
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import { createSoundEffect } from '@/app/actions/create-sound-effect';
import { ApiLogProvider, useApiLog } from './api-log-context';
import { SoundEffectApiLog } from '@/components/sound-effect-api-log';

// --- ResubmitButton Component ---
function ResubmitButton({ effect, handlePendingSoundEffect, updatePendingEffect, setResubmitCounts, resubmitCounts, addEntry }: any) {
  return (
    <button
      type="button"
      className="text-muted-foreground text-xs font-bold px-2 py-1 rounded transition-colors cursor-pointer hover:text-orange-500 hover:bg-accent"
      style={{ minWidth: 0 }}
      onClick={async (e) => {
        e.stopPropagation();
        setResubmitCounts((prev: any) => ({
          ...prev,
          [effect.id]: (prev[effect.id] || 0) + 1,
        }));
        addEntry({
          timestamp: new Date().toLocaleTimeString(),
          level: 'info',
          message: `[RESUBMIT] Attempting with prompt: "${effect.prompt}", duration_seconds: ${effect.duration_seconds}, prompt_influence: ${effect.prompt_influence}`,
        });
        const pendingId = handlePendingSoundEffect(
          effect.prompt,
          effect.duration_seconds,
          effect.prompt_influence
        );
        const request: any = {
          text: effect.prompt,
          prompt_influence: effect.prompt_influence,
        };
        if (effect.duration_seconds !== 'auto') {
          request.duration_seconds = effect.duration_seconds;
        }
        addEntry({
          timestamp: new Date().toLocaleTimeString(),
          level: 'info',
          message: `[RESUBMIT] Sending request to createSoundEffect: ${JSON.stringify(request)}`,
        });
        const result = await createSoundEffect(request);
        addEntry({
          timestamp: new Date().toLocaleTimeString(),
          level: result.ok ? 'info' : 'error',
          message: `[RESUBMIT] createSoundEffect result: ${result.ok ? 'success' : 'error'}${result.ok ? '' : ` - ${result.error}`}`,
        });
        if (result.ok) {
          const newEffect: SoundEffectWithParams = {
            id: pendingId,
            prompt: effect.prompt,
            audioBase64: result.value.audioBase64,
            createdAt: new Date(),
            status: 'complete' as const,
            duration_seconds: effect.duration_seconds,
            prompt_influence: effect.prompt_influence,
          };
          updatePendingEffect(pendingId, newEffect);
          // --- BOUNCE LOGIC ---
          const filePath = result.value.filePath;
          if (filePath) {
            fetch('/api/bounce-wav', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filePath }),
            })
              .then(async (res) => {
                const data = await res.json();
                if (res.ok) {
                  console.log(`[BOUNCE] Success: ${data.bouncedFilePath}`);
                } else {
                  console.error(`[BOUNCE] Failed: ${data.error}`);
                }
              })
              .catch((err) => {
                console.error(`[BOUNCE] Error:`, err);
              });
          }
        }
      }}
    >
      {`Resubmit${resubmitCounts[effect.id] ? ` (${resubmitCounts[effect.id]})` : ''}`}
    </button>
  );
}

function PageContent() {
  // Move all logic that needs addEntry into a child component wrapped by ApiLogProvider
  return (
    <ApiLogProvider>
      <PageContentWithLog />
    </ApiLogProvider>
  );
}

function PageContentWithLog() {
  const { addEntry } = useApiLog();
  const [soundEffects, setSoundEffects] = useState<SoundEffectWithParams[]>([]);
  const [selectedEffect, setSelectedEffect] = useState<SoundEffectWithParams | null>(null);
  const [autoplay, setAutoplay] = useState(true);
  const [inputText, setInputText] = useState('');
  // Track resubmit counts per effect
  const [resubmitCounts, setResubmitCounts] = useState<Record<string, number>>({});

  // Accept params for pending effect
  const handlePendingSoundEffect = (prompt: string, duration_seconds: number | 'auto', prompt_influence: number) => {
    const pendingEffect: SoundEffectWithParams = {
      id: nanoid(),
      prompt,
      audioBase64: '',
      createdAt: new Date(),
      status: 'loading',
      duration_seconds,
      prompt_influence,
    };
    setSoundEffects((prev) => [pendingEffect, ...prev]);
    setSelectedEffect(pendingEffect);
    return pendingEffect.id;
  };

  const updatePendingEffect = (id: string, effect: SoundEffectWithParams) => {
    setSoundEffects((prev) =>
      prev.map((item) => (item.id === id ? { ...effect, status: 'complete' as const } : item))
    );
    setSelectedEffect((current: SoundEffectWithParams | null) =>
      current?.id === id ? { ...effect, status: 'complete' as const } : current
    );
  };

  return (
    <ApiLogProvider>
    <div>
      <div className="container mx-auto">
        <div className="grid h-[600px] grid-cols-[1fr_auto_300px]">
          <div className="bg-card flex flex-col rounded-lg p-6">
            <h1 className="text-2xl font-bold">Sound effects</h1>
            <div className="flex flex-1 flex-col justify-center">
              {selectedEffect ? (
                <div className="space-y-4">
                  {selectedEffect.status === 'complete' && (
                    <p className="text-muted-foreground text-sm">{selectedEffect.prompt}</p>
                  )}
                  {selectedEffect.status === 'loading' ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white" />
                    </div>
                  ) : (
                    <AudioPlayer audioBase64={selectedEffect.audioBase64} autoplay={autoplay} />
                  )}
                </div>
              ) : (
                <EmptyState />
              )}
            </div>
          </div>

          <Separator orientation="vertical" className="h-full" />

          <ScrollArea className="h-[600px] overflow-hidden rounded-tr-lg">
            <div className="flex items-center justify-between border-b p-3">
              <h2 className="font-semibold">Generations</h2>
              <div className="flex items-center gap-2">
                <label htmlFor="autoplay" className="text-sm">
                  Autoplay
                </label>
                <Switch id="autoplay" checked={autoplay} onCheckedChange={setAutoplay} />
              </div>
            </div>
            <div>
              {soundEffects.map((effect) => (
                <Card
                  key={effect.id}
                  className={cn(
                    'hover:bg-accent relative cursor-pointer rounded-none border-0 transition-colors',
                    selectedEffect?.id === effect.id && 'bg-accent',
                    effect.status === 'loading' &&
                      'cursor-not-allowed opacity-70 hover:bg-transparent'
                  )}
                  onClick={() => setSelectedEffect(effect)}
                >
                  <CardContent className="flex flex-col gap-1.5 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm truncate max-w-[180px]">{effect.prompt}</span>
                      <span className="text-muted-foreground text-xs">
                        {formatDistanceToNow(effect.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                    {effect.status === 'complete' && (
                      <>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            className="text-muted-foreground text-xs px-2 py-1 rounded transition-colors cursor-pointer hover:text-blue-500 hover:bg-accent"
                            style={{ minWidth: 0 }}
                            onClick={() => {
                              setInputText(effect.prompt);
                            }}
                          >
                            reuse
                          </button>
                          <ResubmitButton effect={effect} handlePendingSoundEffect={handlePendingSoundEffect} updatePendingEffect={updatePendingEffect} setResubmitCounts={setResubmitCounts} resubmitCounts={resubmitCounts} addEntry={addEntry} />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
      {/* API Log below the main sound effects box */}
      <div className="mx-auto max-w-4xl mt-4">
        <SoundEffectApiLog />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="mx-auto max-w-4xl">
          <SoundEffectPromptBar
            onPendingEffect={handlePendingSoundEffect}
            onUpdatePendingEffect={updatePendingEffect}
            inputText={inputText}
            setInputText={setInputText}
          />
        </div>
      </div>
    </div>
    </ApiLogProvider>
  );
}

export default function Page() {
  return <PageContent />;
}

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center gap-4">
    <Image
      src="/empty-folder.png"
      alt="Sound effect placeholder"
      width={160}
      height={160}
      className="select-none"
      draggable={false}
    />
    <p className="text-muted-foreground font-medium">
      Select a sound effect to play or create a new one
    </p>
  </div>
);
