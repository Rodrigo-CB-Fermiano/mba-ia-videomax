import { prisma } from "./db.ts";
import { processVideo } from "./processor.ts";

const POLL_INTERVAL_MS = 10_000;

async function tick(): Promise<void> {
  const video = await prisma.video.findFirst({
    where: { status: "Queued" },
    orderBy: { uploadedAt: "asc" },
    select: { id: true, filePath: true },
  });

  if (!video) {
    process.stdout.write(".");
    return;
  }

  console.log(`\n[worker] picking up video ${video.id}`);
  await processVideo(video.id, video.filePath);
}

async function main(): Promise<void> {
  console.log("[worker] started - polling every 10 s");

  let running = false;

  const interval = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      await tick();
    } catch (err) {
      console.error("[worker] unexpected tick error:", err);
    } finally {
      running = false;
    }
  }, POLL_INTERVAL_MS);

  const shutdown = async () => {
    console.log("\n[worker] shutting down...");
    clearInterval(interval);
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[worker] fatal:", err);
  process.exit(1);
});
