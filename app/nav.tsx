"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// A client component purely so the current route can be highlighted.
const LINKS = [
  { href: "/sessions", label: "Sessions" },
  { href: "/standings", label: "Standings" },
  { href: "/sessions/new", label: "Add" },
] as const;

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-black/[.06] font-sans dark:border-white/[.1]">
      <nav className="mx-auto flex w-full max-w-3xl items-center gap-1 px-6">
        <Link
          href="/"
          className="mr-auto py-4 text-base font-semibold tracking-tight"
        >
          Game Night
        </Link>

        {LINKS.map((link) => {
          // `/sessions/new` is nested under `/sessions`, so an exact match is
          // what keeps both from lighting up at once.
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={
                "flex min-h-12 items-center rounded-full px-3 text-sm font-medium transition-colors " +
                (active ? "text-accent" : "opacity-60 hover:opacity-100")
              }
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
