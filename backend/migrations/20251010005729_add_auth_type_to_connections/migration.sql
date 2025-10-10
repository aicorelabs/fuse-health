-- CreateEnum
CREATE TYPE "AuthType" AS ENUM ('OAUTH2', 'API_KEY', 'BASIC_AUTH', 'BEARER_TOKEN', 'CLIENT_CREDENTIALS', 'SSH_KEY', 'CUSTOM');

-- AlterTable
ALTER TABLE "connections" ADD COLUMN     "authConfig" JSONB,
ADD COLUMN     "authType" "AuthType" NOT NULL DEFAULT 'OAUTH2';

-- CreateIndex
CREATE INDEX "connections_authType_idx" ON "connections"("authType");
