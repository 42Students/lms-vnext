# Scroll and motion pass (owner decisions, applies to every surface)

The master list of surfaces is `docs/audit/ui-surfaces/UI-SURFACES.md` (machine copy `ui-surfaces.json`). Work through YOUR area's pages, overlays and widgets from that list.

## Scrolls
Owner decision: scrollbars are INVISIBLE everywhere, horizontal and vertical (global CSS in `src/app/globals.css` already hides them: `scrollbar-width: none` and `::-webkit-scrollbar { display: none }`). Scrolling must keep working with wheel, touch, keyboard and focus.
For every scroll container you own (`overflow-x-auto`, `overflow-y-auto`, `overflow-auto`, `overflow-scroll`, tables, tab lists, chip rows, code blocks, modal bodies, drawers, chat threads, long lists):
1. Because the bar is hidden, add a clear cue that more content exists: an edge fade or gradient mask on the scrolling edge, partial peek of the next item, or a "more" affordance. Never rely on the scrollbar.
2. Horizontal scrollers: `overscroll-x-contain`, snap where it helps (`snap-x`), keyboard reachable (focusable region with an accessible name when it scrolls), first column sticky for wide tables where a row label is needed.
3. Vertical scrollers inside overlays: `overscroll-contain`, `min-h-0` on flex children, body scroll locked behind the overlay, header and footer actions stay visible, safe-area padding, keyboard-open geometry (visualViewport) respected.
4. No nested double scrollers on phones, no horizontal page scroll at 320px, no layout shift when content loads.
5. Anything that used a visible scrollbar as the only affordance (for example an overflowing table with no hint) is a finding.

## Motion and transitions
Tokens and defaults live in `src/app/globals.css` (`--lms-motion-fast` 150ms, `--lms-motion-base` 200ms, `--lms-motion-ease`; default transitions on interactive controls; dialog/backdrop/details animations; `prefers-reduced-motion` honoured). Rules:
1. Use the tokens; no one-off durations or easings. Allowed range 120 to 240ms for UI, nothing longer than 300ms except skeleton shimmer.
2. Animate only `opacity`, `transform`, colour properties. Never animate width/height/top/left (layout shift).
3. Overlays: dialogs fade and rise, drawers and bottom sheets slide from their edge, toasts slide and fade, tabs underline moves, disclosures expand without jumping. Exit transitions where cheap; never block interaction waiting for an animation.
4. Skeletons shimmer gently and stop under reduced motion; loading to content swap does not jump.
5. Respect `prefers-reduced-motion` in every custom animation (the global rule covers CSS; JS-driven animation must check `matchMedia`).
6. Focus rings and hover/active states use the same fast transition; no flash on first paint.

## Deliverables per lane
- Notes in `docs/audit/ux/scroll-motion-<your-area>.md` listing each container/overlay changed and the cue added.
- Tests `UX-<area>-scroll-motion-NN` asserting the cues exist in source (mask or fade class, overscroll-contain, token usage, no hard-coded durations) for the surfaces you changed.
- Push to your own branch, TypeScript strict-clean, legacy wording exact, never weaken tests.
