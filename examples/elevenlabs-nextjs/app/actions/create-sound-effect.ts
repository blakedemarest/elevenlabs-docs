'use server';

import type { BodySoundGenerationV1SoundGenerationPost } from 'elevenlabs/api';

import { getElevenLabsClient, handleError } from '@/app/actions/utils';
import { Err, Ok, Result } from '@/types';

import fs from 'fs';
import path from 'path';

export async function createSoundEffect(
  request: BodySoundGenerationV1SoundGenerationPost
): Promise<Result<{ audioBase64: string; processingTimeMs: number; filePath?: string }>> {
  const startTime = performance.now();
  const clientResult = await getElevenLabsClient();
  if (!clientResult.ok) return Err(clientResult.error);

  try {
    const client = clientResult.value;
    const stream = await client.textToSoundEffects.convert(request);

    const audioBase64 = await streamToBase64(stream);

    const processingTimeMs = Math.round(performance.now() - startTime);

    // --- Save WAV file to D:/ELEVENLABSOUTPUTWAVS ---
    try {
      const outputDir = 'D:/ELEVENLABSOUTPUTWAVS';
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      // Remove the data URL prefix if present
      const base64Data = audioBase64.replace(/^data:audio\/wav;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      // Build the filename: YYYY-MM-DD-prompt_input-timestamp.wav
      const now = new Date();
      const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const safePrompt = (request.text || 'prompt')
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .slice(0, 32); // Limit length for safety
      const filename = `${dateString}-${safePrompt}-${Date.now()}.wav`;
      const filePath = path.join(outputDir, filename);
      fs.writeFileSync(filePath, buffer);

      // --- API LOG: File saved ---
      // TODO: Bridge log to client context if needed
      // --- WAV file saved. If you want to bounce with ffmpeg, call the /api/bounce-wav API route here. ---
      // Example:
      // await fetch('/api/bounce-wav', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filePath }) });
      // --- End bounce trigger ---
      return Ok({
        audioBase64: `data:audio/wav;base64,${audioBase64}`,
        processingTimeMs,
        filePath,
      });
    } catch (err) {
      // Log error but do not block the main flow
      // TODO: Bridge log to client context if needed
      console.error('Failed to save WAV file:', err);
    }
    // --- End save logic ---

    return Ok({
      audioBase64: `data:audio/wav;base64,${audioBase64}`,
      processingTimeMs,
      filePath: undefined,
    });
  } catch (error) {
    return handleError(error, 'sound effect generation');
  }
}

async function streamToBase64(audioStream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of audioStream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('base64');
}
