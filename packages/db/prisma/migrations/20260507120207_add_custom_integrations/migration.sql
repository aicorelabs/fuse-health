-- CreateTable
CREATE TABLE "CustomIntegration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'custom',
    "baseUrl" TEXT,
    "defaultHeaders" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomFunction" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "method" TEXT NOT NULL DEFAULT 'GET',
    "pathTemplate" TEXT NOT NULL,
    "headers" JSONB NOT NULL DEFAULT '{}',
    "query" JSONB NOT NULL DEFAULT '{}',
    "bodyTemplate" JSONB,
    "timeoutMs" INTEGER NOT NULL DEFAULT 50000,
    "sampleInput" JSONB,
    "sampleOutput" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFunction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomIntegration_name_key" ON "CustomIntegration"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFunction_integrationId_name_key" ON "CustomFunction"("integrationId", "name");

-- AddForeignKey
ALTER TABLE "CustomFunction" ADD CONSTRAINT "CustomFunction_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "CustomIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
