"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginUser } from "@/app/actions/auth";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string } | undefined, formData: FormData) => loginUser(formData),
    undefined,
  );

  return (
    <form action={action} className="mt-8 grid gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <label className="grid gap-2 text-sm">
        Email
        <input name="email" type="email" required className="rounded-2xl border border-line px-4 py-3" />
      </label>
      <label className="grid gap-2 text-sm">
        Password
        <input name="password" type="password" required className="rounded-2xl border border-line px-4 py-3" />
      </label>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button disabled={pending} className="rounded-lg bg-gold py-3 text-sm font-medium text-white disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-sm text-muted">
        No account?{" "}
        <Link href="/register" className="text-gold">
          Create one
        </Link>
      </p>
    </form>
  );
}
