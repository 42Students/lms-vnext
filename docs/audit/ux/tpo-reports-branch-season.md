# UX route /tpo/reports/branch-season

- **Slice:** chat-5, middle third of /tpo, route 84/126; report archetype.
- **Previous weakness:** small report links and actions needed accessible contrast and ≥44px tap regions; long report rows may overflow small screen widths.
- **Changes:** applied accessible link colour and 44px controls, and migrated the former fixed 66rem eight-column table to the approved shared responsive `DataTable`. All eight legacy columns, figures, denominators, unavailable markers, CSV export, season filters and permissions are preserved. Primary branch identity and up to three metrics appear immediately on phone; remaining values stay accessible via More details.
- **States:** `loading.tsx` preserved; `DataTable` now receives an explicit `empty` element with existing verbatim absence copy, while the page retains its no-season and no-registration notices. Manual browser, 320px WebView, keyboard and reader evidence pending.
- **Tests:** `tests/unit/chat5-ux-tpo-middle-third.test.ts` — `UX-tpo-reports-branch-season-01` and `UX-tpo-reports-branch-season-02` source-level accessibility and preservation checks. Not ticked on page list until orchestrator test pass.

**Status:** source authored; runtime validation pending.
