-- CreateTable
CREATE TABLE "EmbedCache" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "image" TEXT,
    "provider" TEXT,
    "embedHtml" TEXT,
    "ok" BOOLEAN NOT NULL DEFAULT true,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmbedCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmbedCache_url_key" ON "EmbedCache"("url");

-- CreateIndex
CREATE INDEX "EmbedCache_fetchedAt_idx" ON "EmbedCache"("fetchedAt");
