# Chat-12 TPO Students + Companies + first-third test ledger

Date 2026-10-18, branch `chatgpt/chat-12-b`. Evidence is split between executable *authored* tests and source-only checks. **No tests were run in this environment.** The generated `docs/audit/ux/COVERAGE-MATRIX.md` currently reports zero missing route UX test mentions, which does not prove keyboard, optimistic locking or tenant security.

## Functional surface coverage

| Surface | New evidence | Unresolved verification |
|---|---|---|
| TPO project visibility; unauthorized writes | `chat12-project-tpo-role-journey-hardening.test.ts` — PROJ-TPO-JOURNEY-01/02, role, session, tenant and Zod input cases | Actual project_instances joins, wrong-tenant IDOR, DB transaction roles and TPO no-write integration |
| TPO Students selected rows | `chat12-tpo-bulk-concurrency-and-authorization.test.ts` — TPO-students-14/17: page identity, all-IDs requirement, CSV roll ambiguity, 200 rows, duplicate check | Real 200-record selection on multiple pages, CAS under concurrent threads and browser stale-response race |
| TPO Students preview+confirm | Same test — HMAC scope/reason/version/order/TTL, schema acknowledgement, exact CAS undo | DB live decisions and transactional bulk-run summary recovery; D12-03 |
| TPO Students upload abuse | Same test — 64 KiB request body, chunked oversize cancellation; stream fix `635ce4e9` | Runtime memory profile and stream cancellation with slow client |
| TPO Students project profile facet | `chat12-project-tpo-role-journey-hardening.test.ts`: redacted project count, phone, unsafe URLs | Verified Projects workspace progress is NOT equal to the profile count; D12-04 |
| Companies canonical-vs-name scope | `chat12-tpo-company-directory-hardening.test.ts` — TPO-companies-05/07: canonical relationship IDs, unlinked same-name leads, foreign drive ignored | DB with duplicate relationship and archived relationship, cross-tenant integration |
| Companies joining/offer metrics | Same test: 2 accepted offers from 1 learner counts 1 joined; no estimated zero when CRM table unavailable | Actual multi-year joins, partial data and 2,000-row CSV in PostgreSQL |
| Companies filters, paging, history | Same test — TPO-companies-10/11/24: strict query, deterministic pagination, persisted timeline | Browser search/page reset, history auth after expired session |
| Companies creation/memory | Same test: `"use client"`, review-before-commit, synchronous in-flight latch, clean load/error/migration-pending states | Race between two distinct sessions, server unique-index conflict, reload after 409 |
| First-third /tpo route role UX | `chat12-tpo-first-third-role-pages.test.ts`: 18 sampled routes and preview/confirm origin gates | All 42 routes require browser and negative authorization journey coverage |
| /admin first-third cross-audit | `docs/design-system/audits/UX-ROLLOUT-AUDIT-admin-first-chat-12.md` — 37 inspected route entrypoints | Full child-component + mobile/keyboard audit remains open; no release sign-off |

## First-third /tpo route inventory

| # | Route | New named evidence | Remaining proof |
|---:|---|---|---|
| 1 | `/tpo` | Added first-third role/empty/invalid-filter source contract | Source-only, E2E pending |
| 2 | `/tpo/announcements` | Added first-third role/empty/invalid-filter source contract | Source-only, E2E pending |
| 3 | `/tpo/audit` | Added first-third role/empty/invalid-filter source contract | Source-only, E2E pending |
| 4 | `/tpo/audit/actors` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 5 | `/tpo/batches` | Added first-third role/empty/invalid-filter source contract | Source-only, E2E pending |
| 6 | `/tpo/batches/[batchId]` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 7 | `/tpo/batches/[batchId]/classes` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 8 | `/tpo/batches/[batchId]/history` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 9 | `/tpo/batches/[batchId]/invitation-prep` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 10 | `/tpo/batches/[batchId]/nudge-prep` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 11 | `/tpo/batches/[batchId]/registrations` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 12 | `/tpo/batches/[batchId]/registrations/[membershipId]/history` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 13 | `/tpo/batches/[batchId]/reminder-prep` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 14 | `/tpo/batches/[batchId]/rules` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 15 | `/tpo/batches/[batchId]/students` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 16 | `/tpo/calendar` | Added first-third role/empty/invalid-filter source contract | Source-only, E2E pending |
| 17 | `/tpo/calendar/export` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 18 | `/tpo/calendar/interviews` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 19 | `/tpo/calendar/rounds` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 20 | `/tpo/companies` | Added first-third role/empty/invalid-filter source contract | Source-only, E2E pending |
| 21 | `/tpo/companies/[companyId]` | Added first-third role/empty/invalid-filter source contract | Source-only, E2E pending |
| 22 | `/tpo/companies/[companyId]/contact-log` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 23 | `/tpo/companies/[companyId]/feedback` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 24 | `/tpo/companies/[companyId]/manage` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 25 | `/tpo/companies/[companyId]/people` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 26 | `/tpo/companies/archived` | Added first-third role/empty/invalid-filter source contract | Source-only, E2E pending |
| 27 | `/tpo/drive-day` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 28 | `/tpo/drive-day/[roundId]` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 29 | `/tpo/drive-day/[roundId]/no-shows` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 30 | `/tpo/find` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 31 | `/tpo/follow-ups` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 32 | `/tpo/home` | Added first-third role/empty/invalid-filter source contract | Source-only, E2E pending |
| 33 | `/tpo/messages` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 34 | `/tpo/messages/[threadId]` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 35 | `/tpo/messages/notifications` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 36 | `/tpo/more` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 37 | `/tpo/notifications` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 38 | `/tpo/placements` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 39 | `/tpo/placements/jobs/[jobId]` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 40 | `/tpo/placements/jobs/[jobId]/about` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 41 | `/tpo/placements/jobs/[jobId]/applicants` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |
| 42 | `/tpo/placements/jobs/[jobId]/applicants-pipeline` | Existing UX coverage matrix mentions test; no additional behavioral proof in this batch | Targeted E2E and interaction coverage pending |

## Additional 2026-10-18 test contracts (after main 3273bbbc)

| Exported surface / route | New test | Exercised checks | Remaining integration gate |
|---|---|---|---|
| `tpoStudentHistoryQuerySchema` | `chat12-tpo-history-team-and-sharing-behavior.test.ts` | Valid UUID, malformed membership, wrong page bounds, unknown tenant override | The route/service must recheck membership and college in PostgreSQL |
| `projectTpoStudentPlacementHistory` | Same | Applied vs staged result versions, offer counts, chronological event mapping, no inferred events | Rounds and joins under actual persisted data |
| `tpoCompanyTeamPostSchema`, `canPostToTpoCompanyTeam` | Same | Trim, UUID idempotency key, blank/oversize body, archived and non-active states | Actual mutation schema in `tpo-company-team-service` has its own tests still needed |
| `sortTpoPeople` | Same | Work / overdue / name ordering, stable identity and non-mutating input | Large-team query pagination |
| `describeTpoCompanyVisibility` | Same | All five sharing controls disabled with accurate non-consent copy | Verify every recruiter consumer enforces each flag |
| `readTpoBulkRequestBody` | `chat12-tpo-bulk-stream-adversarial.test.ts` | Byte limit despite lying header, split multi-byte UTF-8, invalid encoding, invalid object shape and content-type, exact limit | Slow-client stream cancellation and memory profile |
| `hasPlacementTeamMembership` | `chat12-tpo-team-scope-and-notifications.test.ts` | TPO/College Admin vs Faculty/Learner, removed memberships, disabled users | Persisted role revocation across a race with a write |
| `companyShareIssueSchema`, `companyShareRevokeSchema`, `isShareableJob`, `canIssueCompanyApplicantShare`, `isCompanyShareLive`, `issueCompanyShareToken`, `validCompanyShareAccessCode`, `escapeLiteralApplicantSearch`, `clampCompanySharePage` | `chat12-tpo-company-share-adversarial.test.ts` | Wrong tenant or state; duplicate selection; >200; expiry and revocation, token entropy/hash, malformed salt, stale cursor, literal wildcard escaping | DB share issuance/revocation and external recipient E2E challenge still pending |
| `POST /api/placements/tpo/companies/[companyId]/team` | `chat12-tpo-team-scope-and-notifications.test.ts` | Same-origin before body read; streamed 64 KiB cap; 400/413/415; strict UUID/body/idempotency input | HTTP route integration with wrong tenant, expired session, all invalid payloads |
| `mutateTpoCompanyTeam` | Same (service-source checks) | Persisted actor recheck; active relationship lock; idempotent FOLLOW row changes audited only once; deactivated notification recipient excluded | Transactional integration for insert/delete races and duplicate bell delivery |
| `/tpo/find`, `/tpo/audit/actors`, `/tpo/calendar/rounds` | `chat12-tpo-first-third-second-pass.test.ts` | Explicit TPO gate, invalid input handling, clear/recovery links, IST wording | Real narrow viewport, focus, loading and unavailable DB |
| `/tpo/companies/[companyId]/people`, `/tpo/messages/[threadId]`, `/tpo/notifications` | Same | Role gates, missing storage and missing record, empty/messages states, cursor recovery | Browser focus and tenant-crossed ID checks |
| `/tpo/placements/jobs/[jobId]/applicants-pipeline`, `/tpo/more`, `/tpo/drive-day` | Same | Invalid deep links refuse private reads, accessible nav, coordinator role split | Data-backed wrong-college, page transitions, phone |
| `/admin/attendance` and five other /admin first-third route boundaries | `chat12-admin-first-third-cross-audit.test.ts` | Invalid month before DB, scope and history/CSV recovery, admin companies/colleges invalid filters | Browser + 37-route deep-child audit remains open; see dedicated independent report |
| Student mobile filter sheet | `chat12-filter-chips-mobile-round5.test.ts`, `chat12-round19-roster-responsive-counts.test.ts` | Follow actual shared modal contract: native dialog, Escape, opener focus restoration and bottom inset | Real phone and keyboard acceptance |

New tests are **authored, not executed**. The row for a route/model does not imply all exported siblings are covered; this ledger is incomplete against the full exhaustive-coverage definition.

## 2026-10-18 route and browser acceptance additions

- `tests/unit/chat12-tpo-first-third-42-route-scope.test.ts` inventories exactly **42 first-third TPO route entrypoints** and distinguishes protected redirect-only aliases, explicitly TPO-guarded pages, and batch services whose authorization is delegated to `requireTpoBatchActor`. This is a **source-only** boundary regression, not a simulated authorization test.
- `tests/e2e/chat12-tpo-mobile-ux-and-session.spec.ts` authors real browser checks for 320/360/390px Student filter bottom-sheet focus/Escape, 320/390px Company directory overflow, and learner wrong-role denial to a forged student deep link. Requires seeded E2E roles and `E2E_AUTH_ENABLED=true` + `E2E_AUTH_SECRET`. **Not executed**.
- `tests/unit/chat12-tpo-export-and-clipboard-security.test.ts` demonstrates that pasted duplicate rolls are ambiguous rather than selecting the last matching learner, and exports guard control-character/zero-width spreadsheet formulas. Fixes D12-20 and D12-21.
- `tests/unit/chat12-tpo-roster-facets-behavioral.test.ts` covers direct roster facet intersections, missing academic evidence, search, page stability and finished cohorts.
- `tests/unit/chat12-tpo-participation-state-cas.test.ts` covers all three intents and seven exported pure decision-model contracts.
- `tests/unit/chat12-tpo-query-schema-security.test.ts` exercises strict invalid query shapes and impossible ranges for both TPO Students and Requests.
- `tests/integration/PROJ-BREAK-TPO-DB-01.test.ts` adds rollback-only real PostgreSQL witness of project member/college/role joins; it must still run through the disposable test-database harness. Does not certify same-connection services or role-based project API denial.

See `docs/audit/coverage/tpo-students-companies-chat12-ledger.md` for a **50-export audited subset**, including explicit OPEN/MOCKED/SOURCE statuses. It is not exhaustive across the 1,000+ Placements module files.

- `tests/e2e/chat12-tpo-company-deep-link-denial.spec.ts` adds eight browser journeys ensuring LEARNER cannot open Students, the Companies directory, archived companies or private employer detail/people/contact/feedback/manage deep links with forged UUIDs. Requires disposable E2E sessions; authored, not executed. These verify role denial but not genuine revoked-cookie sessions or two-college DB isolation.

## Release gates

- Run Vitest on the new unit files and typecheck: **not executed**.
- Run PostgreSQL integration on TPO bulk row locks, rollback, replay and cross-tenant IDs: **not executed**.
- Run real 320/360/390px keyboard/screen-reader passes for 42 TPO routes: **not executed**.
- Finish outstanding OPEN items in `docs/orchestrator/queues/gap-closure-chat-12.md`, especially schema and request effects (TPO-requests-verification-01, -37, -38) and Students -06/-07/-10/-12/-14/-34: **not closed by these tests**.
- Do not equate profile-derived project counts with the IIS Dharwad Projects module's canonical state.

## 2026-10-18 additional first-third behavioral page evidence

- `/tpo/requests`: `tests/unit/chat12-tpo-requests-page-role-and-empty.test.tsx` directly calls the server page and renders its actual React element to HTML with mocked downstream services (UX-tpo-first-third-requests-01). It asserts Learner and Faculty role denial before request or job reads; three malformed filters return explicit alert/recovery without data access; and an empty authorized queue includes legacy Waiting/Last 30 days/All history and truthful no-results status. This is an SSR mock, not a browser/E2E test; no PostgreSQL requests or live session revocation exercised.
- Remaining: execute all source/unit/SSR suites in cloud CI, add PostgreSQL TPO role-revocation read checks, check all 42 pages in keyboard/narrow-view/device runs. No local execution performed.
- `/tpo/requests` request/drive chooser race is now guarded by persisted TPO membership before parsing URL filters or issuing parallel service reads (TPO-requests-verification-33); the same direct server page SSR suite covers revoked role and no private fetch, in addition to invalid query and empty states. Database and browser tests remain open.
- SSR coverage expansion UX-tpo-first-third-archived-01 and UX-tpo-first-third-everyone-01: `tests/unit/chat12-tpo-archived-everyone-ssr-journey.test.tsx` calls both real server pages. Tests wrong role, revoked TPO, truthful empty/limited archive, exact company restoration links, unavailable/failed team storage, permission error propagation, valid IST message/page navigation, mute controls. Mocks services; no browser or PostgreSQL execution.
- `/tpo/audit` TPO-BREAK-audit-revoked-06: service and page now check live persisted TPO actor before privately querying audit source/table state. `tests/unit/chat12-tpo-audit-revocation-service.test.ts` (service with mocked DB) covers revoked, other-college, invalid filters, unavailable SHARE records and page guard ordering. Real PostgreSQL role race and browser expiry E2E still open.
- `/tpo/audit/actors` and `getTpoActorAudit` TPO-BREAK-actor-audit-revoked-07: persisted active actor is rechecked by both page and direct service before any exact user/entity audit event read. `tests/unit/chat12-tpo-actor-audit-revocation.test.ts` covers revoked/foreign/wrong-role and bounded malformed filter/empty states. Cloud/postgres/browser unverified.
- `/tpo/calendar` UX-tpo-first-third-calendar-02: `tests/unit/chat12-tpo-calendar-ssr-scope.test.tsx` renders the real server page with mocked calendar workspace and persisted role service. Direct assertions cover wrong-role redirect, revoked live membership, invalid dates/company-kind recovery without private calendar data, and exact authorized Week/Export/Interviews/Rounds navigation. Written, not run; phone/browser IST acceptance remains.
- SSR UX-tpo-audit-revoked-08: tests/unit/chat12-tpo-audit-pages-ssr-revoked.test.tsx checks both audit pages under wrong roles, persisted revocation, malformed input and no private query. Cloud/browser not yet run.
