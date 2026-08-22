export const CATEGORIES = [
  "SaaS",
  "Mobile App",
  "Software",
  "E-commerce",
  "Finance",
  "Health",
  "Education",
  "Media",
  "Marketing",
  "Marketplace",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}
