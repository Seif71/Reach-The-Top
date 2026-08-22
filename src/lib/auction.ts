import { prisma } from "@/lib/prisma";
import type { AuctionSnapshot } from "@/lib/bidding-rules";
import { minimumValidBidCents } from "@/lib/bidding-rules";

const DEFAULT_SETTINGS = {
  id: "global",
  startingBidCents: 100,
  minIncrementCents: 100,
  leaderboardLimit: 12,
  requireApproval: false,
  advertisingRules:
    "Advertisers purchase homepage ranking by paying any amount at or above the opening price. The highest confirmed payment holds #1. Placement is advertising visibility only. Traffic, clicks, sales, downloads, and conversions are not guaranteed.",
  siteName: "ReachTheTop",
  supportEmail: "hello@example.com",
  updatedAt: new Date(0),
};

export async function getSettings() {
  try {
    const existing = await prisma.platformSettings.findUnique({
      where: { id: "global" },
    });
    if (existing) return existing;
    return prisma.platformSettings.create({
      data: {
        id: "global",
        advertisingRules: DEFAULT_SETTINGS.advertisingRules,
      },
    });
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function getAuctionSnapshot(): Promise<
  AuctionSnapshot & {
    currentAdvertiserId: string | null;
    version: number;
  }
> {
  const [settings, state] = await Promise.all([
    getSettings(),
    prisma.auctionState.findUnique({ where: { id: "global" } }),
  ]);

  const currentBidCents = state?.currentBidCents ?? 0;
  const hasWinner = Boolean(state?.currentAdvertiserId) && currentBidCents > 0;

  return {
    currentBidCents,
    hasWinner,
    startingBidCents: settings.startingBidCents,
    minIncrementCents: settings.minIncrementCents,
    currentAdvertiserId: state?.currentAdvertiserId ?? null,
    version: state?.version ?? 0,
  };
}

export async function getLiveAuction() {
  const [settings, state] = await Promise.all([
    getSettings(),
    prisma.auctionState.findUnique({
      where: { id: "global" },
      include: {
        currentAdvertiser: true,
      },
    }),
  ]);

  const currentBidCents = state?.currentBidCents ?? 0;
  const hasWinner = Boolean(state?.currentAdvertiser) && currentBidCents > 0;
  const snapshot = {
    currentBidCents,
    hasWinner,
    startingBidCents: settings.startingBidCents,
    minIncrementCents: settings.minIncrementCents,
  };

  return {
    settings,
    state,
    snapshot,
    currentAdvertiser: state?.currentAdvertiser ?? null,
    minimumBidCents: minimumValidBidCents(snapshot, "list"),
    firstPlaceMinCents: minimumValidBidCents(snapshot, "first"),
  };
}
