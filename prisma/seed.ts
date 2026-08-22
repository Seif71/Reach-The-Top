import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@example.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "change-me-now";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN", passwordHash },
    create: {
      email: adminEmail,
      passwordHash,
      name: "Platform Owner",
      role: "ADMIN",
    },
  });

  await prisma.platformSettings.upsert({
    where: { id: "global" },
    update: { siteName: "ReachTheTop", startingBidCents: 100 },
    create: {
      id: "global",
      startingBidCents: 100,
      minIncrementCents: 100,
      leaderboardLimit: 12,
      requireApproval: false,
      siteName: "ReachTheTop",
      supportEmail: adminEmail,
      advertisingRules:
        "Advertisers purchase homepage ranking by paying any amount at or above the opening price. The highest confirmed payment holds #1. This is paid advertising visibility on the platform homepage. Traffic, sales, downloads, and conversions are not guaranteed.",
    },
  });

  await prisma.auctionState.upsert({
    where: { id: "global" },
    update: {
      currentBidCents: 0,
      currentAdvertiserId: null,
      currentPositionId: null,
    },
    create: {
      id: "global",
      currentBidCents: 0,
    },
  });

  console.log("Seed complete. Admin login:", adminEmail);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
