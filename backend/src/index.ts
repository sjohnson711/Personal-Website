import "dotenv/config";
import { createApp } from "./app";
import { startMaintenance } from "./lib/notifications";
import { prisma } from "./lib/prisma";

const server = createApp().listen(Number(process.env.PORT ?? 3001), process.env.BIND_HOST ?? "0.0.0.0", () => {
  console.log(`Server listening on port ${process.env.PORT ?? 3001}`);
});
const stop = startMaintenance();
for (const signal of ["SIGINT", "SIGTERM"] as const) process.once(signal, () => {
  stop();
  server.close(async () => { await prisma.$disconnect(); process.exit(0); });
});
