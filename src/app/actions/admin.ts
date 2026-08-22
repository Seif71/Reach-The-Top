"use server";

import { revalidatePath } from "next/cache";
import { AdvertiserStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { seatPaidBidIfStillWinning } from "@/lib/payments";
import { advertiserUpdateSchema, settingsUpdateSchema } from "@/lib/validation";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function updateSettingsAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = settingsUpdateSchema.safeParse({
    startingBidCents: Math.round(Number(formData.get("startingBidDollars")) * 100),
    minIncrementCents: Math.round(Number(formData.get("minIncrementDollars")) * 100),
    leaderboardLimit: formData.get("leaderboardLimit"),
    requireApproval: formData.get("requireApproval") === "on",
    advertisingRules: formData.get("advertisingRules"),
    siteName: formData.get("siteName"),
    supportEmail: formData.get("supportEmail"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid settings");
  }

  await prisma.platformSettings.upsert({
    where: { id: "global" },
    update: parsed.data,
    create: { id: "global", ...parsed.data },
  });
  await writeAudit({
    actorId: admin.id,
    action: "settings.updated",
    entityType: "PlatformSettings",
    entityId: "global",
  });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateAdvertiserAction(id: string, formData: FormData) {
  const admin = await requireAdmin();
  const parsed = advertiserUpdateSchema.safeParse({
    name: formData.get("name"),
    websiteUrl: formData.get("websiteUrl"),
    description: formData.get("description"),
    category: formData.get("category"),
    logoUrl: formData.get("logoUrl"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid listing");
  }

  await prisma.advertiser.update({
    where: { id },
    data: {
      ...parsed.data,
      logoUrl: parsed.data.logoUrl || null,
    },
  });
  await writeAudit({
    actorId: admin.id,
    action: "advertiser.updated",
    entityType: "Advertiser",
    entityId: id,
  });
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function setAdvertiserStatusAction(id: string, status: AdvertiserStatus) {
  const admin = await requireAdmin();
  await prisma.advertiser.update({ where: { id }, data: { status } });

  if (status === "APPROVED") {
    const latest = await prisma.bid.findFirst({
      where: { advertiserId: id, status: "SUCCEEDED" },
      orderBy: { createdAt: "desc" },
    });
    if (latest) {
      await seatPaidBidIfStillWinning(latest.id);
    }
  }

  if (status === "REMOVED" || status === "REJECTED") {
    const state = await prisma.auctionState.findUnique({ where: { id: "global" } });
    if (state?.currentAdvertiserId === id) {
      await prisma.winningPosition.updateMany({
        where: { advertiserId: id, endedAt: null },
        data: { endedAt: new Date() },
      });
      await prisma.auctionState.update({
        where: { id: "global" },
        data: {
          currentAdvertiserId: null,
          currentPositionId: null,
          version: { increment: 1 },
        },
      });
    }
  }

  await writeAudit({
    actorId: admin.id,
    action: `advertiser.${status.toLowerCase()}`,
    entityType: "Advertiser",
    entityId: id,
  });
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function updateOwnListingAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Sign in required");

  const listing = await prisma.advertiser.findUnique({ where: { id } });
  if (!listing || listing.userId !== session.user.id) throw new Error("Not found");

  const parsed = advertiserUpdateSchema.safeParse({
    name: formData.get("name"),
    websiteUrl: formData.get("websiteUrl"),
    description: formData.get("description"),
    category: formData.get("category"),
    logoUrl: formData.get("logoUrl"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid listing");

  await prisma.advertiser.update({
    where: { id },
    data: { ...parsed.data, logoUrl: parsed.data.logoUrl || null },
  });
  revalidatePath("/dashboard");
  revalidatePath("/");
}
