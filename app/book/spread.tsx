import type { ReactNode } from "react";

import { Paginator } from "./paginator";

/**
 * A spread whose two pages do different jobs: the left paginates its own
 * content, the right holds a fixed viewer.
 *
 * The default arrangement is a single flow — left content, then right — which
 * is what the spec asks for on a narrow viewport, where "the left and right
 * pages of a spread become consecutive pages". The side-by-side grid is the
 * wide-viewport enhancement, applied in CSS. Defaulting to the flow means the
 * fallback never hides the viewer; it just stops being a spread.
 */
export function Spread({
  left,
  right,
  chapter,
}: {
  left: ReactNode;
  right: ReactNode;
  /** The chapter, deliberately excluding the selected entry: choosing a date
   *  changes the viewer, and must not turn the record back to its first page. */
  chapter: string;
}) {
  return (
    <div className="spread-regions">
      <div className="spread-region spread-region-left">
        <Paginator columns={1} resetKey={chapter}>
          {left}
          {/* Only in the collapsed arrangement does the viewer join the flow;
              the grid pulls the other copy out of it at wide widths. */}
          <div className="spread-inline-viewer">{right}</div>
        </Paginator>
      </div>

      {/* The viewer is rendered in both arrangements and CSS hides one. It is
          static markup with nothing focusable, and `display: none` keeps the
          hidden copy out of the accessibility tree, so only one is ever real. */}
      <div className="spread-region spread-region-right">{right}</div>
    </div>
  );
}
