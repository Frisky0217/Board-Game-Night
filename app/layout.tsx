import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { Paginator } from "./book/paginator";
import { Nav } from "./nav";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${nunitoSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      {/* desk → cover → text block → spread. The two leaves are decoration
          only: they carry the paper, its foxing and the light. Content flows
          above them in .book-stage so one light spans one book. */}
      <body className="desk font-sans">
        <div className="book">
          <div className="book-block">
            <div className="spread">
              <div className="leaf leaf-left" aria-hidden="true" />
              <div className="leaf leaf-right" aria-hidden="true" />
              <span aria-hidden="true" className="page-gutter" />

              <div className="book-stage">
                {/* Outside the flow, so the running head does not paginate. */}
                <div className="book-head">
                  <Nav />
                </div>
                <Paginator>{children}</Paginator>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
