import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-3 text-sm text-muted">Sign in to manage your listing and payments.</p>
      <LoginForm callbackUrl={params.callbackUrl ?? "/dashboard"} />
    </div>
  );
}
