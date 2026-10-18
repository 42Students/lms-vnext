# UX rollout independent cross-audit — /admin second third (chat-9)

**Date:** 2026-10-18  
**Auditor:** chat-9; **author of audited slice:** chat-6  
**Source of truth:** signed-off `docs/design-system/UX-PLAYBOOK.md`, 21-item `UX-AUDIT-RUBRIC.md`, 10 excellence criteria, `pages-admin.md` entries 38–74, original `docs/audit/ux/admin-*.md` notes, and `docs/audit/legacy-copy-A.md` / `legacy-copy-B.md`.  
**Scope:** exactly **37 routes**; the shared components they render were source-reviewed where implicated. Changes retain existing labels, statuses, filters, permission checks, tenant enforcement and actions.

## Result at source level

**8 BLOCKER, 16 MAJOR, 2 MINOR, 0 NIT findings** (total 26). All **24 BLOCKER/MAJOR findings have code changes committed** on `chatgpt/chat-9-b`. The two MINOR observations remain open. This is **not** runtime acceptance: Vitest, typecheck, lint, UX guard, device, keyboard and screen-reader results were not executed in this GitHub-connector environment. Do not approve screen/AT states based on regex alone.

## Finding ledger

Evidence lines identify the corrected source location after this audit. Compare with the branch's main parent for the original behavior; links and call sites were not invented.

| Page | Finding | Severity | Evidence file:line | Failure and required correction | Source disposition |
|---|---|---|---|---|---|
| `/admin` #38 | AS9-38-M1 | **MAJOR** | `src/app/(authenticated)/admin/inbound-mail/page.tsx:23-27` | Unavailable inbox had no recovery and raw small filter controls → **Preserve unavailable-storage warning; add Retry and Input/Select/Button; 44px page selectors** | FIXED in code |
| `/admin` #39 | AS9-39-B1 | **BLOCKER** | `src/components/admin/lecture-hall-manager.tsx:192-232` | Availability/Edit/Archive actions were hidden on phones by DataTable defaults → **Name primary; actions always visible on phone; fix 40px/low-contrast link** | FIXED in code |
| `/admin` #39 | AS9-39-M2 | **MAJOR** | `src/components/admin/lecture-hall-manager.tsx:106-176` | Uncaught network failures could discard user feedback while attempting hall updates → **Catch failed requests, retain editing draft, show error, block dialog dismissal during save** | FIXED in code |
| `/admin` #42 | AS9-42-B1 | **BLOCKER** | `src/components/courses/super-admin-content-directory-page.tsx:100-123` | Raw external links opened new windows and had 40px/low-contrast controls → **Use vetted ThirdPartyLink with copyable WebView fallback, deep-teal links and Pagination** | FIXED in code |
| `/admin` #44 | AS9-44-B1 | **BLOCKER** | `src/app/(authenticated)/admin/organizations/page.tsx:57-69,121-123` | Separate mobile cards plus desktop DataTable duplicated interactive OrganizationActions trees → **Render one shared DataTable with primary Name and always-visible mobile actions** | FIXED in code |
| `/admin` #45 | AS9-45-B1 | **BLOCKER** | `src/app/(authenticated)/admin/people/page.tsx:69,169-175` | Membership lifecycle actions were relegated to hidden mobile table detail → **Set mobilePriority action and shared Pagination with URL state** | FIXED in code |
| `/admin` #45 | AS9-45-M2 | **MAJOR** | `src/app/(authenticated)/admin/people/page.tsx:93,145-155` | Visible HR filter option was silently discarded by the server-side allowlist → **Include HR in accepted role filter while preserving label** | FIXED in code |
| `/admin` #45 | AS9-45-M3 | **MAJOR** | `src/app/(authenticated)/admin/people/page.tsx:87-98` | Duplicate GET query keys could supply arrays to .trim() and throw → **Normalize string|string[] searchParams before parsing** | FIXED in code |
| `/admin` #46 | AS9-46-M1 | **MAJOR** | `src/app/(authenticated)/admin/people/directory/page.tsx:58-75,101` | Unstyled small directory filter fields and Prev/Next controls lacked shared input focus/pagination → **Use Input/Select/Button/Pagination and ≥44px related links** | FIXED in code |
| `/admin` #48 | AS9-48-M1 | **MAJOR** | `src/app/(authenticated)/admin/people/directory/[membershipId]/audit/page.tsx:14` | Membership back link lacked a 44px focusable hit target → **Make the existing back link 44px high with visible focus** | FIXED in code |
| `/admin` #49 | AS9-49-M1 | **MAJOR** | `src/app/(authenticated)/admin/people/unassigned/page.tsx:17` | No-scope recovery link lacked a 44px hit target → **Keep existing message; give back link 44px** | FIXED in code |
| `/admin` #51 | AS9-51-B1 | **BLOCKER** | `src/app/(authenticated)/admin/placements/analytics/page.tsx:26-30` | No selected college reached a service requiring an exact college and could fail the whole page → **Render honest college selection EmptyState before scoped queries** | FIXED in code |
| `/admin` #51 | AS9-51-M2 | **MAJOR** | `src/app/(authenticated)/admin/placements/analytics/page.tsx:63-83` | Report filters used bare inputs and selected recovery link was undersized → **Shared Input/Select/Button with responsive sizing, accessible Clear all** | FIXED in code |
| `/admin` #54 | AS9-54-M1 | **MAJOR** | `src/components/placements/placement-calendar-workspace.tsx:801-1030` | Company chips and calendar event links were 32–36px with insufficient focus outline → **44px min targets and deep-teal 2px visible outline** | FIXED in code |
| `/admin` #61 | AS9-61-B1 | **BLOCKER** | `src/components/placements/placement-drive-workspace.tsx:409-414` | Employer portal linked to external URL using target=_blank, poor native-app fallback → **Use ThirdPartyLink HTTPS validation and copy fallback, retain Open employer portal** | FIXED in code |
| `/admin` #61 | AS9-61-M1 | **MAJOR** | `src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:15-18` | No selected college silently redirected out of the requested drive → **Display exact-scope PageHeader and recovery EmptyState** | FIXED in code |
| `/admin` #61 | AS9-61-M2 | **MAJOR** | `src/components/placements/super-admin-drive-tabs.tsx:15-23` | Drive navigation tabs were 40px and active/breadcrumb text had inadequate contrast → **44px controls and deep-teal active/link text** | FIXED in code |
| `/admin` #62 | AS9-62-M1 | **MAJOR** | `src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:26-29` | Applications route silently redirected when missing college scope → **Provide recoverable chosen-college state** | FIXED in code |
| `/admin` #62 | AS9-62-M2 | **MAJOR** | `src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:39-81,119` | Mobile applicant filters and pagination lacked shared control focus/44px contracts → **Input/Select/Button and Pagination; preserve stage, scope and query parameters** | FIXED in code |
| `/admin` #63 | AS9-63-B1 | **BLOCKER** | `src/components/placements/college-interview-appointments.tsx:92-124` | Seven-column candidate interview table required horizontal phone scrolling to reach editing and outcome actions → **Use single shared DataTable, candidate primary, actions always visible, remaining fields disclosed** | FIXED in code |
| `/admin` #63 | AS9-63-M1 | **MAJOR** | `src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:25-31,77` | Schedule route silently redirected and appointment editor had native 14px fields → **Scope EmptyState, shared Select/Button/Pagination; shared Input/Select in editor** | FIXED in code |
| `/admin` #64 | AS9-64-B1 | **BLOCKER** | `src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:42-43` | Assessment URL used unvalidated href with target=_blank → **Render ThirdPartyLink with HTTPS credential rejection and copyable fallback** | FIXED in code |
| `/admin` #67 | AS9-67-M1 | **MAJOR** | `src/app/(authenticated)/admin/placements/new/page.tsx:11-14` | Drive creation silently redirected with no college, hiding the reason → **Show selected-college PageHeader and scope recovery before authorized form** | FIXED in code |
| `/admin` #70 | AS9-70-M1 | **MAJOR** | `src/app/(authenticated)/admin/placements/retention/page.tsx:24` | Back to Placements link had a sub-44px hit target → **Keep old link text; add 44px hit target and focus outline** | FIXED in code |
| `/admin` #48 | AS9-48-m1 | **MINOR** | `src/app/(authenticated)/admin/people/directory/[membershipId]/audit/page.tsx:20` | Event type shown as an internal enumeration alongside the human summary → **Consider a glossary/secondary readable label after legacy-copy approval; no copy changed** | Open (nonblocking) |
| `/admin` #70 | AS9-70-m2 | **MINOR** | `src/app/(authenticated)/admin/placements/retention/page.tsx:16-30` | Retention review intentionally exposes first 200 with truncation notice → **Verify real-world reviewer/export follow-through before increasing report cap; no invented completeness** | Open (nonblocking) |

## Per-route coverage and source trace (all 37)

Each route was checked for the playbook's heading/legacy copy, shared-component usage, 320px source layout and mobile controls, loading/empty/error/denied guards, URL filters and pagination, tenancy/permission flow, link/overlay hazards, and existing UX test coverage. Source inspection **cannot** prove physical 320/360/390px layout or focus order. A delegated read/detail route inherits its shared component contract, not an invented duplicate UI.

| Route order | Page | Concrete source evidence | Remediation or source disposition |
|---|---|---|---|
| 38 | `/admin/inbound-mail` | `src/app/(authenticated)/admin/inbound-mail/page.tsx:25` | AS9-38-M1 |
| 39 | `/admin/lecture-halls` | `src/app/(authenticated)/admin/lecture-halls/page.tsx:120` | AS9-39-B1, AS9-39-M2 |
| 40 | `/admin/lecture-halls/[hallId]` | `src/app/(authenticated)/admin/lecture-halls/[hallId]/page.tsx:42` | No additional route-source BLOCKER/MAJOR identified |
| 41 | `/admin/lessons` | `src/app/(authenticated)/admin/lessons/page.tsx:24` | No additional route-source BLOCKER/MAJOR identified |
| 42 | `/admin/live-classes` | `src/app/(authenticated)/admin/live-classes/page.tsx:5` | AS9-42-B1 |
| 43 | `/admin/module-access` | `src/app/(authenticated)/admin/module-access/page.tsx:74` | No additional route-source BLOCKER/MAJOR identified |
| 44 | `/admin/organizations` | `src/app/(authenticated)/admin/organizations/page.tsx:121` | AS9-44-B1 |
| 45 | `/admin/people` | `src/app/(authenticated)/admin/people/page.tsx:169` | AS9-45-B1, AS9-45-M2, AS9-45-M3 |
| 46 | `/admin/people/directory` | `src/app/(authenticated)/admin/people/directory/page.tsx:101` | AS9-46-M1 |
| 47 | `/admin/people/directory/[membershipId]` | `src/app/(authenticated)/admin/people/directory/[membershipId]/page.tsx:23` | No additional route-source BLOCKER/MAJOR identified |
| 48 | `/admin/people/directory/[membershipId]/audit` | `src/app/(authenticated)/admin/people/directory/[membershipId]/audit/page.tsx:14` | AS9-48-M1 |
| 49 | `/admin/people/unassigned` | `src/app/(authenticated)/admin/people/unassigned/page.tsx:48` | AS9-49-M1 |
| 50 | `/admin/placements` | `src/app/(authenticated)/admin/placements/page.tsx:56` | No additional route-source BLOCKER/MAJOR identified |
| 51 | `/admin/placements/analytics` | `src/app/(authenticated)/admin/placements/analytics/page.tsx:26` | AS9-51-B1, AS9-51-M2 |
| 52 | `/admin/placements/applications` | `src/app/(authenticated)/admin/placements/applications/page.tsx:11` | No additional route-source BLOCKER/MAJOR identified |
| 53 | `/admin/placements/applications/[applicationId]` | `src/app/(authenticated)/admin/placements/applications/[applicationId]/page.tsx:13` | No additional route-source BLOCKER/MAJOR identified |
| 54 | `/admin/placements/calendar` | `src/app/(authenticated)/admin/placements/calendar/page.tsx:39` | AS9-54-M1 |
| 55 | `/admin/placements/drives` | `src/app/(authenticated)/admin/placements/drives/page.tsx:82` | No additional route-source BLOCKER/MAJOR identified |
| 56 | `/admin/placements/hiring` | `src/app/(authenticated)/admin/placements/hiring/page.tsx:7` | No additional route-source BLOCKER/MAJOR identified |
| 57 | `/admin/placements/interviews` | `src/app/(authenticated)/admin/placements/interviews/page.tsx:9` | No additional route-source BLOCKER/MAJOR identified |
| 58 | `/admin/placements/interviews/[roundId]` | `src/app/(authenticated)/admin/placements/interviews/[roundId]/page.tsx:8` | No additional route-source BLOCKER/MAJOR identified |
| 59 | `/admin/placements/job-settings` | `src/app/(authenticated)/admin/placements/job-settings/page.tsx:7` | No additional route-source BLOCKER/MAJOR identified |
| 60 | `/admin/placements/job-settings/[jobId]` | `src/app/(authenticated)/admin/placements/job-settings/[jobId]/page.tsx:8` | No additional route-source BLOCKER/MAJOR identified |
| 61 | `/admin/placements/jobs/[jobId]` | `src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:24` | AS9-61-B1, AS9-61-M1, AS9-61-M2 |
| 62 | `/admin/placements/jobs/[jobId]/applications` | `src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:108` | AS9-62-M1, AS9-62-M2 |
| 63 | `/admin/placements/jobs/[jobId]/schedule` | `src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:70` | AS9-63-B1, AS9-63-M1 |
| 64 | `/admin/placements/jobs/[jobId]/settings` | `src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:42` | AS9-64-B1 |
| 65 | `/admin/placements/joining` | `src/app/(authenticated)/admin/placements/joining/page.tsx:7` | No additional route-source BLOCKER/MAJOR identified |
| 66 | `/admin/placements/joining/[offerId]` | `src/app/(authenticated)/admin/placements/joining/[offerId]/page.tsx:8` | No additional route-source BLOCKER/MAJOR identified |
| 67 | `/admin/placements/new` | `src/app/(authenticated)/admin/placements/new/page.tsx:17` | AS9-67-M1 |
| 68 | `/admin/placements/offers` | `src/app/(authenticated)/admin/placements/offers/page.tsx:7` | No additional route-source BLOCKER/MAJOR identified |
| 69 | `/admin/placements/offers/[offerId]` | `src/app/(authenticated)/admin/placements/offers/[offerId]/page.tsx:8` | No additional route-source BLOCKER/MAJOR identified |
| 70 | `/admin/placements/retention` | `src/app/(authenticated)/admin/placements/retention/page.tsx:29` | AS9-70-M1 |
| 71 | `/admin/placements/screenings` | `src/app/(authenticated)/admin/placements/screenings/page.tsx:7` | No additional route-source BLOCKER/MAJOR identified |
| 72 | `/admin/placements/screenings/[applicationId]` | `src/app/(authenticated)/admin/placements/screenings/[applicationId]/page.tsx:8` | No additional route-source BLOCKER/MAJOR identified |
| 73 | `/admin/placements/seasons` | `src/app/(authenticated)/admin/placements/seasons/page.tsx:7` | No additional route-source BLOCKER/MAJOR identified |
| 74 | `/admin/placements/seasons/[seasonId]` | `src/app/(authenticated)/admin/placements/seasons/[seasonId]/page.tsx:8` | No additional route-source BLOCKER/MAJOR identified |

## Shared-surface and security disposition

- `src/components/admin/lecture-hall-manager.tsx`: DataTable's always-visible phone action contract, retained draft on failed network requests, native pending state and existing confirm actions. Its `POST/PATCH` routes use `isSameOriginRequest`; downstream college-scoped services remain authoritative.
- `src/components/admin/admin-scoped-read-page.tsx`: reused for the read-only Applications, Hiring, Interviews, Job Settings, Joining, Offers, Screenings and Seasons lists. Scoped filters, paginated cards, explicit zero-result messaging and role-sensitive source data remain server-controlled. `SuperAdminPlacementDetailView` remains a single shell-compatible detail component with a not-found boundary.
- `src/components/placements/college-interview-appointments.tsx`: one responsive DataTable row tree now exposes candidate actions on mobile. The same confirm/decision services, audit updates and copy are preserved; the inline editor uses shared inputs.
- `src/components/courses/super-admin-content-directory-page.tsx`, `src/components/placements/placement-drive-workspace.tsx`, and drive Settings: raw external windows replaced with credential-free HTTPS-validated, copyable links; no trust was granted to stored URLs.
- `src/components/placements/placement-calendar-workspace.tsx` and `super-admin-drive-tabs.tsx`: 44px controls and visible deep-teal focus/contrast.
- Authorization: no new mutation endpoints, global scopes, browser-only permissions or GET writes introduced. Existing API origin checks verified for lecture-hall and inbound-mail mutations. No AI features, migrations or production operations.

## Regression tests and pre-acceptance gate

- Existing `tests/unit/ux-admin-chat6-middle-third.test.ts` retains the 37 route parity cases; its obsolete `PeoplePagination` assertion was **strengthened** to require actual shared `Pagination`, query-preserving links and visible mobile actions, rather than leaving a dead import to pass.
- New `tests/unit/ux-admin-chat9-cross-audit-second.test.ts`: **16 named `UX-admin-*` behavioral source cases**, covering the principal regressions, truthful empty/scope states, WebView-safe external navigation and shared-component contracts.
- Execute on the same committed SHA: `npm run typecheck`, `npm run lint`, targeted Vitest for both suites and prior chat6 tests, `npm run ux:guard`, `npm run ux:audit:source`, and `npm run ux:audit:unit`.
- Run physical/browser acceptance at 320, 360, 390, 768 and 1280px, 200% zoom and reduced motion; test keyboard focus, nested dialogs, async error preservation, network offline retry, read-only global/organization/college scopes and screen-reader announcements. These remain **OPEN-EVIDENCE** and should not be ticked in the authored page list.

## Top three unverified risks

1. Real WebView clipboard/download/open behavior for `ThirdPartyLink` and interview `.ics` downloads (the link source has a fallback, native hosts still need device proof).
2. End-to-end permission/tenant and stale-version behavior for all dialogs, mutation callbacks and partial-data branches across college/organization/global scope permutations.
3. Real 320/360/390px, 200%-zoom, virtual keyboard/safe-area, VoiceOver/TalkBack and screenshot acceptance, plus TypeScript/Vitest/lint exit statuses.

## Per-area verdict

**FAIL — acceptance evidence is outstanding, despite 24/24 source-level BLOCKER/MAJOR fixes.**  
Source finding counts: **BLOCKER 8 (fixed 8, open 0); MAJOR 16 (fixed 16, open 0); MINOR 2 (open 2); NIT 0.**  
Area audited **37/37 routes**, **16 added targeted regression cases**, existing legacy wording preserved. No claims of passing runtime tests or device screenshots.
