import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const STORAGE_ROOT = "storage/videos";

export async function saveFile(
  userId: string,
  ext: string,
  buffer: Buffer
): Promise<string> {
  const userDir = join(process.cwd(), STORAGE_ROOT, userId);
  await mkdir(userDir, { recursive: true });

  const filename = ext ? `${randomUUID()}${ext}` : randomUUID();
  await writeFile(join(userDir, filename), buffer);

  return `${STORAGE_ROOT}/${userId}/${filename}`;
}

export async function deleteFile(relativePath: string): Promise<void> {
  try {
    await unlink(join(process.cwd(), relativePath));
  } catch {
    // File missing — treat as success
  }
}
