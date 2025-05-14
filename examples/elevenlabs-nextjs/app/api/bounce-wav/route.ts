import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { execFile } from 'child_process';

export async function POST(req: NextRequest) {
  const { filePath } = await req.json();

  if (!filePath || typeof filePath !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid filePath' }, { status: 400 });
  }

  console.log(`[BOUNCE] Called for file: ${filePath}`);

  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
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
      return NextResponse.json({ bouncedFilePath });
    } else {
      return NextResponse.json({ error: 'Bounce failed' }, { status: 500 });
    }
  } catch (err) {
    console.error(`[BOUNCE] API error:`, err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
