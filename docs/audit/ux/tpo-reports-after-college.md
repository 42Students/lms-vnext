# UX route /tpo/reports/after-college

- **Slice:** chat-5, middle third of /tpo, route 83/126; report archetype.
- **Previous weakness:** small report links and actions needed accessible contrast and ≥44px tap regions; long report rows may overflow small screen widths.
- **Changes:** applied accessible link colour and 44px controls, plus migrated the old fixed-width six-column 300-row table to the shared responsive `DataTable`. All six values remain available on phone through labelled cards and the More details disclosure. Original report labels, filter keys, statistics, export, timezone and permissions remain unchanged.
- **States:** `loading.tsx` preserved. `DataTable` now receives explicit `empty={<p role="status">No students match these filters.</p>}` matching pre-existing copy; 300-row preview boundary and full CSV link remain. Browser, WebView and reader evidence pending.
- **Tests:** `tests/unit/chat5-ux-tpo-middle-third.test.ts` — `UX-tpo-reports-after-college-01` and `UX-tpo-reports-after-college-02` source-level accessibility and preservation checks. Not ticked on page list until orchestrator test pass.

**Status:** source authored; runtime validation pending.
