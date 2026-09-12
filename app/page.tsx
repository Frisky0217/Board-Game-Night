import Link from "next/link";

const DESTINATIONS = [
  {
    href: "/sessions/new",
    label: "Add a session",
    description: "Record tonight's game",
    primary: true,
  },
  {
    href: "/sessions",
    label: "Sessions",
    description: "Every game night so far",
    primary: false,
  },
  {
    href: "/standings",
    label: "Standings",
    description: "Wins per player",
    primary: false,
  },
] as const;

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center font-sans">
      <main className="w-full max-w-3xl px-6 py-10 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Game Night</h1>
        <p className="mt-3 text-base opacity-60">
          A shared log of board game nights. Anyone with the link can add one.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {DESTINATIONS.map((destination) => (
            <Link
              key={destination.href}
              href={destination.href}
              className={
                "flex min-h-16 flex-col justify-center rounded-xl px-5 py-3 transition-opacity hover:opacity-90 " +
                (destination.primary
                  ? "bg-accent text-accent-foreground"
                  : "border border-black/[.12] dark:border-white/[.16]")
              }
            >
              <span className="text-base font-medium">{destination.label}</span>
              <span
                className={
                  "text-sm " +
                  (destination.primary ? "opacity-80" : "opacity-60")
                }
              >
                {destination.description}
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
