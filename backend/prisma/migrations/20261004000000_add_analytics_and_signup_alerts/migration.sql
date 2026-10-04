CREATE TABLE "PageView" (
  "id" UUID NOT NULL,
  "path" VARCHAR(512) NOT NULL,
  "referrerHost" VARCHAR(253),
  "device" VARCHAR(16) NOT NULL,
  "day" DATE NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PageView_createdAt_idx" ON "PageView"("createdAt");
CREATE INDEX "PageView_day_path_idx" ON "PageView"("day", "path");
CREATE TABLE "Interaction" (
  "id" SERIAL NOT NULL,
  "kind" VARCHAR(16) NOT NULL,
  "sourceId" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT,
  "articleId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Interaction_kind_sourceId_key" ON "Interaction"("kind", "sourceId");
CREATE INDEX "Interaction_createdAt_idx" ON "Interaction"("createdAt");
CREATE TABLE "NotificationJob" (
  "id" UUID NOT NULL,
  "subscriberEmail" TEXT NOT NULL,
  "signupAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "firstAttemptAt" TIMESTAMP(3),
  "leaseUntil" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "providerId" TEXT,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationJob_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "NotificationJob_status_nextAttemptAt_idx" ON "NotificationJob"("status", "nextAttemptAt");
CREATE INDEX "NotificationJob_createdAt_idx" ON "NotificationJob"("createdAt");
-- Backfill recent subscriptions/comments without generating historical alerts.
INSERT INTO "Interaction" ("kind", "sourceId", "email", "createdAt")
SELECT 'subscription', "id"::text, "email", "createdAt" FROM "Subscriber"
WHERE "createdAt" >= CURRENT_TIMESTAMP - INTERVAL '90 days';
INSERT INTO "Interaction" ("kind", "sourceId", "name", "articleId", "createdAt")
SELECT 'comment', "id"::text, "name", "articleId", "createdAt" FROM "Comment"
WHERE "createdAt" >= CURRENT_TIMESTAMP - INTERVAL '90 days';
