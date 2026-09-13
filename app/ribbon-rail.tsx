"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import type { Game } from "@/lib/types";

// Six curated hues, cycled. With many games colours repeat, but position and
// the always-present accessible name keep them apart.
const RIBBON_COLORS = [
  "var(--ribbon-1)",
  "var(--ribbon-2)",
  "var(--ribbon-3)",
  "var(--ribbon-4)",
  "var(--ribbon-5)",
  "var(--ribbon-6)",
];

/**
 * Tighten as the count grows. Few games hang long and roomy; many tighten to a
 * floor that is still a comfortable touch target, and the rail scrolls past
 * whatever fits.
 */
function sizing(count: number) {
  if (count <= 4) return { height: "5.5rem", gap: "0.5rem" };
  if (count <= 8) return { height: "4rem", gap: "0.375rem" };
  return { height: "2.75rem", gap: "0.25rem" };
}

function initial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function RibbonRail({ games }: { games: Game[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (games.length === 0) return null;

  const rawGame = searchParams.get("game");
  const activeId =
    pathname === "/sessions" && rawGame !== null ? Number(rawGame) : null;

  const { height, gap } = sizing(games.length);

  return (
    <nav
      aria-label="Bookmarks"
      className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-start pt-16 sm:pt-20"
    >
      <ul
        style={{ gap }}
        className="pointer-events-auto flex max-h-[calc(100%-6rem)] flex-col overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_bottom,transparent,black_1.25rem,black_calc(100%-1.25rem),transparent)]"
      >
        {games.map((game, index) => {
          const active = game.id === activeId;
          return (
            <li key={game.id}>
              <Link
                // The active ribbon closes the bookmark rather than re-applying it.
                href={active ? "/sessions" : `/sessions?game=${game.id}`}
                aria-label={game.name}
                aria-current={active ? "true" : undefined}
                title={game.name}
                style={{
                  backgroundColor: RIBBON_COLORS[index % RIBBON_COLORS.length],
                  height,
                }}
                className={
                  "flex w-8 items-center justify-center rounded-l-sm text-[0.7rem] font-medium text-[#f7f1e3] shadow-[-1px_1px_3px_rgb(43_33_26/0.35)] transition-[width,transform,filter] " +
                  (active
                    ? "w-11 translate-x-0 brightness-125 saturate-125"
                    : "translate-x-1.5 brightness-90 hover:translate-x-0.5 hover:brightness-100")
                }
              >
                {/* The initial is decoration over a real accessible name; the
                    active ribbon spells the name out down its length. */}
                <span aria-hidden="true">
                  {active ? (
                    <span className="block max-h-full overflow-hidden text-ellipsis whitespace-nowrap py-1 [writing-mode:vertical-rl]">
                      {game.name}
                    </span>
                  ) : (
                    initial(game.name)
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
