import Link from "next/link";
import { auth } from "@/lib/auth";
import { logoutUser } from "@/app/actions/auth";
import { MobileNav } from "@/components/mobile-nav";

export async function Navbar() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-white/95 backdrop-blur">
      <div className="relative flex h-16 w-full items-center justify-between px-4 sm:px-6">
        <Link href="/" className="shrink-0 text-[15px] font-semibold tracking-tight">
          ReachTheTop
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <nav className="hidden items-center gap-5 text-sm text-muted md:flex">
            <Link href="/#live" className="hover:text-ink">
              Live
            </Link>
            <Link href="/#rankings" className="hover:text-ink">
              Rankings
            </Link>
            <Link href="/#rules" className="hover:text-ink">
              Rules
            </Link>
            {session?.user?.role === "ADMIN" && (
              <Link href="/admin" className="hover:text-ink">
                Admin
              </Link>
            )}
            {session?.user && (
              <>
                <Link href="/dashboard" className="hover:text-ink">
                  Account
                </Link>
                <form action={logoutUser}>
                  <button className="hover:text-ink">Log out</button>
                </form>
              </>
            )}
          </nav>
          <MobileNav isLoggedIn={Boolean(session?.user)} isAdmin={session?.user?.role === "ADMIN"} />
          <a href="#claim" className="rounded-md bg-gold px-3 py-1.5 text-sm font-medium text-white hover:bg-gold-2">
            Get #1
          </a>
        </div>
      </div>
    </header>
  );
}

export function Footer({ supportEmail }: { supportEmail: string }) {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-5 py-8 text-sm text-muted md:flex-row md:justify-between">
        <p>Advertising placement. Results are not guaranteed.</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <a href="/#rules">Rules</a>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/advertising-policy">Advertising</Link>
          <Link href="/refund-policy">Refunds</Link>
          <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
        </div>
      </div>
    </footer>
  );
}
