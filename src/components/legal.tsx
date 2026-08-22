import type { Metadata } from "next";

export function LegalPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16">
      <p className="text-sm text-muted">Placeholder — customize with counsel</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-4 text-sm leading-7">{description}</p>
      <div className="prose-legal mt-10 space-y-6 text-sm leading-7">{children}</div>
    </article>
  );
}

export const legalMetadata = (title: string, description: string): Metadata => ({
  title,
  description,
});
