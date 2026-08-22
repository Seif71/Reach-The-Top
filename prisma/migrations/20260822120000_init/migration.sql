-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."AdvertiserStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REMOVED');

-- CreateEnum
CREATE TYPE "public"."BidStatus" AS ENUM ('PENDING_PAYMENT', 'SUCCEEDED', 'FAILED', 'SUPERSEDED', 'REFUNDED', 'CANCELED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'CANCELED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Advertiser" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "websiteUrl" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "logoUrl" TEXT,
    "contactEmail" TEXT NOT NULL,
    "status" "public"."AdvertiserStatus" NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advertiser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Bid" (
    "id" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "userId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "minimumRequiredCents" INTEGER NOT NULL,
    "status" "public"."BidStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "failureReason" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "stripeCheckoutSessionId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripeCustomerId" TEXT,
    "stripeChargeId" TEXT,
    "stripeRefundId" TEXT,
    "refundedAt" TIMESTAMP(3),
    "failureMessage" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WinningPosition" (
    "id" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "WinningPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuctionState" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "currentBidCents" INTEGER NOT NULL DEFAULT 0,
    "currentAdvertiserId" TEXT,
    "currentPositionId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuctionState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PlatformSettings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "startingBidCents" INTEGER NOT NULL DEFAULT 800,
    "minIncrementCents" INTEGER NOT NULL DEFAULT 100,
    "leaderboardLimit" INTEGER NOT NULL DEFAULT 12,
    "requireApproval" BOOLEAN NOT NULL DEFAULT false,
    "advertisingRules" TEXT NOT NULL DEFAULT '',
    "siteName" TEXT NOT NULL DEFAULT 'ReachTheTop',
    "supportEmail" TEXT NOT NULL DEFAULT 'hello@example.com',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StripeEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Advertiser_status_idx" ON "public"."Advertiser"("status");

-- CreateIndex
CREATE INDEX "Advertiser_contactEmail_idx" ON "public"."Advertiser"("contactEmail");

-- CreateIndex
CREATE INDEX "Advertiser_userId_idx" ON "public"."Advertiser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Bid_stripeCheckoutSessionId_key" ON "public"."Bid"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "Bid_advertiserId_idx" ON "public"."Bid"("advertiserId");

-- CreateIndex
CREATE INDEX "Bid_status_idx" ON "public"."Bid"("status");

-- CreateIndex
CREATE INDEX "Bid_createdAt_idx" ON "public"."Bid"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_bidId_key" ON "public"."Payment"("bidId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeCheckoutSessionId_key" ON "public"."Payment"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "public"."Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "public"."Payment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WinningPosition_bidId_key" ON "public"."WinningPosition"("bidId");

-- CreateIndex
CREATE INDEX "WinningPosition_startedAt_idx" ON "public"."WinningPosition"("startedAt");

-- CreateIndex
CREATE INDEX "WinningPosition_endedAt_idx" ON "public"."WinningPosition"("endedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuctionState_currentAdvertiserId_key" ON "public"."AuctionState"("currentAdvertiserId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "public"."AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "public"."AuditLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "public"."Advertiser" ADD CONSTRAINT "Advertiser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bid" ADD CONSTRAINT "Bid_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "public"."Advertiser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bid" ADD CONSTRAINT "Bid_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "public"."Bid"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WinningPosition" ADD CONSTRAINT "WinningPosition_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "public"."Advertiser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WinningPosition" ADD CONSTRAINT "WinningPosition_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "public"."Bid"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuctionState" ADD CONSTRAINT "AuctionState_currentAdvertiserId_fkey" FOREIGN KEY ("currentAdvertiserId") REFERENCES "public"."Advertiser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

