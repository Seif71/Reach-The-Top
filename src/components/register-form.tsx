"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerUser } from "@/app/actions/auth";

export function RegisterForm() {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string } | undefined, formData: FormData) => registerUser(formData),
    undefined,
  );

  return (
    <form action={action} className="mt-8 grid gap-4">
      <label className="grid gap-2 text-sm">
        Name
        <input name="name" className="rounded-2xl border border-line px-4 py-3" />
      </label>
      <label className="grid gap-2 text-sm">
        Email
        <input name="email" type="email" required className="rounded-2xl border border-line px-4 py-3" />
      </label>
      <label className="grid gap-2 text-sm">
        Password
        <input name="password" type="password" required minLength={8} className="rounded-2xl border border-line px-4 py-3" />
      </label>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button disabled={pending} className="rounded-lg bg-gold py-3 text-sm font-medium text-white disabled:opacity-60">
        {pending ? "Creating…" : "Create account"}
      </button>
      <p className="text-sm text-muted">
        Already registered?{" "}
        <Link href="/login" className="text-gold">
          Sign in
        </Link>
      </p>
    </form>
  );
}
