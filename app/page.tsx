import Link from "next/link";

const DESTINATIONS = [
  {
    href: "/sessions/new",
    label: "Record an entry",
    description: "Set down tonight's game",
    primary: true,
  },
  {
    href: "/sessions",
    label: "The Chronicle",
    description: "Every night set down so far",
    primary: false,
  },
  {
    href: "/standings",
    label: "The Tally",
    description: "Hands won, by player",
    primary: false,
  },
] as const;

export default function Home() {
  return (
    <>
      <h1 className="display-face text-4xl font-semibold">The Archive</h1>
      <p className="mt-3 text-base text-foreground/60">
        A record of game nights. Anyone holding the link may set one down.
      </p>

      {/* Block flow, not column flex: a column flex container fragments badly
          in multicol and would be clipped instead of flowing to the next page. */}
      <div className="mt-8 space-y-3">
        {DESTINATIONS.map((destination) => (
          <Link
            key={destination.href}
            href={destination.href}
            className={
              "flex min-h-16 flex-col justify-center px-5 py-3 transition-opacity hover:opacity-90 " +
              (destination.primary
                ? "edge-soft bg-accent text-accent-foreground shadow-[0_2px_10px_-2px_rgb(43_33_26/0.35)]"
                : "edge-soft-b on-page")
            }
          >
            <span className="text-base font-medium">{destination.label}</span>
            <span
              className={
                "text-sm " +
                (destination.primary
                  ? "text-accent-foreground/80"
                  : "text-foreground/60")
              }
            >
              {destination.description}
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
