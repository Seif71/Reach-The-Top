"use client";

import Link from "next/link";
import { useState } from "react";
import { logoutUser } from "@/app/actions/auth";

export function MobileNav({
  isLoggedIn,
  isAdmin,
}: {
  isLoggedIn: boolean;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-label="Open menu"
        onClick={() => setOpen((value) => !value)}
        className="rounded-lg border border-line px-3 py-1.5 text-sm"
      >
        Menu
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-16 border-b border-line bg-white px-5 py-4">
          <nav className="flex flex-col gap-3 text-sm">
            <a href="#rules" onClick={() => setOpen(false)}>
              Rules
            </a>
            {isLoggedIn && (
              <>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setOpen(false)}>
                    Admin
                  </Link>
                )}
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  Account
                </Link>
                <form action={logoutUser}>
                  <button className="text-left">Log out</button>
                </form>
              </>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
