import Image from "next/image";

import { formatPlayedOn } from "@/lib/format";
import type { EntryDetail } from "@/lib/types";

/**
 * The right page: the selected entry, viewed in full.
 *
 * A photograph is the uncommon case, so the plate is designed as a deliberate
 * absence — a ruled, empty frame the way a book leaves room for a plate that
 * was never pasted in — rather than as a broken or missing image.
 */
export function EntryViewer({ entry }: { entry: EntryDetail | null }) {
  if (!entry) {
    return (
      <p className="text-base text-foreground/60">
        Nothing has been recorded here yet.
      </p>
    );
  }

  const winners = entry.players.filter((player) => player.won);

  return (
    <article className="space-y-5">
      {/* The plate keeps its shape either way, so the page does not reflow
          around whether a photograph exists — and `contain` means a face is
          never cropped to fill it. */}
      {entry.photoUrl ? (
        <div className="edge-soft relative aspect-[4/3] w-full overflow-hidden bg-foreground/5">
          <Image
            src={entry.photoUrl}
            alt={`Photograph from ${formatPlayedOn(entry.playedOn)}`}
            fill
            sizes="(max-width: 48rem) 90vw, 40vw"
            className="object-contain"
          />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="edge-soft flex aspect-[4/3] w-full items-center justify-center border border-dashed border-foreground/25"
        >
          <span className="display-face text-sm text-foreground/40">
            No likeness kept
          </span>
        </div>
      )}

      <div className="space-y-1">
        <h2 className="display-face text-2xl font-semibold">
          {formatPlayedOn(entry.playedOn)}
        </h2>
        <p className="text-sm text-foreground/55">
          {winners.length === 0
            ? "No hand was marked as won."
            : `Won by ${winners.map((player) => player.name).join(", ")}.`}
        </p>
      </div>

      {entry.description && (
        <p className="text-base leading-relaxed text-foreground/80">
          {entry.description}
        </p>
      )}

      {entry.players.length > 0 && (
        <div className="space-y-2 border-t border-foreground/15 pt-4">
          <h3 className="text-sm font-medium text-foreground/60">
            Whose hands
          </h3>
          <ul className="space-y-1">
            {entry.players.map((player) => (
              <li
                key={player.id}
                className={
                  player.won
                    ? "text-base font-medium text-gold"
                    : "text-base text-foreground/70"
                }
              >
                {player.name}
                {player.won && (
                  <span aria-label="won" className="ml-1">
                    ✓
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
