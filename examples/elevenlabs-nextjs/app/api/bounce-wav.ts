import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { filePath } = req.body;

  if (!filePath || typeof filePath !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid filePath' });
  }

  // LOG: API called
  console.log(`[BOUNCE] Called for file: ${filePath}`);

  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const bouncedFilePath = filePath.replace(/\.wav$/, '-bounced.wav');
    let bounceSucceeded = false;

    await new Promise<void>((resolve) => {
      console.log(`[BOUNCE] Running ffmpeg for: ${filePath} -> ${bouncedFilePath}`);
      execFile(
        'ffmpeg',
        ['-y', '-i', filePath, '-ar', '44100', '-ac', '2', '-sample_fmt', 's16', bouncedFilePath],
        (error, stdout, stderr) => {
          if (error) {
            console.error(`[BOUNCE] FFmpeg error:`, error, stderr);
            resolve();
            return;
          }
          try {
            if (fs.existsSync(bouncedFilePath) && fs.statSync(bouncedFilePath).size > 0) {
              fs.unlinkSync(filePath);
              bounceSucceeded = true;
              console.log(`[BOUNCE] Success. Bounced file created: ${bouncedFilePath}`);
            } else {
              console.error(`[BOUNCE] Bounce failed: Bounced file missing or empty.`);
            }
          } catch (err) {
            console.warn(`[BOUNCE] Failed to finalize bounce:`, err);
          }
          resolve();
        }
      );
    });

    if (bounceSucceeded) {
      return res.status(200).json({ bouncedFilePath });
    } else {
      return res.status(500).json({ error: 'Bounce failed' });
    }
  } catch (err) {
    console.error('Bounce API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
