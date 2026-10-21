# U022 — Mentor Contacts legacy dynamic-tab redirect

Legacy FE: `docs/legacy-source/frontend/src/pages/mentor/contacts/[contactsTab].js` (alias `[contactsTab].js`, complete 13 lines). Legacy backend/API/service/entity/migration closure: **NONE** — no imports, API or DB read; pure server redirect. vNext: `src/app/(authenticated)/mentor/contacts/[[...contactsTab]]/page.tsx` (alias `[[...contactsTab]]/page.tsx`, complete 6 lines). Secondary vNext boundary read: `src/app/(authenticated)/mentor/layout.tsx` (alias `mentor/layout.tsx`), `src/app/(authenticated)/mentor/projects/page.tsx` (alias `mentor/projects/page.tsx`). Route comparison only; no browser observation claimed. There is intentionally no UI or data model for this redirect.

| ID | Facet | Legacy behaviour (file:line) | vNext behaviour (file:line, or NONE) | Verdict | Severity | Fix | Effort |
| --- | --- | --- | --- | --- | --- | --- | --- |
| G2-7-022-001 | F01 | [contactsTab].js:1-7 getServerSideProps redirects every dynamic contactsTab value to /mentor/projects | [[...contactsTab]]/page.tsx:1-6 redirect /mentor/projects | MATCH | P3 | Keep same destination for legacy bookmarks | S |
| G2-7-022-002 | F01 | [contactsTab].js:1-7 one-segment dynamic route only | [[...contactsTab]]/page.tsx:3-6 optional catchall also matches /mentor/contacts and multiple trailing segments | EXTRA | P3 | Document broader backward-compatible route coverage | S |
| G2-7-022-003 | F01 | [contactsTab].js:3-6 permanent:false temporary redirect, effectively 307 in Next.js | [[...contactsTab]]/page.tsx:4-5 Next.js redirect() temporary navigation | MATCH | P3 | Keep temporary rather than permanent 308 | S |
| G2-7-022-004 | F01 | [contactsTab].js:1-7 server redirects before any local JSX | mentor/layout.tsx:5-22 role check precedes catchall redirect | UNKNOWN | P2 | Verify unauthed and nonmentor status/redirect sequence live | M |
| G2-7-022-005 | F02 | [contactsTab].js:1-12 component returns null, no rendered layout | [[...contactsTab]]/page.tsx:4-6 no rendered layout, redirect only | MATCH | P3 | No independent contacts layout to clone | S |
| G2-7-022-006 | F03 | [contactsTab].js:10-12 no visible buttons, icons, badges, counters or tooltips | [[...contactsTab]]/page.tsx:4-6 no visible elements | MATCH | P3 | No controls on compatibility route | S |
| G2-7-022-007 | F04 | [contactsTab].js:1-12 no data request, field display, formatting or placeholders | [[...contactsTab]]/page.tsx:4-6 no data read beyond routing | MATCH | P3 | N/A no data display on redirect | S |
| G2-7-022-008 | F05 | [contactsTab].js:1-12 no list, search, sorting, paging, row actions or bulk selection | [[...contactsTab]]/page.tsx:4-6 redirect without list | MATCH | P3 | N/A contacts directory intentionally not rendered | S |
| G2-7-022-009 | F06 | [contactsTab].js:1-12 no form, input, validation defaults or submit/cancel flow | [[...contactsTab]]/page.tsx:4-6 no form | MATCH | P3 | N/A forms omitted in both redirects | S |
| G2-7-022-010 | F07 | [contactsTab].js:1-7 no page errors, form validation or errors surfaced by this route | [[...contactsTab]]/page.tsx:4-6 no local error message | MATCH | P3 | N/A validate only routing and downstream destination | S |
| G2-7-022-011 | F08 | [contactsTab].js:1-12 no success, info, confirmation or toast messages | [[...contactsTab]]/page.tsx:4-6 no toast | MATCH | P3 | N/A no messages emitted | S |
| G2-7-022-012 | F09 | [contactsTab].js:1-12 no overlay, drawer, dialog or menu | [[...contactsTab]]/page.tsx:4-6 no overlay | MATCH | P3 | N/A pure redirect | S |
| G2-7-022-013 | F10 | [contactsTab].js:1-7 server-side redirect, zero API calls or DB mutations | [[...contactsTab]]/page.tsx:4-5 redirect, no writes | MATCH | P3 | N/A preserve side-effect-free compatibility route | S |
| G2-7-022-014 | F10 | [contactsTab].js:4 fixed destination ignores original contactsTab | [[...contactsTab]]/page.tsx:5 fixed destination ignores array param | MATCH | P3 | Do not append obsolete tab to new Projects URL | S |
| G2-7-022-015 | F11 | [contactsTab].js:1-7 redirect handler has no explicit role/tenant guard | mentor/layout.tsx:10-20 requires MENTOR before redirect | EXTRA | P2 | Keep defense-in-depth; verify historical user experience for wrong role | S |
| G2-7-022-016 | F11 | [contactsTab].js:1-7 no local module feature check | [[...contactsTab]]/page.tsx:4-5 no feature check; mentor/projects/page.tsx:49-57 checks project access | MATCH | P3 | Let Projects destination enforce module availability | S |
| G2-7-022-017 | F12 | [contactsTab].js:3-6 redirect unconditional for every string tab value | [[...contactsTab]]/page.tsx:4-5 unconditional redirect | MATCH | P3 | No tab-name allowlist required | S |
| G2-7-022-018 | F13 | [contactsTab].js:1-12 no loading, offline, empty or retry state before redirect | [[...contactsTab]]/page.tsx:4-6 no intermediate state | MATCH | P3 | Downstream projects page owns failures and retry | S |
| G2-7-022-019 | F13 | [contactsTab].js:1-7 SSR temporary redirect, not client mount spinner | [[...contactsTab]]/page.tsx:4-5 server component redirect | MATCH | P3 | Keep immediate server navigation | S |
| G2-7-022-020 | F14 | [contactsTab].js:1-12 no CSV/XLSX/PDF, imports or upload | [[...contactsTab]]/page.tsx:4-6 no files | MATCH | P3 | N/A redirect contains no file handling | S |
| G2-7-022-021 | F15 | [contactsTab].js:1-12 no mail, notification or recipient changes | [[...contactsTab]]/page.tsx:4-6 no notification call | MATCH | P3 | N/A no messaging | S |
| G2-7-022-022 | F16 | [contactsTab].js:1-12 returns null, so no responsive layout at any width | [[...contactsTab]]/page.tsx:4-6 redirects before layout content | MATCH | P3 | No breakpoint work on redirect itself | S |
| G2-7-022-023 | F17 | [contactsTab].js:10-12 no interactive element or focus management | [[...contactsTab]]/page.tsx:4-6 no interactive elements | MATCH | P3 | No focusable controls, confirm focus restored at target | S |
| G2-7-022-024 | F18 | [contactsTab].js:4 only user-facing navigational text is path /mentor/projects; no copy | [[...contactsTab]]/page.tsx:5 same path, no labels | MATCH | P3 | N/A no wording difference | S |
| G2-7-022-025 | F19 | [contactsTab].js:1-7 server redirect avoids data fetching, no caching/pagination logic | [[...contactsTab]]/page.tsx:4-5 server redirect avoids query/list | MATCH | P3 | Keep no list fetch and no client waterfall | S |
| G2-7-022-026 | F20 | [contactsTab].js:3-6 all tab values treated identically, no errors for weird strings | [[...contactsTab]]/page.tsx:4-5 ignores all optional catch-all values | MATCH | P3 | Keep route target stable for special chars and invalid tabs | S |
| G2-7-022-027 | F20 | [contactsTab].js:1-7 route does not preserve query/hash explicitly | [[...contactsTab]]/page.tsx:4-5 literal destination also does not encode query | MATCH | P3 | Verify browser fragment preservation expectations live | S |
| G2-7-022-028 | F21 | [contactsTab].js:1-12 no jobs, queues, webhooks or third-party services | [[...contactsTab]]/page.tsx:4-6 no integration | MATCH | P3 | N/A no integrations | S |
| G2-7-022-029 | F22 | [contactsTab].js:1-12 no entity, table, validation schema, migrations or DB reads | [[...contactsTab]]/page.tsx:4-6 no schema use | MATCH | P3 | N/A no data model for compatibility redirect | S |
| G2-7-022-030 | F23 | [contactsTab].js:1-7 accepts exactly one dynamic tab path | [[...contactsTab]]/page.tsx:3-6 optional catch-all supports zero or many segments | EXTRA | P3 | Keep wider legacy bookmark coverage as intentional enhancement | S |
| G2-7-022-031 | F23 | [contactsTab].js:10-12 does not render old Contacts content by design | [[...contactsTab]]/page.tsx:4-6 also no Contacts content | MATCH | P3 | Do not reintroduce obsolete contacts UI | S |

## Unit summary

Rows **31**, facets **23/23**. Verdicts {"MATCH":27,"EXTRA":3,"UNKNOWN":1}. Severities {"P3":29,"P2":2}. Effort {"S":30,"M":1}.

Top three points: (1) **MATCH** both legacy and vNext issue a temporary server redirect straight to /mentor/projects without Contacts UI. (2) **EXTRA** vNext optional catch-all supports /mentor/contacts, one tab or many nested tab paths, whereas legacy only has a one-segment dynamic route in this unit. (3) **UNKNOWN** compare unauthenticated/nonmentor redirect precedence live: vNext mentor layout redirects to /dashboard before compatibility route, while this legacy page itself unconditionally redirects to Projects. No P0/P1 evidence from this redirect source. N/A facets explicitly documented, not skipped.
