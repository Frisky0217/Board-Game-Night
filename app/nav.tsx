"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// A client component purely so the current route can be highlighted.
const LINKS = [
  { href: "/sessions", label: "The Chronicle" },
  { href: "/standings", label: "The Tally" },
  { href: "/sessions/new", label: "Record an entry" },
] as const;

export function Nav() {
  const pathname = usePathname();

  return (
    <header>
      {/* A running head on the left page: the book's title, then its sections. */}
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 border-b border-foreground/15 pb-2">
        <Link
          href="/"
          className="display-face mr-auto text-lg font-semibold tracking-wide"
        >
          The Archive
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
                "display-face py-1 text-sm transition-colors " +
                (active
                  ? "text-accent underline decoration-accent/40 underline-offset-4"
                  : "text-foreground/55 hover:text-foreground")
              }
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
