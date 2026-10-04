import { prisma } from "./prisma";
import { sendMail, Mail, MailError, escapeHtml } from "./mailTransport";

const RETRY_WINDOW = 23 * 60 * 60_000;
const LEASE_MS = 2 * 60_000;
export type MailSender = (mail: Mail, key?: string) => Promise<string>;

export async function processNotifications(send: MailSender = sendMail, now = new Date()): Promise<void> {
  for (let count = 0; count < 20; count++) {
    const job = await prisma.notificationJob.findFirst({ where: { OR: [
      { status: "pending", nextAttemptAt: { lte: now } }, { status: "processing", leaseUntil: { lte: now } },
    ] }, orderBy: { nextAttemptAt: "asc" } });
    if (!job) return;
    const leaseUntil = new Date(now.getTime() + LEASE_MS);
    const claimed = await prisma.notificationJob.updateMany({ where: { id: job.id, updatedAt: job.updatedAt }, data: {
      status: "processing", leaseUntil, attempts: { increment: 1 }, firstAttemptAt: job.firstAttemptAt ?? now,
    } });
    if (!claimed.count) continue;
    const ownership = { id: job.id, status: "processing", leaseUntil };
    const firstAttemptAt = job.firstAttemptAt ?? now;
    if (now.getTime() - firstAttemptAt.getTime() >= RETRY_WINDOW) {
      await prisma.notificationJob.updateMany({ where: ownership, data: { status: "failed", leaseUntil: null, lastError: "retry_window_expired" } });
      continue;
    }
    const subject = "New newsletter subscription";
    const text = `Submitted email (unverified): ${job.subscriberEmail}\nSignup time: ${job.signupAt.toISOString()}\nSite: Letter of Forgiveness`;
    try {
      const providerId = await send({ from: process.env.FROM_EMAIL ?? "onboarding@resend.dev", to: "samaritanbrotherseth@gmail.com", subject, text,
        html: `<h1>${subject}</h1><p>Submitted email (unverified): <strong>${escapeHtml(job.subscriberEmail)}</strong></p><p>Signup time: ${job.signupAt.toISOString()}</p>` }, `subscriber-alert/${job.id}`);
      await prisma.notificationJob.updateMany({ where: ownership, data: { status: "sent", sentAt: now, providerId, leaseUntil: null, lastError: null } });
    } catch (err) {
      const transient = !(err instanceof MailError) || err.transient;
      const delay = Math.min(6 * 60 * 60_000, 60_000 * 2 ** Math.min(job.attempts, 9));
      const canRetry = transient && now.getTime() + delay - firstAttemptAt.getTime() < RETRY_WINDOW;
      await prisma.notificationJob.updateMany({ where: ownership, data: {
        status: canRetry ? "pending" : "failed", leaseUntil: null, nextAttemptAt: new Date(now.getTime() + delay),
        lastError: err instanceof MailError ? err.code : "transport_failure",
      } });
    }
  }
}

export async function cleanupHistory(now = new Date()): Promise<void> {
  const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60_000);
  await prisma.$transaction([
    prisma.pageView.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    prisma.interaction.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    prisma.notificationJob.deleteMany({ where: { createdAt: { lt: cutoff } } }),
  ]);
}
export function startMaintenance(): () => void {
  let busy = false;
  let lastCleanup = 0;
  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      await processNotifications();
      if (Date.now() - lastCleanup > 60 * 60_000) { await cleanupHistory(); lastCleanup = Date.now(); }
    } catch { console.error("[maintenance] Processing failed; will retry on the next tick"); }
    finally { busy = false; }
  };
  void tick();
  const timer = setInterval(() => { void tick(); }, 15_000);
  timer.unref();
  return () => clearInterval(timer);
}
