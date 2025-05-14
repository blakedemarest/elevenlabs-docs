'use client';

import React from 'react';
import { BodySoundGenerationV1SoundGenerationPost } from 'elevenlabs/api';
import { ClockIcon, DiamondIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useApiLog } from '@/app/(examples)/sound-effects/api-log-context';

import { createSoundEffect } from '@/app/actions/create-sound-effect';
import { PromptBar, PromptControlsProps } from '@/components/prompt-bar/base';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { SoundEffectInput as SoundEffectInputType, soundEffectSchema } from '@/lib/schemas';

export type SoundEffectPromptProps = {
  onPendingEffect: (prompt: string) => string;
  onUpdatePendingEffect: (id: string, effect: SoundEffect) => void;
  inputText: string;
  setInputText: (val: string) => void;
};

export function SoundEffectPromptBar({
  onPendingEffect,
  onUpdatePendingEffect,
  inputText,
  setInputText,
}: SoundEffectPromptProps) {
  const { addEntry } = useApiLog();
  const [retryCount, setRetryCount] = useState(0);

  // Reset retry count when inputText changes
  React.useEffect(() => {
    setRetryCount(0);
  }, [inputText]);

  const handleSubmit = async (data: SoundEffectInputType) => {
    setRetryCount((count) => count + 1);
    try {
      addEntry({
        timestamp: new Date().toLocaleTimeString(),
        level: 'info',
        message: `Generating sound effect for: "${data.text}"`
      });

      const pendingId = onPendingEffect(data.text);

      const request: BodySoundGenerationV1SoundGenerationPost = {
        text: data.text,
        prompt_influence: data.prompt_influence,
      };

      // Only add duration_seconds if it's a number (not 'auto')
      if (data.duration_seconds !== 'auto') {
        request.duration_seconds = data.duration_seconds;
      }

      const result = await createSoundEffect(request);

      if (result.ok) {
        addEntry({
          timestamp: new Date().toLocaleTimeString(),
          level: 'info',
          message: `Sound effect generated successfully.`
        });
        const effect: SoundEffect = {
          id: pendingId,
          prompt: data.text,
          audioBase64: result.value.audioBase64,
          createdAt: new Date(),
          status: 'complete',
        };
        onUpdatePendingEffect(pendingId, effect);
        toast.success('Generated sound effect');
        // --- BOUNCE LOGIC ---
        // Use the filePath returned from createSoundEffect
        const filePath = result.value.filePath;
        addEntry({
          timestamp: new Date().toLocaleTimeString(),
          level: 'info',
          message: `Calling bounce-wav for: ${filePath}`
        });
        try {
          fetch('/api/bounce-wav', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath }),
          })
            .then(async (res) => {
              const data = await res.json();
              if (res.ok) {
                addEntry({
                  timestamp: new Date().toLocaleTimeString(),
                  level: 'info',
                  message: `Bounce success: ${data.bouncedFilePath}`
                });
              } else {
                addEntry({
                  timestamp: new Date().toLocaleTimeString(),
                  level: 'error',
                  message: `Bounce failed: ${data.error}`
                });
              }
            })
            .catch((err) => {
              addEntry({
                timestamp: new Date().toLocaleTimeString(),
                level: 'error',
                message: `Bounce error: ${err}`
              });
            });
        } catch (err) {
          addEntry({
            timestamp: new Date().toLocaleTimeString(),
            level: 'error',
            message: `Bounce error: ${err}`
          });
        }
        // --- END BOUNCE LOGIC ---
        return;
      } else {
        addEntry({
          timestamp: new Date().toLocaleTimeString(),
          level: 'error',
          message: `Sound effect generation failed: ${result.error}`
        });
        toast.error(result.error);
      }
    } catch (err) {
      addEntry({
        timestamp: new Date().toLocaleTimeString(),
        level: 'error',
        message: `Unexpected error: ${err}`
      });
      toast.error(`An unexpected error occurred: ${err}`);
    }
  };

  const renderLeftControls = ({ form }: PromptControlsProps<SoundEffectInputType>) => {
    const duration = form.watch('duration_seconds');
    const promptInfluence = form.watch('prompt_influence');

    return (
      <div className="flex flex-wrap gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="flex h-9 w-9 min-w-[80px] items-center gap-1.5 rounded-full bg-white/10 p-0 hover:bg-white/20"
            >
              <ClockIcon className="h-[18px] w-[18px]" />
              <span className="mr-2">{duration === 'auto' ? 'Auto' : `${duration}s`}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="border border-white/10 bg-[#2B2B2B] text-white">
            <DropdownMenuLabel>Duration</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuRadioGroup
              value={String(duration)}
              onValueChange={(value) =>
                form.setValue('duration_seconds', value === 'auto' ? 'auto' : parseFloat(value), {
                  shouldDirty: true,
                  shouldTouch: true,
                })
              }
            >
              <DropdownMenuRadioItem className="focus:bg-white/10" value="auto">
                Automatic
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem className="focus:bg-white/10" value="0.5">
                0.5s
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem className="focus:bg-white/10" value="1">
                1s
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem className="focus:bg-white/10" value="2">
                2s
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem className="focus:bg-white/10" value="5">
                5s
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem className="focus:bg-white/10" value="10">
                10s
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem className="focus:bg-white/10" value="22">
                22s
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="flex h-9 w-9 min-w-[80px] items-center gap-1.5 rounded-full bg-white/10 p-0 hover:bg-white/20"
            >
              <DiamondIcon className="h-[18px] w-[18px]" />
              <span className="mr-2">{(promptInfluence * 100).toFixed(0)}%</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 border border-white/10 bg-[#2B2B2B] text-white">
            <DropdownMenuLabel>Prompt Influence</DropdownMenuLabel>
            <div className="px-4 py-3">
              <p className="text-muted-foreground mb-4 text-sm">
                Slide to balance between creativity and prompt adherence
              </p>
              <Slider
                value={[promptInfluence]}
                onValueChange={(values) =>
                  form.setValue('prompt_influence', values[0], {
                    shouldDirty: true,
                    shouldTouch: true,
                  })
                }
                max={1}
                min={0}
                step={0.01}
                className="[&>.relative>.bg-primary]:bg-white"
              />
              <div className="text-muted-foreground mt-2 flex justify-between text-xs">
                <span>More Creative</span>
                <span>Follow Prompt</span>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  // Custom right control for Resubmit button with retry counter
  const renderRightControls = () => (
    <Button
      type="submit"
      size="sm"
      variant="secondary"
      className="ml-2"
    >
      Resubmit{retryCount > 0 ? ` (${retryCount})` : ''}
    </Button>
  );

  return (
    <PromptBar
      schema={soundEffectSchema}
      defaultValues={{
        text: '',
        duration_seconds: 'auto',
        prompt_influence: 0.3,
      }}
      promptFieldName="text"
      placeholder="Describe your sound effect..."
      submitTooltip="Create sound effect"
      leftControls={renderLeftControls}
      rightControls={renderRightControls}
      onSubmit={handleSubmit}
      // isLoading removed to allow multiple generations at once
      inputValue={inputText}
      setInputValue={setInputText}
    />
  );
}
export type SoundEffect = {
  id: string;
  prompt: string;
  audioBase64: string;
  createdAt: Date;
  status: 'loading' | 'complete';
};
