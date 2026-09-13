import { Suspense } from "react";

import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { Nav } from "./nav";
import { RibbonRail } from "./ribbon-rail";
import { getGames } from "@/lib/queries";

// Both are variable fonts, so `weight` is omitted to get the full range.
const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
});

// SOFT and WONK are not included by default — they have to be requested here and
// then set via font-variation-settings in globals.css.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

export const metadata: Metadata = {
  title: "The Archive",
  description: "A record of game nights.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const games = await getGames();

  return (
    <html
      lang="en"
      className={`${nunitoSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      {/* Three layers: the desk, the board, the page. */}
      <body className="flex min-h-full flex-col bg-background p-0 sm:p-6 md:p-10">
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col bg-board p-1 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.75)] sm:rounded-sm sm:p-2">
          <div className="page-surface relative flex flex-1 flex-col font-sans">
            <span aria-hidden="true" className="page-gutter" />

            <Nav />
            <main className="w-full flex-1 px-6 py-10 pr-16 pl-8 sm:py-14 sm:pr-20 sm:pl-12">
              <div className="mx-auto w-full max-w-2xl">{children}</div>
            </main>

            {/* useSearchParams suspends during prerender; without this boundary
                the build fails even though dev appears to work. */}
            <Suspense fallback={null}>
              <RibbonRail games={games} />
            </Suspense>
          </div>
        </div>
      </body>
    </html>
  );
}
