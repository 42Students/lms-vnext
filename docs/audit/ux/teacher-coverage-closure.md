# Faculty UX coverage closure — chat-3

Generated matrix at start of the pass: 57 total missing UX page mentions, including **28 /teacher** and **2 /teach** routes. Added one route-path-naming, source-contract UX test per route across the entire 36+2 page inventories. Each asserts actual scope, route redirect, heading, denied/empty state or feedback evidence rather than only file existence.

The orchestrator's regenerated `docs/audit/ux/COVERAGE-MATRIX.md` (checked on `main`) now shows **noTest=0, noNote=0, noLoading=0 and noError=0 globally**. Static page source tests still require Vitest and browser execution before the page inventories can be accepted. All 38 boxes intentionally remain unchecked in the inventory.

Scroll/motion: the faculty card's two vertical lists, attendance monthly table and roster desktop table use ScrollCue; the discussion thread keeps its existing imperative scroll restoration while showing conditional gradient edge fades, with `matchMedia("(prefers-reduced-motion: reduce)")` for smooth-scroll fallback. Global CSS owns the shared motion tokens.
