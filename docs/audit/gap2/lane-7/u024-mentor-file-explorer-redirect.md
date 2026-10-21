# U024 — Mentor fileExplorer compatibility redirect

Legacy file: `docs/legacy-source/frontend/src/pages/mentor/fileExplorer.js` (alias fileExplorer.js), all 13 lines read. Backend/API/entity/migrations: NONE because the redirect has no imports or backend requests. vNext file: `src/app/(authenticated)/mentor/fileExplorer/page.tsx` (alias fileExplorer/page.tsx), all seven lines read. Destination and auth closure: `src/app/(authenticated)/mentor/projects/page.tsx` (mentor/projects/page.tsx), `src/app/(authenticated)/mentor/layout.tsx` (mentor/layout.tsx). Evidence is file:line; no browser claim.

| ID | Facet | Legacy behaviour (file:line) | vNext behaviour (file:line, or NONE) | Verdict | Severity | Fix | Effort |
| --- | --- | --- | --- | --- | --- | --- | --- |
| G2-7-024-001 | F01 | fileExplorer.js:1-7 temporary redirect to /mentor/projects | fileExplorer/page.tsx:1-6 same temporary redirect | MATCH | P3 | Keep destination and HTTP semantics | S |
| G2-7-024-002 | F01 | fileExplorer.js:3-6 permanent:false server redirect | fileExplorer/page.tsx:5 Next redirect call | MATCH | P3 | Retain temporary redirect | S |
| G2-7-024-003 | F02 | fileExplorer.js:10-12 returns null | fileExplorer/page.tsx:4-6 no page layout | MATCH | P3 | N/A no content layout | S |
| G2-7-024-004 | F03 | fileExplorer.js:10-12 no buttons, labels or icons | fileExplorer/page.tsx:4-6 no visible elements | MATCH | P3 | N/A no controls | S |
| G2-7-024-005 | F04 | fileExplorer.js:1-12 no file metadata display | fileExplorer/page.tsx:4-6 no data reads | MATCH | P3 | N/A no data shown | S |
| G2-7-024-006 | F05 | fileExplorer.js:1-12 no list, filters, sorting or paging | fileExplorer/page.tsx:4-6 no lists | MATCH | P3 | N/A no tables | S |
| G2-7-024-007 | F06 | fileExplorer.js:1-12 no forms or upload fields | fileExplorer/page.tsx:4-6 no form | MATCH | P3 | N/A no form | S |
| G2-7-024-008 | F07 | fileExplorer.js:1-12 no validation or error copy | fileExplorer/page.tsx:4-6 no validation | MATCH | P3 | N/A redirect | S |
| G2-7-024-009 | F08 | fileExplorer.js:1-12 no success, info or toast | fileExplorer/page.tsx:4-6 no messages | MATCH | P3 | N/A no feedback | S |
| G2-7-024-010 | F09 | fileExplorer.js:1-12 no menus, modals or drawers | fileExplorer/page.tsx:4-6 no overlay | MATCH | P3 | N/A no dialogs | S |
| G2-7-024-011 | F10 | fileExplorer.js:1-7 SSR redirect without API or DB writes | fileExplorer/page.tsx:4-6 redirect only | MATCH | P3 | Keep side-effect free | S |
| G2-7-024-012 | F11 | fileExplorer.js:1-7 no local mentor role check | mentor/layout.tsx:10-20 checks mentor before redirect | UNKNOWN | P2 | Verify outer legacy guard and redirect priority live | S |
| G2-7-024-013 | F11 | fileExplorer.js:1-7 no module flag check | mentor/projects/page.tsx:49-57 downstream module check | MATCH | P3 | Leave feature check at destination | S |
| G2-7-024-014 | F12 | fileExplorer.js:1-7 no business rules except destination | fileExplorer/page.tsx:4-5 fixed destination | MATCH | P3 | N/A no formulas or statuses | S |
| G2-7-024-015 | F13 | fileExplorer.js:10-12 no loading or empty state | fileExplorer/page.tsx:4-6 immediate redirect | MATCH | P3 | Avoid intermediate spinner | S |
| G2-7-024-016 | F14 | fileExplorer.js:1-12 no import/export/download/upload | fileExplorer/page.tsx:4-6 no file action | MATCH | P3 | N/A no file handling | S |
| G2-7-024-017 | F15 | fileExplorer.js:1-12 no notifications/emails | fileExplorer/page.tsx:4-6 no notify call | MATCH | P3 | N/A no messages | S |
| G2-7-024-018 | F16 | fileExplorer.js:10-12 no responsive page content | fileExplorer/page.tsx:4-6 no UI at phone/tablet | MATCH | P3 | N/A no breakpoints | S |
| G2-7-024-019 | F17 | fileExplorer.js:10-12 no keyboard or focus targets | fileExplorer/page.tsx:4-6 no focusable nodes | MATCH | P3 | Check target heading focus live | S |
| G2-7-024-020 | F18 | fileExplorer.js:4 route-only text /mentor/projects | fileExplorer/page.tsx:5 same target and no visible copy | MATCH | P3 | N/A no wording | S |
| G2-7-024-021 | F19 | fileExplorer.js:1-7 redirect without list fetch/cache | fileExplorer/page.tsx:4-6 no query | MATCH | P3 | No file list query needed | S |
| G2-7-024-022 | F20 | fileExplorer.js:3-6 fixed URL ignores old search state | fileExplorer/page.tsx:5 constant target | MATCH | P3 | Do not forward obsolete query | S |
| G2-7-024-023 | F21 | fileExplorer.js:1-12 no third-party integration or job | fileExplorer/page.tsx:4-6 no integration | MATCH | P3 | N/A no processing | S |
| G2-7-024-024 | F22 | fileExplorer.js:1-12 no entity/DTO/schema read | fileExplorer/page.tsx:4-6 no DB table | MATCH | P3 | N/A no data model | S |
| G2-7-024-025 | F23 | fileExplorer.js:10-12 old explorer UI intentionally absent | fileExplorer/page.tsx:3-6 compatibility redirect only | MATCH | P3 | Keep no obsolete explorer UI | S |
| G2-7-024-026 | F23 | fileExplorer.js:1-7 no role check in file | mentor/layout.tsx:10-20 shared role check added | EXTRA | P2 | Keep stronger access check; verify legacy outer auth | S |

## Unit summary

Rows 26; facets 23/23. Verdicts: MATCH 24, UNKNOWN 1, EXTRA 1. Severities: P2 2, P3 24.

Three key findings: same temporary redirect and destination, no explorer UI/data/API on either side; shared mentor layout adds access check; test unauthenticated and nonmentor redirect precedence against legacy auth wrapper. N/A facets evidenced individually, no P0/P1.
