import Link from "next/link";

import { getContents } from "@/lib/queries";

import { IndexForm } from "./index-form";
import { Paginator } from "./book/paginator";

export default async function IndexPage() {
  const contents = await getContents();

  return (
    <Paginator>
      <h1 className="display-face text-4xl font-semibold">The Index</h1>
      <p className="mt-3 text-base text-foreground/60">
        Every game set down in this book.
      </p>

      {contents.length === 0 ? (
        <p className="mt-8 text-base text-foreground/60">
          Nothing has been recorded here yet. Write the first title below.
        </p>
      ) : (
        <ul className="mt-8 space-y-1">
          {contents.map((entry) => (
            <li key={entry.id}>
              <Link
                href={`/games/${entry.id}`}
                className="flex min-h-12 items-baseline gap-2 py-1 text-base transition-colors hover:text-accent"
              >
                <span className="display-face shrink-0">{entry.name}</span>
                {/* Dot leaders as a dotted rule rather than repeated periods,
                    which a screen reader would read out one by one. */}
                <span
                  aria-hidden="true"
                  className="min-w-4 flex-1 translate-y-[-0.25rem] border-b border-dotted border-foreground/30"
                />
                <span className="shrink-0 tabular-nums text-foreground/55">
                  {entry.nights === 0 ? "—" : entry.nights}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 border-t border-foreground/15 pt-6">
        <IndexForm />
      </div>
    </Paginator>
  );
}
