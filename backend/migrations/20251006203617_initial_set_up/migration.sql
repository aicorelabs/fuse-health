-- CreateEnum
CREATE TYPE "McpConfigurationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR', 'DRAFT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chats" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mcp_server_definitions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isManaged" BOOLEAN NOT NULL DEFAULT true,
    "configSchema" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mcp_server_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_mcp_configurations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" "McpConfigurationStatus" NOT NULL DEFAULT 'DRAFT',
    "configValues" JSONB NOT NULL,
    "metadata" JSONB,
    "last_status_change" TIMESTAMP(3),
    "last_status_message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_mcp_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "mcp_server_definitions_slug_key" ON "mcp_server_definitions"("slug");

-- CreateIndex
CREATE INDEX "user_mcp_configurations_userId_idx" ON "user_mcp_configurations"("userId");

-- CreateIndex
CREATE INDEX "user_mcp_configurations_serverId_idx" ON "user_mcp_configurations"("serverId");

-- CreateIndex
CREATE UNIQUE INDEX "user_mcp_configurations_userId_serverId_displayName_key" ON "user_mcp_configurations"("userId", "serverId", "displayName");

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_mcp_configurations" ADD CONSTRAINT "user_mcp_configurations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_mcp_configurations" ADD CONSTRAINT "user_mcp_configurations_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "mcp_server_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
