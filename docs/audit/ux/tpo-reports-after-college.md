# UX route /tpo/reports/after-college

- **Slice:** chat-5, middle third of /tpo, route 83/126; report archetype.
- **Previous weakness:** small report links and actions needed accessible contrast and ≥44px tap regions; long report rows may overflow small screen widths.
- **Changes:** applied accessible link colour and 44px controls to this source route without changing existing report labels, filter keys, statistics, calculation, export shape, timezone or permission checks. Original content and loader/empty/partial representations remain authoritative.
- **States:** `loading.tsx` preserved. No direct `DataTable` call; a future shared table must supply explicit legacy-scoped `empty` copy. Manual browser, 320px WebView, keyboard and reader evidence pending.
- **Tests:** `tests/unit/chat5-ux-tpo-middle-third.test.ts` — `UX-tpo-reports-after-college-01` source-level accessibility and preservation checks. Not ticked on page list until orchestrator test pass.

**Status:** source authored; runtime validation pending.
