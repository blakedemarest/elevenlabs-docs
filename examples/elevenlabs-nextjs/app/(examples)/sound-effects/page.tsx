'use client';

import { formatDistanceToNow } from 'date-fns';
import { nanoid } from 'nanoid';
import Image from 'next/image';
import { useState } from 'react';

import { AudioPlayer } from '@/app/(examples)/text-to-speech/components/audio-player';
import { SoundEffectPromptBar, type SoundEffect } from '@/components/prompt-bar/sound-effect';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import { createSoundEffect } from '@/app/actions/create-sound-effect';
import { ApiLogProvider } from './api-log-context';
import { SoundEffectApiLog } from '@/components/sound-effect-api-log';

function PageContent() {
  const [soundEffects, setSoundEffects] = useState<SoundEffect[]>([]);
  const [selectedEffect, setSelectedEffect] = useState<SoundEffect | null>(null);
  const [autoplay, setAutoplay] = useState(true);
  const [inputText, setInputText] = useState('');
  // Track resubmit counts per effect
  const [resubmitCounts, setResubmitCounts] = useState<Record<string, number>>({});

  const handlePendingSoundEffect = (prompt: string) => {
    const pendingEffect: SoundEffect = {
      id: nanoid(),
      prompt,
      audioBase64: '',
      createdAt: new Date(),
      status: 'loading',
    };
    setSoundEffects((prev) => [pendingEffect, ...prev]);
    setSelectedEffect(pendingEffect);
    return pendingEffect.id;
  };

  const updatePendingEffect = (id: string, effect: SoundEffect) => {
    setSoundEffects((prev) =>
      prev.map((item) => (item.id === id ? { ...effect, status: 'complete' as const } : item))
    );
    setSelectedEffect((current) =>
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
                  onClick={() => effect.status === 'complete' && setSelectedEffect(effect)}
                >
                  <CardContent className="px-3 py-3">
                    <p className="mb-1 max-w-[250px] truncate font-medium">{effect.prompt}</p>
                    {effect.status === 'loading' ? (
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-current" />
                        <span>Generating...</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-muted-foreground text-xs">
                          {formatDistanceToNow(effect.createdAt, {
                            addSuffix: true,
                          })}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <button
                            type="button"
                            className="text-muted-foreground text-xs font-bold px-2 py-1 rounded transition-colors cursor-pointer hover:text-orange-500 hover:bg-accent"
                            style={{ minWidth: 0 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setInputText(effect.prompt);
                            }}
                          >
                            reuse
                          </button>
                          <button
                            type="button"
                            className="text-muted-foreground text-xs font-bold px-2 py-1 rounded transition-colors cursor-pointer hover:text-orange-500 hover:bg-accent"
                            style={{ minWidth: 0 }}
                            onClick={async (e) => {
                              e.stopPropagation();
                              // Increment the retry count for this effect
                              setResubmitCounts((prev) => ({
                                ...prev,
                                [effect.id]: (prev[effect.id] || 0) + 1,
                              }));
                              const pendingId = handlePendingSoundEffect(effect.prompt);
                              const result = await createSoundEffect({ text: effect.prompt });
                              if (result.ok) {
                                const newEffect = {
                                  id: pendingId,
                                  prompt: effect.prompt,
                                  audioBase64: result.value.audioBase64,
                                  createdAt: new Date(),
                                  status: 'complete' as const,
                                };
                                updatePendingEffect(pendingId, newEffect);
                              }
                            }}
                          >
                            {`Resubmit${resubmitCounts[effect.id] ? ` (${resubmitCounts[effect.id]})` : ''}`}
                          </button>
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
