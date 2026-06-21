import { spawn } from "child_process";
import { mkdir } from "fs/promises";
import { join } from "path";

const THUMBNAILS_DIR = join(process.cwd(), "storage", "thumbnails");
const AUDIO_DIR = join(process.cwd(), "storage", "audio");

function runSpawn(
  cmd: string,
  args: string[]
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args);
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    proc.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    proc.on("close", (code) => resolve({ stdout, stderr, code: code ?? 1 }));
  });
}

export async function getDuration(absolutePath: string): Promise<number> {
  const { stdout, code } = await runSpawn("ffprobe", [
    "-v", "quiet",
    "-print_format", "json",
    "-show_streams",
    absolutePath,
  ]);

  if (code !== 0) {
    throw new Error(`ffprobe exited with code ${code}`);
  }

  let parsed: { streams?: { duration?: string }[] };
  try {
    parsed = JSON.parse(stdout);
  } catch {
    throw new Error("ffprobe returned unparseable output");
  }

  const duration = parsed.streams?.[0]?.duration;
  if (!duration) {
    throw new Error("File is corrupted or cannot be read.");
  }

  return parseFloat(duration);
}

async function attemptThumbnail(
  absolutePath: string,
  outPath: string,
  seekSeconds: number
): Promise<boolean> {
  const { code } = await runSpawn("ffmpeg", [
    "-y",
    "-ss", String(seekSeconds),
    "-i", absolutePath,
    "-vframes", "1",
    "-q:v", "2",
    outPath,
  ]);
  return code === 0;
}

export async function generateThumbnail(
  absolutePath: string,
  videoId: string
): Promise<string> {
  await mkdir(THUMBNAILS_DIR, { recursive: true });

  const filename = `${videoId}.jpg`;
  const outPath = join(THUMBNAILS_DIR, filename);
  const relativePath = `storage/thumbnails/${filename}`;

  const ok5 = await attemptThumbnail(absolutePath, outPath, 5);
  if (ok5) return relativePath;

  const ok0 = await attemptThumbnail(absolutePath, outPath, 0);
  if (ok0) return relativePath;

  throw new Error("File is corrupted or cannot be read.");
}

export async function extractAudio(
  absolutePath: string,
  videoId: string
): Promise<string> {
  await mkdir(AUDIO_DIR, { recursive: true });

  const filename = `${videoId}.wav`;
  const outPath = join(AUDIO_DIR, filename);
  const relativePath = `storage/audio/${filename}`;

  const { stderr, code } = await runSpawn("ffmpeg", [
    "-y",
    "-i", absolutePath,
    "-vn",
    "-ar", "16000",
    "-ac", "1",
    "-f", "wav",
    outPath,
  ]);

  if (code !== 0) {
    console.error("[ffmpeg] extractAudio stderr:", stderr);
    throw new Error("Could not extract audio from this file.");
  }

  return relativePath;
}
