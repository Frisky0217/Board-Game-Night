"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type ReactNode,
} from "react";

// This component is server-rendered, and useLayoutEffect warns during SSR.
const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

type Geometry = {
  spreadCount: number;
  pageCount: number;
  spreadPitch: number;
  columnsPerSpread: number;
};

const UNPAGED: Geometry = {
  spreadCount: 1,
  pageCount: 1,
  spreadPitch: 0,
  columnsPerSpread: 1,
};

function readGeometry(flow: HTMLElement): Geometry {
  const style = getComputedStyle(flow);

  // Resolves to "auto" while unpaged, hence the fallback.
  const columnsPerSpread = Math.max(
    1,
    Number.parseInt(style.columnCount, 10) || 1,
  );

  // Resolves to "normal" when unset.
  const parsedGap = Number.parseFloat(style.columnGap);
  const gap = Number.isFinite(parsedGap) ? parsedGap : 0;

  // rect.width, not clientWidth: clientWidth is integer-rounded and layout is
  // subpixel. Sound only because .book-flow has no padding or border.
  const inner = flow.getBoundingClientRect().width;
  if (inner <= 0) return UNPAGED;

  const columnWidth = (inner - gap * (columnsPerSpread - 1)) / columnsPerSpread;
  const columnPitch = columnWidth + gap;
  if (columnPitch <= 0) return UNPAGED;

  // Three traps in one expression:
  //  1. Count columns, not spreads — three columns is one and a half spreads,
  //     and dividing by the spread pitch loses the third page entirely.
  //  2. scrollWidth stops at the right edge of the last column, so it is short
  //     by exactly one trailing gap. Add it back before dividing.
  //  3. round, never ceil. scrollWidth is integer-rounded against a subpixel
  //     pitch, so ceil turns 3.0004 into 4 and invents a blank final spread.
  const pageCount = Math.max(
    1,
    Math.round((flow.scrollWidth + gap) / columnPitch),
  );

  return {
    pageCount,
    columnsPerSpread,
    spreadCount: Math.max(1, Math.ceil(pageCount / columnsPerSpread)),
    spreadPitch: inner + gap,
  };
}

function spreadOf(flow: HTMLElement, el: Element, g: Geometry): number {
  if (g.spreadPitch <= 0) return 0;
  const offset =
    el.getBoundingClientRect().left -
    flow.getBoundingClientRect().left +
    flow.scrollLeft;
  // +1 absorbs subpixel drift so an element sitting on a page edge is
  // attributed to the page it visually starts on.
  const index = Math.floor((offset + 1) / g.spreadPitch);
  return Math.min(g.spreadCount - 1, Math.max(0, index));
}

function isEditable(node: EventTarget | null): boolean {
  return (
    node instanceof HTMLElement &&
    (node.isContentEditable ||
      node instanceof HTMLInputElement ||
      node instanceof HTMLTextAreaElement ||
      node instanceof HTMLSelectElement)
  );
}

export function Paginator({ children }: { children: ReactNode }) {
  const flowRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // False on the server and on the first client render, so hydration matches
  // and the pre-hydration DOM is unpaginated and fully readable.
  const [paged, setPaged] = useState(false);
  const [geometry, setGeometry] = useState<Geometry>(UNPAGED);
  const [requested, setRequested] = useState(0);

  // Clamped at render time, never in an effect: a recount that shortens the
  // book must not commit even one frame showing a page past the end.
  const spread = Math.min(Math.max(requested, 0), geometry.spreadCount - 1);

  const frame = useRef(0);

  const measure = useCallback(() => {
    const flow = flowRef.current;
    if (!flow) return;

    // Fonts, resize, mutations and image loads all land in the same frame
    // during startup, and readGeometry forces layout.
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      try {
        const next = readGeometry(flow);

        // Overflow columns extend horizontally, so vertical overflow can only
        // mean something monolithic is being clipped — a column flex box, a
        // grid, or a box with overflow/contain set.
        if (
          process.env.NODE_ENV !== "production" &&
          flow.scrollHeight - flow.clientHeight > 1
        ) {
          console.warn(
            "[book] content is overflowing a page vertically and is being " +
              "clipped — something in the flow is monolithic.",
          );
        }

        setGeometry((prev) =>
          prev.spreadCount === next.spreadCount &&
          prev.pageCount === next.pageCount &&
          prev.spreadPitch === next.spreadPitch &&
          prev.columnsPerSpread === next.columnsPerSpread
            ? prev
            : next,
        );

        // Keep the reader's place across a reflow: if the caret is in the book,
        // the page they are on is the page holding it. This is what keeps the
        // record form usable while typing repaginates the content underneath.
        const active = document.activeElement;
        if (
          active instanceof HTMLElement &&
          active !== flow &&
          flow.contains(active)
        ) {
          setRequested(spreadOf(flow, active, next));
        }
      } catch {
        // Falling back to unpaged is always correct; clipping never is.
        setPaged(false);
      }
    });
  }, []);

  // Opt into the paged CSS one commit after hydration, before paint.
  useIsoLayoutEffect(() => {
    setPaged(true);
  }, []);

  useIsoLayoutEffect(() => {
    if (!paged) return;
    const flow = flowRef.current;
    const content = contentRef.current;
    if (!flow || !content) return;

    measure();

    // next/font uses display:swap, so the fallback paints first and the swap
    // reflows every line. `ready` resolves once, for the fonts pending when it
    // was read; `loadingdone` covers later cycles.
    let live = true;
    void document.fonts.ready.then(() => {
      if (live) measure();
    });
    const onFonts = () => measure();
    document.fonts.addEventListener("loadingdone", onFonts);

    const resize = new ResizeObserver(measure);
    resize.observe(flow);

    // Content growing while the container's box does not move: the form
    // revealing "+ New game", a player row appended, the status message
    // arriving. ResizeObserver is blind to all of it.
    const mutate = new MutationObserver(measure);
    mutate.observe(content, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden"],
    });

    // Images settle late and `load` does not bubble — capture phase.
    flow.addEventListener("load", measure, true);

    return () => {
      live = false;
      cancelAnimationFrame(frame.current);
      document.fonts.removeEventListener("loadingdone", onFonts);
      resize.disconnect();
      mutate.disconnect();
      flow.removeEventListener("load", measure, true);
    };
  }, [paged, measure]);

  // `children` is a fresh element on every navigation, which also catches
  // ?game=1 → ?game=2 that usePathname would miss. A new chapter opens at its
  // first page.
  useIsoLayoutEffect(() => {
    setRequested(0);
    if (flowRef.current) flowRef.current.scrollLeft = 0;
    measure();
  }, [children, measure]);

  useIsoLayoutEffect(() => {
    const flow = flowRef.current;
    if (!flow || !paged) return;
    const target = spread * geometry.spreadPitch;
    if (Math.abs(flow.scrollLeft - target) < 1) return;
    // Plain assignment, deliberately: it honours the CSS scroll-behavior, which
    // the reduced-motion block forces to `auto`. scrollTo({behavior:"smooth"})
    // would override the CSS and animate for readers who asked us not to.
    flow.scrollLeft = target;
  }, [spread, geometry.spreadPitch, paged]);

  // Re-align after any scroll we did not initiate: focus scrolling,
  // find-in-page, an anchor, a trackpad swipe.
  useEffect(() => {
    const flow = flowRef.current;
    if (!flow || !paged) return;

    const { spreadPitch, spreadCount } = geometry;
    let timer = 0;
    const settle = () => {
      if (spreadPitch <= 0) return;
      const nearest = Math.min(
        spreadCount - 1,
        Math.max(0, Math.round(flow.scrollLeft / spreadPitch)),
      );
      // React bails out when the value is unchanged, so this needs no guard.
      setRequested(nearest);
      if (Math.abs(flow.scrollLeft - nearest * spreadPitch) > 1) {
        flow.scrollLeft = nearest * spreadPitch;
      }
    };
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, 120);
    };

    flow.addEventListener("scroll", onScroll, { passive: true });
    flow.addEventListener("scrollend", settle);
    return () => {
      flow.removeEventListener("scroll", onScroll);
      flow.removeEventListener("scrollend", settle);
      window.clearTimeout(timer);
    };
  }, [paged, geometry]);

  const turn = useCallback(
    (delta: number) => {
      setRequested(
        Math.min(Math.max(spread + delta, 0), geometry.spreadCount - 1),
      );
    },
    [spread, geometry.spreadCount],
  );

  useEffect(() => {
    if (!paged) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      // Never hijack typing, and never steal arrows from a <select>.
      if (isEditable(event.target)) return;

      switch (event.key) {
        case "ArrowRight":
        case "PageDown":
          turn(1);
          break;
        case "ArrowLeft":
        case "PageUp":
          turn(-1);
          break;
        case "Home":
          setRequested(0);
          break;
        case "End":
          setRequested(geometry.spreadCount - 1);
          break;
        default:
          return;
      }
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paged, turn, geometry.spreadCount]);

  // Off-page content stays in the tab order, so tabbing forward off the recto
  // turns the page — which is what a book does.
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    const flow = flowRef.current;
    if (!flow || !paged) return;
    setRequested(spreadOf(flow, event.target, geometry));
  };

  const { columnsPerSpread, pageCount, spreadCount } = geometry;
  const first = spread * columnsPerSpread + 1;
  const last = Math.min(first + columnsPerSpread - 1, pageCount);
  const folio =
    first === last
      ? `Page ${first} of ${pageCount}`
      : `Pages ${first}–${last} of ${pageCount}`;

  return (
    <>
      <div
        ref={flowRef}
        className="book-flow"
        data-paged={paged ? "" : undefined}
        onFocus={onFocus}
      >
        <div ref={contentRef}>{children}</div>
      </div>

      {paged && spreadCount > 1 && (
        <nav className="book-turn" aria-label="Pages">
          <button
            type="button"
            onClick={() => turn(-1)}
            disabled={spread === 0}
            aria-label="Turn back"
            className="edge-pill on-page flex size-11 items-center justify-center text-lg disabled:opacity-30"
          >
            <span aria-hidden="true">‹</span>
          </button>

          <p
            role="status"
            className="display-face text-sm tabular-nums text-foreground/55"
          >
            {folio}
          </p>

          <button
            type="button"
            onClick={() => turn(1)}
            disabled={spread >= spreadCount - 1}
            aria-label="Turn the page"
            className="edge-pill on-page flex size-11 items-center justify-center text-lg disabled:opacity-30"
          >
            <span aria-hidden="true">›</span>
          </button>
        </nav>
      )}
    </>
  );
}
