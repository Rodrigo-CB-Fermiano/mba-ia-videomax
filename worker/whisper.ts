import { spawn } from "child_process";
import { join } from "path";

const SUPPORTED_LANGUAGES = ["pt", "en", "es"] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export interface WhisperSegment {
  startMs: number;
  endMs: number;
  text: string;
}

export interface WhisperResult {
  language: SupportedLanguage;
  segments: WhisperSegment[];
}

export function transcribe(audioAbsolutePath: string): Promise<WhisperResult> {
  return new Promise((resolve, reject) => {
    const scriptPath = join(process.cwd(), "worker", "whisper_transcribe.py");
    const proc = spawn("python", [scriptPath, audioAbsolutePath]);

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    proc.stderr.on("data", (d: Buffer) => (stderr += d.toString()));

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Whisper failed: ${stderr.trim()}`));
        return;
      }

      let parsed: { language: string; segments: { start: number; end: number; text: string }[] };
      try {
        parsed = JSON.parse(stdout);
      } catch {
        reject(new Error("Whisper returned unparseable JSON output"));
        return;
      }

      const rawLang = parsed.language ?? "pt";
      const language: SupportedLanguage = SUPPORTED_LANGUAGES.includes(
        rawLang as SupportedLanguage
      )
        ? (rawLang as SupportedLanguage)
        : "pt";

      const segments: WhisperSegment[] = (parsed.segments ?? []).map((s) => ({
        startMs: Math.round(s.start * 1000),
        endMs: Math.round(s.end * 1000),
        text: s.text,
      }));

      resolve({ language, segments });
    });
  });
}
