# U003 — Recruiter index redirect (gap audit v2)

## Source closure
- Legacy FE: docs/legacy-source/frontend/src/pages/recruiter/index.js:1-9 complete. No imports or backend controller/service/validator/entity/email/template called by the redirect itself. Legacy landing target /recruiter/home covered in U002.
- vNext: src/app/(authenticated)/recruiter/page.tsx:1-4 complete. Canonical destination src/app/(authenticated)/hr/home/page.tsx:42-53 handles access; see U002 for closure and deep data schema.
- Scope: only the entry redirect; unknown auth/host handling must be verified live; no code or tests run.

## Facet table
| ID | Facet | Legacy behaviour (file:line) | vNext behaviour (file:line) | Verdict | Severity | Fix | Effort |
| --- | --- | --- | --- | --- | --- | --- | --- |
| G2-13-003-001 | F01 | Entry path /recruiter redirects temporary to /recruiter/home (`docs/legacy-source/frontend/src/pages/recruiter/index.js:2-4`) | SSR getServerSideProps redirects to /hr/home (`src/app/(authenticated)/recruiter/page.tsx:1-3`) | GAP | P2 | Restore legacy target /recruiter/home or approve visible URL change. | S |
| G2-13-003-002 | F01 | No explicit query-string forwarding (`docs/legacy-source/frontend/src/pages/recruiter/index.js:2-4`) | Hardcoded redirect target also drops query (`src/app/(authenticated)/recruiter/page.tsx:1-3`) | MATCH | P3 | None; both ignore query. | S |
| G2-13-003-003 | F02 | Component returns null; no rendered layout (`docs/legacy-source/frontend/src/pages/recruiter/index.js:6-8`) | redirect() renders no JSX (`src/app/(authenticated)/recruiter/page.tsx:1-3`) | MATCH | P3 | No layout required. | S |
| G2-13-003-004 | F03 | No visible elements, controls, badges or icons (`docs/legacy-source/frontend/src/pages/recruiter/index.js:6-8`) | No visible elements (`src/app/(authenticated)/recruiter/page.tsx:1-3`) | MATCH | P3 | No change. | S |
| G2-13-003-005 | F04 | No data projection or field formatting (`docs/legacy-source/frontend/src/pages/recruiter/index.js:6-8`) | No data projection (`src/app/(authenticated)/recruiter/page.tsx:1-3`) | MATCH | P3 | No change. | S |
| G2-13-003-006 | F05 | No list, table, sort, filters, pagination (`docs/legacy-source/frontend/src/pages/recruiter/index.js:6-8`) | No list, table, sort, filters, pagination (`src/app/(authenticated)/recruiter/page.tsx:1-3`) | MATCH | P3 | No change. | S |
| G2-13-003-007 | F06 | No form fields/validation defaults (`docs/legacy-source/frontend/src/pages/recruiter/index.js:6-8`) | No form fields/validation defaults (`src/app/(authenticated)/recruiter/page.tsx:1-3`) | MATCH | P3 | No change. | S |
| G2-13-003-008 | F07 | No local error message or validation (`docs/legacy-source/frontend/src/pages/recruiter/index.js:6-8`) | No local error message or validation (`src/app/(authenticated)/recruiter/page.tsx:1-3`) | MATCH | P3 | No change. | S |
| G2-13-003-009 | F08 | No toast, confirmation or inline notification (`docs/legacy-source/frontend/src/pages/recruiter/index.js:6-8`) | No toast or confirmation (`src/app/(authenticated)/recruiter/page.tsx:1-3`) | MATCH | P3 | No change. | S |
| G2-13-003-010 | F09 | No modal, menu or drawer (`docs/legacy-source/frontend/src/pages/recruiter/index.js:6-8`) | No modal, menu or drawer (`src/app/(authenticated)/recruiter/page.tsx:1-3`) | MATCH | P3 | No change. | S |
| G2-13-003-011 | F10 | Returns Pages Router SSR redirect object (nonpermanent) (`docs/legacy-source/frontend/src/pages/recruiter/index.js:2-8`) | Calls App Router redirect() which emits temporary redirect (`src/app/(authenticated)/recruiter/page.tsx:1-3`) | MATCH | P3 | Verify actual redirect HTTP status and history in browser. | S |
| G2-13-003-012 | F10 | No GET/POST to API, DB write or background side-effect (`docs/legacy-source/frontend/src/pages/recruiter/index.js:2-8`) | No API action before redirect (`src/app/(authenticated)/recruiter/page.tsx:1-3`) | MATCH | P3 | No change. | S |
| G2-13-003-013 | F11 | No explicit role/tenant check in page source (`docs/legacy-source/frontend/src/pages/recruiter/index.js:2-8`) | Protected route's auth gate outside page source (`src/app/(authenticated)/recruiter/page.tsx:1-3`) | UNKNOWN | P2 | Inspect original role fence and vNext authenticated layout and compare 401/403/redirect live. | S |
| G2-13-003-014 | F12 | Unconditional redirect; no business state (`docs/legacy-source/frontend/src/pages/recruiter/index.js:6-8`) | Unconditional redirect; no business state (`src/app/(authenticated)/recruiter/page.tsx:1-3`) | MATCH | P3 | No change. | S |
| G2-13-003-015 | F13 | No loading/empty/error/offline display before redirect (`docs/legacy-source/frontend/src/pages/recruiter/index.js:6-8`) | No local loading/empty/error/offline display (`src/app/(authenticated)/recruiter/page.tsx:1-3`) | MATCH | P3 | Confirm destination boundary independently in U002. | S |
| G2-13-003-016 | F14 | No export/import/download/upload (`docs/legacy-source/frontend/src/pages/recruiter/index.js:6-8`) | No export/import/download/upload (`src/app/(authenticated)/recruiter/page.tsx:1-3`) | MATCH | P3 | No change. | S |
| G2-13-003-017 | F15 | No email, notification, template or recipient (`docs/legacy-source/frontend/src/pages/recruiter/index.js:6-8`) | No email or notification (`src/app/(authenticated)/recruiter/page.tsx:1-3`) | MATCH | P3 | No change. | S |
| G2-13-003-018 | F16 | No responsive behavior since there is no UI (`docs/legacy-source/frontend/src/pages/recruiter/index.js:6-8`) | No responsive behavior before redirect (`src/app/(authenticated)/recruiter/page.tsx:1-3`) | MATCH | P3 | No change. | S |
| G2-13-003-019 | F17 | No focusable element; navigation is automatic (`docs/legacy-source/frontend/src/pages/recruiter/index.js:6-8`) | No focusable element; navigation is automatic (`src/app/(authenticated)/recruiter/page.tsx:1-3`) | MATCH | P3 | Inspect screen reader announcement on landing destination. | S |
| G2-13-003-020 | F18 | Legacy destination URL literal /recruiter/home (`docs/legacy-source/frontend/src/pages/recruiter/index.js:1-8`) | New destination URL literal /hr/home (`src/app/(authenticated)/recruiter/page.tsx:1-3`) | GAP | P2 | Match literal old path; avoid URL drift in user-visible links. | S |
| G2-13-003-021 | F18 | No user-visible label, copy, placeholder or message (`docs/legacy-source/frontend/src/pages/recruiter/index.js:1-8`) | No user-visible label, copy, placeholder or message (`src/app/(authenticated)/recruiter/page.tsx:1-3`) | MATCH | P3 | No wording change. | S |
| G2-13-003-022 | F19 | One immediate server response; no data loading or cap (`docs/legacy-source/frontend/src/pages/recruiter/index.js:6-8`) | One immediate RSC redirect; no data loading or cap (`src/app/(authenticated)/recruiter/page.tsx:1-3`) | MATCH | P3 | Verify 307 cache policy live. | S |
| G2-13-003-023 | F20 | Malformed/duplicate query args ignored by hardcoded destination (`docs/legacy-source/frontend/src/pages/recruiter/index.js:6-8`) | Malformed/duplicate query args ignored (`src/app/(authenticated)/recruiter/page.tsx:1-3`) | MATCH | P3 | No change. | S |
| G2-13-003-024 | F21 | No job/queue/webhook/integration call (`docs/legacy-source/frontend/src/pages/recruiter/index.js:6-8`) | No job/queue/webhook/integration call (`src/app/(authenticated)/recruiter/page.tsx:1-3`) | MATCH | P3 | No change. | S |
| G2-13-003-025 | F22 | No data model/entity, migration or index (`docs/legacy-source/frontend/src/pages/recruiter/index.js:6-8`) | No data model/entity, migration or index (`src/app/(authenticated)/recruiter/page.tsx:1-3`) | MATCH | P3 | N/A. | S |
| G2-13-003-026 | F23 | Legacy serves no page content; only redirect (`docs/legacy-source/frontend/src/pages/recruiter/index.js:6-8`) | No content but introduces canonical HR URL namespace (`src/app/(authenticated)/recruiter/page.tsx:1-3`) | EXTRA | P3 | Document canonical namespace and ensure legacy visible path remains supported. | S |

## Unit summary
- Rows: 26; verdicts: GAP 2, MATCH 22, UNKNOWN 1, EXTRA 1; severities: P2 3, P3 23.
- Most important gap: visible redirect target differs (/recruiter/home vs /hr/home).
- Second: access gates live outside both redirect source units; verify recruiter/unauthorized/anonymous denial live before calling parity.
- Third: confirm HTTP status, cache, browser history on original Pages redirect vs Next App Router redirect.
- Live checks: direct /recruiter, missing/duplicate college query, expired recruiter, nonrecruiter, signed-out; verify Location and responsive/reader transition.
