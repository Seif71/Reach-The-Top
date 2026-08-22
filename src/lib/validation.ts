import { z } from "zod";
import { CATEGORIES } from "@/lib/categories";

const urlSchema = z
  .string()
  .trim()
  .min(1, "Website or app URL is required")
  .max(500)
  .refine((value) => {
    try {
      const parsed = new URL(value.includes("://") ? value : `https://${value}`);
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, "Enter a valid http(s) URL");

export const listingInputSchema = z.object({
  name: z.string().trim().max(80).optional().or(z.literal("")),
  websiteUrl: urlSchema,
  description: z.string().trim().max(280).optional().or(z.literal("")),
  category: z.enum(CATEGORIES).optional(),
  contactEmail: z.string().trim().email("Enter a valid contact email").max(255),
  logoUrl: z.string().trim().max(1000).optional().or(z.literal("")),
  bidDollars: z.coerce
    .number()
    .positive("Enter a price greater than $0")
    .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, "Use at most two decimal places"),
  placement: z.enum(["first", "list"]).optional().default("list"),
});

export const registerSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  name: z.string().trim().max(80).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const advertiserUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  websiteUrl: urlSchema,
  description: z.string().trim().min(12).max(280),
  category: z.enum(CATEGORIES),
  logoUrl: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const settingsUpdateSchema = z.object({
  startingBidCents: z.coerce.number().int().min(100).max(1_000_000_00),
  minIncrementCents: z.coerce.number().int().min(1).max(100_000_00),
  leaderboardLimit: z.coerce.number().int().min(1).max(50),
  requireApproval: z.coerce.boolean(),
  advertisingRules: z.string().max(8000),
  siteName: z.string().trim().min(2).max(60),
  supportEmail: z.string().trim().email(),
});

export function normalizeWebsiteUrl(raw: string): string {
  return raw.includes("://") ? raw : `https://${raw}`;
}
