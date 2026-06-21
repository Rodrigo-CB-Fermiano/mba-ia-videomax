import { join } from "path";
import { prisma } from "./db.ts";
import { deleteFile } from "../app/lib/storage.ts";
import { getDuration, generateThumbnail, extractAudio } from "./ffmpeg.ts";
import { transcribe } from "./whisper.ts";

const MAX_RETRIES = 3;

const PG_LANGUAGE: Record<string, string> = {
  pt: "portuguese",
  en: "english",
  es: "spanish",
};

function classifyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("Could not extract audio")) return "Could not extract audio from this file.";
  if (msg.includes("Whisper failed") || msg.includes("Transcription timed out"))
    return "Transcription timed out.";
  if (msg.includes("corrupted") || msg.includes("cannot be read"))
    return "File is corrupted or cannot be read.";
  return msg.slice(0, 500);
}

export async function processVideo(videoId: string, relativeFilePath: string): Promise<void> {
  const absoluteFilePath = join(process.cwd(), relativeFilePath);
  let audioPath: string | null = null;

  try {
    await prisma.video.update({
      where: { id: videoId },
      data: { status: "Processing" },
    });

    const duration = await getDuration(absoluteFilePath);
    const thumbnailPath = await generateThumbnail(absoluteFilePath, videoId);
    audioPath = await extractAudio(absoluteFilePath, videoId);

    await prisma.video.update({
      where: { id: videoId },
      data: { durationSeconds: duration, thumbnailPath },
    });

    const whisperResult = await transcribe(join(process.cwd(), audioPath));

    await prisma.transcriptionSegment.createMany({
      data: whisperResult.segments.map((seg) => ({
        videoId,
        startMs: seg.startMs,
        endMs: seg.endMs,
        text: seg.text,
      })),
    });

    const pgLang = PG_LANGUAGE[whisperResult.language] ?? "portuguese";
    const fullText = whisperResult.segments.map((s) => s.text).join(" ");

    await prisma.$executeRaw`
      UPDATE videos
      SET search_vector = to_tsvector(${pgLang}::regconfig, ${fullText}::text)
      WHERE id = ${videoId}::uuid
    `;

    await prisma.video.update({
      where: { id: videoId },
      data: { status: "Ready", language: whisperResult.language },
    });

    console.log(`[worker] OK video ${videoId} processed (${duration.toFixed(1)}s, lang=${whisperResult.language})`);
  } catch (err) {
    const errorMessage = classifyError(err);

    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { retryCount: true },
    });

    const currentRetry = video?.retryCount ?? 0;

    if (currentRetry < MAX_RETRIES) {
      await prisma.video.update({
        where: { id: videoId },
        data: {
          status: "Queued",
          retryCount: currentRetry + 1,
          processingError: errorMessage,
        },
      });
      console.log(`[worker] RETRY video ${videoId} attempt ${currentRetry + 1}/${MAX_RETRIES}: ${errorMessage}`);
    } else {
      await prisma.video.update({
        where: { id: videoId },
        data: { status: "Failed", processingError: errorMessage },
      });
      console.log(`[worker] FAILED video ${videoId} after ${MAX_RETRIES} retries: ${errorMessage}`);
    }
  } finally {
    if (audioPath) {
      await deleteFile(audioPath).catch(() => {});
    }
  }
}
