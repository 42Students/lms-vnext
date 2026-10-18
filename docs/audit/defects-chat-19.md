# Chat-19 independently recorded defects (2026-10-18)

All fixes were authored on `chatgpt/chat-19-b` after synchronizing with `main` at `a172b146ede1992a428dbe3e74a6d87dd3a12985`. Every listed finding has a source-level regression test, but no Vitest, TypeScript, PostgreSQL or real-browser run is claimed. Severity describes the state *before* each fix. Other teams should verify merged results, 320/360/390px interactions and conflict handling before release.

| Finding ID | Before-fix severity | Evidence / affected source | Defect | Fix | Commit (prefix) | Test |
|---|---|---|---|---|---|---|
| COL-XA-07 | MAJOR | `src/app/(authenticated)/college/batches/[cohortId]/students/page.tsx` | Raw 700px batch roster hid fields and move controls on 320px | DataTable cards with action priority, empty copy | `0c621386` | `tests/unit/chat19-college-cross-audit.test.ts` |
| COL-XA-08 | BLOCKER | `src/app/(authenticated)/college/projects/page.tsx` | Malformed URL filters could throw Zod and 500 project listing | Bounded safeParse, friendly clear-filters state | `389e6da4` | `tests/unit/chat19-college-cross-audit.test.ts` |
| COL-XA-09 | MAJOR | `src/app/(authenticated)/college/projects/page.tsx` | Optional template-label outage hid core workspace list | Fail-soft template lookup; indexed mapping; retained projects | `d89771f5` | `tests/unit/chat19-college-cross-audit.test.ts` |
| COL-XA-10 | MAJOR | `src/app/(authenticated)/college/batches/[cohortId]/students/page.tsx` | Malformed batch UUID raised raw validation error | Return notFound before DB query | `0be98786` | `tests/unit/chat19-college-cross-audit.test.ts` |
| COL-XA-11 | MAJOR | `src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx` | Large fixed-width bulk allocation table unusable on phone, no scroll edge cue | Mobile DataTable, labelled checkboxes, vertical ScrollCue | `85e005c9` | `tests/unit/chat19-college-cross-audit.test.ts` |
| COL-XA-12 | MAJOR | `src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx` | Malformed slot/offering UUID raised raw parse errors during listing/submission | safeParse, 404 or friendly choice prompt | `85e005c9` | `tests/unit/chat19-college-cross-audit.test.ts` |
| COL-XA-13 | MAJOR | `src/app/(authenticated)/college/faculty-assignment/page.tsx` | Horizontal roster concealed faculty end/reassign actions | Responsive DataTable, all actions present, 44px pagination | `1b3d03e7` | `tests/unit/chat19-college-cross-audit.test.ts` |
| COL-XA-14 | MAJOR | `src/app/(authenticated)/college/faculty/[membershipId]/page.tsx` | Wide teaching-history table required sideways scrolling on phone | Mobile teaching assignment cards with history fields | `f4033441` | `tests/unit/chat19-college-cross-audit.test.ts` |
| COL-XA-15 | MAJOR | `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx` | Wide member roster concealed Move/Remove confirm controls on phone | Responsive DataTable preserves confirmations; faculty remove 44px | `c2d18afa` | `tests/unit/chat19-college-cross-audit.test.ts` |
| COL-XA-16 | MAJOR | `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx` | Invalid URLs and malformed membership input could crash mutation route | 404 invalid URLs; catch invalid membership for recoverable warning | `c2d18afa` | `tests/unit/chat19-college-cross-audit.test.ts` |
| HR-XA-01 | MAJOR | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx` | Two fixed-width tables concealed selection and offer details on phone | Responsive DataTables preserving selection and offer fields | `86d4e58a` | `tests/unit/chat19-hr-page-contracts.test.ts` |
| HR-XA-02 | MAJOR | `src/app/(authenticated)/hr/drives, hr/placements/jobs/[jobId]/page.tsx` | Infinite skeleton loading lacked slow-network recovery | Bounded shared GracefulPageLoading with reload recovery | `8f859ed4` | `tests/unit/chat19-hr-page-contracts.test.ts` |
| HR-XA-03 | MAJOR | `src/app/(authenticated)/hr/drives/page.tsx` | Retry button had undersized touch target | Shared accessible Button | `f150fa86` | `tests/unit/chat19-hr-page-contracts.test.ts` |
| HR-XA-04 | MAJOR | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx` | Back to Drives from error boundary used low-contrast link without focus cue | Deep teal and keyboard outline | `56742618` | `tests/unit/chat19-hr-page-contracts.test.ts` |

| HR-XA-05 | MAJOR | `src/app/(authenticated)/hr/conversations/page.tsx`, `src/app/(authenticated)/hr/conversations/[threadId]/page.tsx`, `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx` | Hidden scrollbars gave long message/change-request histories no more-content affordance | Focusable named ScrollCue with truthful edge fades | `1eaae5e9` | `tests/unit/chat19-hr-page-contracts.test.ts` |
| HR-XA-06 | MAJOR | `src/app/(authenticated)/hr/calendar/page.tsx` | Calendar day event overflow was invisible without scroll affordance | Named ScrollCue preserves max-height and more-content fade | `3de439aa` | `tests/unit/chat19-hr-page-contracts.test.ts` |

## Projects HR/Recruiter adversarial checks

- **PROJ-HR-01:** learner project links are disclosed only if both the active college visibility setting and company relationship grant explicitly permit them; pure projection tests also deny project data if policy denies.
- **PROJ-HR-02:** invalid URL schemes, credentials, loopback/private addresses and oversized links are never shown as portfolio destinations.
- **PROJ-HR-03:** only active, shortlisted applications from the recruiter's company and college scope can be disclosed; inactive users, removed members and withdrawn applications are rejected by the pure policy.
- **PROJ-HR-04:** an arbitrary or now-unshared applicant deep link is not resolved by the applicant drawer; the page also rejects unavailable authorized applicant IDs.
- **PROJ-HR-05:** malformed learner profile JSON fails closed; eligible project previews are capped at ten items.
- **PROJ-HR-07 (BLOCKER):** historically shortlisted **withdrawn** applicants could retain private project URLs, contact fields and resume affordance through an old authorized page or link. `src/modules/placements/hr-applicant-drawer-model.ts` now requires SUBMITTED state before opening a drawer; `src/modules/placements/hr-job-read-service.ts` retains withdrawal status records but strips profile links, resume, contacts and grades. Commits `1da9d715`, `47d52f8f`, regression `231ca3be`.
- **PROJ-HR-08 (MAJOR):** terminal-dot hostnames like `localhost.` and `campus.local.` evaded the browser-link local-address denylist. Hostname is now normalized before private-host validation; commit `5bbd2683`, tests `3602f424`.

These checks are implemented in `tests/unit/chat19-projects-recruiter-role-journey.test.ts` (base commit `4c609669` and later `231ca3be` / `3602f424`). They do **not** certify HTTP/session expiry, parallel submissions, DB rollback, signed-URL behavior, or browser navigation. HR role has no direct Projects mutation exposed by the scoped pages reviewed; read-only applicant project previews are the relevant role journey.

## Follow-up verification and unclosed risk

- Re-run all tests and TypeScript checking on the branch, including the pre-existing HR tests; this GitHub-only session cannot execute the repository or PostgreSQL test harness.
- Perform keyboard/focus, TalkBack/VoiceOver and real-device 320/360/390px acceptance for all altered DataTable/ScrollCue surfaces.
- HR messaging and multi-tab write races belong to the HR service integration coverage owned by chat-15/16, and require a DB-backed adversarial run; static route tests do not establish those guarantees.
- More work may be necessary in deeply nested `/college` components: page entry-point scanning is not a full end-to-end UX certification.

## Additional independent hardening, following the 2026-10-18 CI snapshot

| Finding ID | Before-fix severity | Evidence / affected source | Defect | Fix | Commit | Test |
|---|---|---|---|---|---|---|
| HR-XA-07 | MAJOR | `src/modules/placements/hr-drive-draft-model.ts` | Off-campus external job links could point to loopback, private-network and metadata hosts despite being HTTPS; unauthorized local destinations could be advertised to learners | Reuse fail-closed recruiter external-link policy for typed drafts and authorized-job copies | `e8267309` | `tests/unit/HR-BREAK-drive-payload-01.test.ts` (`1fc0b092`) |
| HR-XA-08 | MAJOR | `src/components/hr/hr-drive-draft-form.tsx` | React state alone did not synchronously lock rapid repeated submissions before its next render | Add synchronous in-flight ref and post-success terminal guard; retain request-key dedupe and retry on ambiguous failures | `c2c46d25` | `tests/unit/HR-BREAK-double-submit-01.test.ts` (`9c20e646`) |
| COL-XA-03 | MAJOR (CI regression) | `src/components/ui/data-table.tsx`, `tests/unit/UX-college-cross-audit-chat19.test.ts` | Old regression asserted raw `<table>` and page-scoped sticky CSS even though responsive DataTable cards had replaced them; desktop identity was not sticky in the shared table | Add desktop sticky first-column CSS without removing mobile cards, assert mobile primary identity, accessible overflow and shared behavior | `2183d240` | `tests/unit/UX-college-cross-audit-chat19.test.ts` (`74a716d8`) |
| HR-BREAK-profile-01 | TYPECHECK | `tests/unit/HR-BREAK-profile-01.test.ts` | Employer-isolation fixture lacked required fields on `RecruiterGrant` | Supply all required grant identity/organization/college fields while retaining original foreign-employer denials | `7ff56b55` | Existing `HR-BREAK-profile-01` cases |
| HR-BREAK-session-layout-01 | COVERAGE | `src/app/(authenticated)/hr/layout.tsx` | No new executable role entry test in the chat-19 page slice for disabled/revoked sessions | Added actual async server-layout assertions for active session, revoked/inactive, missing profile, no grants | `d2da705b` | `tests/unit/HR-BREAK-session-layout-01.test.ts` |
| HR-BREAK-profile-02 | MAJOR | `src/components/hr/recruiter-profile-details-editor.tsx` | Session expiry, revoked access and request throttling all showed the same retry prompt, which could encourage repeated failed saves | Centralized actionable, non-leaking recovery for HTTP 401/403/409/429, preserving unsaved form data | `30a76a40`, `55426556`, `b0cb8597` | `tests/unit/HR-BREAK-profile-01.test.ts` (`96dc1f82`) |

**Verification status:** These commits were written through the connected GitHub API, not a local checkout. Vitest, typecheck, Postgres integration tests and browser/dev-site checks were **not executed** in this run; status remains pending CI and interactive acceptance. No release-ready assertion follows from source-level checks. The new double-click guard is source-tested and request-key behavior is exercised; a browser concurrency test and server/database idempotency verification remain mandatory.

## 2026-10-18 second continuation — cloud-queue regressions and independent HR page audit

| ID | Severity before fix | Evidence | Issue / corrective action | Branch commit | Direct regression |
|---|---|---|---|---|---|
| COL-XA-09 | UNIT FAILURE / compatibility | `tests/unit/chat19-college-cross-audit.test.ts`, `src/app/(authenticated)/college/projects/page.tsx` | College project scope was deliberately consolidated to `getProjectAdminCollegeId(context)`; regression still demanded an obsolete membership variable. Preserved fail-soft optional template loading and required central scope for both snapshots and templates. | `8988c4c4` | Same existing unit test (repaired expectations) |
| UX-college-source-coverage-02 | UNIT FAILURE / compatibility | `tests/unit/chat19-college-source-coverage.test.ts` | Existing source assertion assumed `membership.collegeId` even when central helper now checks permission and the active SA college scope. Verify both reads derive exclusively from authorized `collegeId`. | `96b56b8d` | Same existing unit test (repaired expectations) |
| HR-BREAK-CONVO-02 | MAJOR | `src/app/(authenticated)/hr/conversations/[threadId]/page.tsx` matching drive read | A contaminated upstream recruiter job list row with the correct job/college but an unrelated company could be shown as a drive link; require all three: job ID, college ID and company ID. | `ea7428f0` | `tests/unit/HR-BREAK-chat19-conversation-page.test.ts` (`26b1b997`) |
| HR-BREAK-CONVO-03 | MAJOR | Same conversation page, `getDriveChangeRequests()` | Optional change-request read failure crashed an otherwise accessible conversation and lost reply UI. Fail softly with a status/retry hint and keep messages, no private exception text. | `5f2ad9c8` | `tests/unit/HR-BREAK-chat19-conversation-page.test.ts` (`1493fd53`) |
| HR-BREAK-NOTIFICATIONS-01 | COVERAGE | `src/app/(authenticated)/hr/notifications/page.tsx` | No independent chat-19 direct page invocation for malicious query, session expiry, removed grants, empty states, multi-college chooser. | `c23fac1b` | `tests/unit/HR-BREAK-chat19-notifications-page.test.ts` |
| HR-BREAK-PROFILE-PAGE-01 | COVERAGE | `src/app/(authenticated)/hr/profile/page.tsx` | Missing independent direct server-page tests for revoked session and failed self-profile read. | `6fbc51bd` | `tests/unit/HR-BREAK-chat19-profile-page.test.ts` |
| HR-BREAK-CONVO-01 | COVERAGE | `src/app/(authenticated)/hr/conversations/[threadId]/page.tsx` | Added direct page-level tests for role denial, malicious deep links, pagination caps, typed forbidden response and authorized conversation visibility. | `22c7ef70`, `18a0036e` | `tests/unit/HR-BREAK-chat19-conversation-page.test.ts` |

**Execution note:** no local run is required from this lane. The owner orchestrator runs cloud typecheck/lint/Vitest after merges; this pass updates source/tests and does not label unavailable local execution a task blocker. New failing assertions, if any, are to be fixed from the orchestrator's rolling diagnostics. Independent source changes are not yet a claim of green cloud CI.

## 2026-10-18 final /hr page-level pass and cross-audit continuation

| Finding ID | Severity | Evidence | Remedy | Commit(s) | Regression |
|---|---|---|---|---|---|
| HR-BREAK-CONVO-04 | MAJOR | `src/app/(authenticated)/hr/conversations/page.tsx`, general preview and notification enrichment | A second grant/authorization failure in a general-thread read or ancillary decision notice fetch could turn a previously authorized list into a 500. An available but potentially stale message preview also risked displaying after revoked access. Contain optional failures; suppress general message preview and inline reply after failed re-read; preserve safe scoped page filters without exposing provider errors. | `1d118d48`, `5f5d053f` | `tests/unit/HR-BREAK-chat19-conversation-inbox-page.test.ts` (`34a0891a`) |
| HR-BREAK-ROUNDS-01/02 | COVERAGE | `/hr/drives/[jobId]/messages`, `/hr/drives/[jobId]/rounds/editor`, removal, interview slots pages | Directly invoked role deny, noneditable stale round, version token, malformed IDs, empty slots/threads and explicit permission boundary tests. | `c73106e7`, `d9a3d269` | `tests/unit/HR-BREAK-chat19-drive-pages.test.ts` |
| HR-BREAK-REPORTS-01 | COVERAGE | Company reports and historical outside-drive pages | Directly verify filter validation before reports, college selector and forged success query handling. | `49dfd887` | `tests/unit/HR-BREAK-chat19-scope-pages.test.ts` |
| HR-BREAK-CALENDAR-01 | COVERAGE | Calendar and Company & Team pages | Directly verify session denial, calendar date fallback, team filters, zero college grants and report redirect. | `fd59ebbb` | `tests/unit/HR-BREAK-chat19-calendar-company-pages.test.ts` |
| HR-BREAK-ACTIVITY-01 | COVERAGE | Activity and Round Results pages | Verify denied sessions, invalid college/round filters, empty results, stale UUID. | `a559c041` | `tests/unit/HR-BREAK-chat19-activity-results-pages.test.ts` |
| HR-BREAK-DRIVES-01 | COVERAGE | HR Drive list page | Deny forged college, bad lifecycle/pagination, empty grants and multiple-grant implicit selection. | `65bd49fe` | `tests/unit/HR-BREAK-chat19-drive-list-page.test.ts` |
| HR-BREAK-HOME-01 | COVERAGE | Today, portfolio and discussion proposal-history pages | Deny expired session, wrong college, bad proposal filter and false published status. | `650a6341` | `tests/unit/HR-BREAK-chat19-home-portfolio-proposals.test.ts` |
| HR-BREAK-JOB-01 | COVERAGE | Job details, historical Messages and retired Colleges aliases | Block invalid IDs, wrong recruiter/tenant, expired session; authorize original job *before* any legacy messages redirect; verify aliases. | `6e289232` | `tests/unit/HR-BREAK-chat19-legacy-job-aliases.test.ts` |
| PROJ-BREAK-HR-COLLEGE-01 | COVERAGE | `src/modules/projects/admin-college-scope.ts` | Directly exercise recruiter without membership, College Admin own-college, Super Admin acting-college, denied permission, disabled SA. | `3cac2156` | `tests/unit/PROJ-BREAK-chat19-admin-college-scope.test.ts` |

The dedicated `docs/audit/coverage/hr-pages-chat19-ledger.md` enumerates all 22 `/hr` entrypoints and distinguishes direct mocked route execution from source contracts and full PostgreSQL/browser integration. The two alias routes are tested as executed redirect/re-export, not a separate private data render. CI ownership remains with the cloud orchestrator, so no lack-of-local-execution task blockade is recorded.


### Additional recoverable recruiter deep-link defect

| Finding ID | Before-fix severity | Source | Issue | Fix | Commit | Direct regression |
|---|---|---|---|---|---|---|
| HR-BREAK-JOB-02 | MAJOR | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx` | A valid authorized-looking job UUID with a malformed page, stage, applicant, offer or outcome filter made the underlying strict Zod parse throw to the page error boundary rather than provide actionable recovery. | Added inline recruiter-safe `ErrorState` with clear-filters action, retaining 404 for malformed job UUID, no private applicant payload or raw validation stack. | `13765dd3` | `tests/unit/HR-BREAK-chat19-legacy-job-aliases.test.ts` (`b23e24e4`) |

### Navigation loop found by independent HR UX review

| Finding ID | Severity | Source evidence | Defect | Fix | Commit | Regression |
|---|---|---|---|---|---|---|
| HR-XA-09 | MAJOR | `src/app/(authenticated)/hr/conversations/page.tsx` Notification inbox link | `/hr/messages` aliases the current `/hr/conversations` inbox. Its `Notification inbox` action therefore reopened the same page, not notifications. | Target `/hr/notifications` while keeping the legacy Messages alias. | `c4f07f41` | `tests/unit/HR-BREAK-chat19-conversation-inbox-page.test.ts` (`67f37ff5`) |

### College report reconciliation

| Finding ID | Severity | Evidence | Defect | Fix | Commit | Test |
|---|---|---|---|---|---|---|
| COL-XA-AUDIT-01 | MAJOR (audit integrity) | `docs/design-system/audits/UX-ROLLOUT-AUDIT-college-chat-19.md` group counts | Source audit grouped 85 routes with broken concatenated numerals (e.g. 14 placement paths displayed as fourteen `1` characters), obscuring the true page count. | Recomputed every functional group from `docs/orchestrator/ui-ux/pages-college.md`; made the root `/college` the dashboard group; asserted 85 total. | `215bbab1` | `tests/unit/chat19-college-source-coverage.test.ts` (`2436943f`, `3d0e7f39`) |

## Unowned UX spillover: reusable interactive HR / placement report

| Finding ID | Before-fix severity | Evidence | Failure mode / fix | Commits | Behavioural regression |
|---|---|---|---|---|---|
| UX-SPILL-HR-01 | BLOCKER (unsafe data export) | `src/components/placements/report-interactive-table.tsx`, old `copy()` joined raw untrusted cell values by tab and newline | Attacker-controlled candidate/role labels could begin a spreadsheet formula or forge pasted cells/rows. Extracted a typed export model: Unicode-aware formula neutralization, quote escaping for CSV, delimiter stripping for TSV, numeric negative preservation, and bounded download names. | `c15ba4a2`, `7239a6c6` | `tests/unit/chat19-report-table-export-security.test.ts` (`ee3c62db`, `5229b46c`) |
| UX-SPILL-HR-02 | MAJOR (phone + a11y) | Same component: raw fixed-width `<table className="w-full min-w-max">`, `aria-sort` incorrectly applied to header button and 40px controls | Converted rows to shared `DataTable`, which renders accessible phone cards + expandable detail fields; added dedicated mobile sort control and labelled pressed sorting, preserved filters, ordering and displayed-columns-only exports; increased interaction targets to 44px. | `3f4641b1` | `tests/unit/chat19-report-interactive-table-render.test.tsx` (`be32df73`) |
| UX-SPILL-HR-03 | MAJOR (mobile overflow) | Report column/filter `<details>` absolute dropdowns min-width 16rem/12rem at far-right anchors | Made phone disclosures bottom-anchored responsive sheets, bounded height with safe-area padding, added visible dismiss control that returns focus to summary. Desktop popover mode retained. | `70a97cff` | `tests/unit/chat19-report-interactive-table-render.test.tsx` (`6657055e`) |

The matrix `docs/audit/ux/COVERAGE-MATRIX.md` is a generated snapshot and is not hand-edited. Regenerate it after the cloud merge; the former `src/components/placements/report-interactive-table.tsx` raw table entry should disappear. Server page and real browser/clipboard tests are still required by release CI; the new model and SSR tests are authored but not executed in this GitHub-only lane.

## Projects unowned hardening — IIT Dharwad visible exports

| ID | Severity | Evidence | Defect | Fix | Commits | Regression |
|---|---|---|---|---|---|---|
| PROJ-BREAK-EXPORT-01 | MAJOR | `src/components/projects/project-admin-workspace-page-export.tsx`, previous `/^\\s*[=+\\-@\\t\\r]/` cell guard | User-authored workspace titles and mentor names with Unicode format characters/line separators preceding `=+@-` could evade superficial CSV formula escaping; numeric negatives were erroneously converted to text. | Export through `src/modules/projects/admin-workspace-page-export-model.ts`; quote every cell, prefix malicious text, preserve numerical values and IST timestamps. Accept *only* already scoped page items; no additional database read. | `59bc0619`, `dd1001f1` | `tests/unit/PROJ-BREAK-chat19-project-workspace-csv.test.ts` (`d41722f7`) |
| PROJ-BREAK-EXPORT-02 | COVERAGE | Same `ProjectAdminWorkspacePageExport` button | Added direct SSR assertions that export is disabled for zero visible authorized workspaces and enabled for a nonempty page, including keyboard-sized button contract. | Behavioural component tests. | `21328196` | `tests/unit/PROJ-BREAK-chat19-project-workspace-export-ui.test.tsx` |

**Remaining risk:** Browser download behavior, real Excel formula handling, and independently verified college-scoped DB list must pass orchestrator/integration tests. This lane has authored source and test regressions, not claimed production readiness.

## Unowned follow-on: recruiter report resilience and College Admin placement mobile

| ID | Before-fix severity | Evidence | Defect/fix | Commits | Test |
|---|---|---|---|---|---|
| UX-SPILL-HR-04 | MAJOR | `src/components/placements/report-interactive-table.tsx` CSV export: single click + immediate URL revoke, no browser-restriction failure state | Download could be blocked or URL revoked before consumption, while UI still claimed export had completed. `trySaveReportCsv` now models browser failures, safely disposes temporary anchors and revokes URLs after click; message says download started rather than confirming a saved file. | `0fc28a5a`, `57438140`, `444c699d`, `6513ac68` | `tests/unit/chat19-report-download-lifecycle.test.ts` (`5aafda1c`) |
| UX-SPILL-COL-FUNNEL-01 | MAJOR | `src/components/placements/college-hiring-funnel.tsx`, fixed `min-w-[72rem]` company performance table | 320px college users had no readable company-stage context without extensive sideways scrolling; converted to DataTable card rows with all nine stages reachable through accessible disclosure, kept counts and a separate totals panel and the same authorized CSV link. | `3a5713b7` | `tests/unit/chat19-college-hiring-funnel-mobile.test.tsx` (`8991b118`) |

Generated `docs/audit/ux/COVERAGE-MATRIX.md` should be refreshed after orchestrator merge, not directly patched. These contributions eliminate two more owner-listed raw-table components at the source level but do not certify real-browser visual layout. No database permission logic was broadened.

### Round candidate list UX spillover

| Finding ID | Before-fix severity | Evidence | Fix | Commit | Regression |
|---|---|---|---|---|---|
| UX-SPILL-DRIVE-DAY-01 | MAJOR | `src/components/placements/placement-drive-day-overview.tsx` candidate table forced `min-w-[42rem]` and sticky desktop columns | Migrate to `DataTable` responsive cards preserving the four original fields: Candidate (role/contact), Membership, Schedule exception, Result. No change to authorized data or statuses. | `d7053e49` | `tests/unit/chat19-drive-day-candidates-mobile.test.tsx` (`a2f9df02`) |

Requires actual 320/360/390px and keyboard browser acceptance; only source/SSR contracts were authored on this branch.

### Independent HR messaging/notifications author cross-audit

| Finding | Severity | Affected source | Behaviour and fix | Commits | Regression |
|---|---|---|---|---|---|
| HR-BREAK-NOTIFICATIONS-02 | MAJOR | `src/components/hr/hr-notification-read-button.tsx` | Button relied only on async React `saving` state and allowed two same-tick POST receipts; successful read could also be re-sent before refresh, and revoked session/permission/rate-limit errors fell through to generic copy. Reused `createHrBellMutationGate`, terminal success ref, 44px focusable action, and safe 401/403/404/409/429 recovery model, preserving expectedCreatedAt CAS token. | `fbfcbb23`, `5ad9bfd2` | `tests/unit/HR-BREAK-chat19-notification-ack-02.test.tsx` (`206549d8`) |

Persistence-level double-click/read-receipt CAS races and interactive browser clicks remain integration gates. The test validates the gate's runtime behavior, response model, initial SSR, and handler wiring, not an executed production browser session.

## Rolling cloud unit-failure follow-up — two chat-19 tests

The published `docs/orchestrator/unit-failures-latest.md` still references CI `ff6819dd` / `698eb9dd`, preceding the current centrally scoped College Projects page. Both **COL-XA-09** and **UX-college-source-coverage-02** now have their original strict source checks satisfied by the current source; simply removing or weakening them would lose intended coverage. Instead, each named test was expanded to execute behavior.

| Failure ID | Source and test decision | Remediation | Committed |
|---|---|---|---|
| COL-XA-09 | The production `src/app/(authenticated)/college/projects/page.tsx` already uses central `getProjectAdminCollegeId`, independently calls snapshots, and catches only optional template metadata. The rolling diagnostics refer to an earlier shape, not a demonstrated current source regression. | Keep all eight source checks; add real async server-page invocation with failing template lookup and successful scoped workspace read. Assert workspace remains in list, safe status is shown, no raw exception, both scoped service arguments remain authorized. | `a72cb150` |
| UX-college-source-coverage-02 | Page navigation already calls `getProjectAdminCollegeId` before scoped reads; exact required strings currently match. Reintroducing direct `membership.collegeId` as older tests demanded would weaken Super Admin acting-college security. | Retain route/source checks; additionally invoke the actual resolver with College Admin permission allowed and denied, and with recruiter grant but no college membership. Assert no recruiter grant privilege escalation. | `fb918d83` |

No test was skipped, deleted, or made weaker. The two reported failures require a fresh orchestrator cloud run before their current pass status can be stated.

## Rolling CI dd44f0f2 / new chat-19 unit failures

The latest orchestrator unit report named seven additional failed assertions, all in three chat-19-authored tests. The reviewed application sources already produce the intended behavior; these failures were introduced by test helpers, not by weakening the underlying authorization or recovery flows.

| Gap IDs | Failure count | Source/test diagnosis | Correction | Branch commit |
|---|---:|---|---|---|
| HR-BREAK-CALENDAR-01 | 1 | `placementCalendarWindow` provides ISO `YYYY-MM-DD` strings. The test accidentally used `/\\\\d/`, matching a literal backslash instead of a decimal digit. | Correct the regex to real `/\\d/` character classes, retaining bounded date checks and invalid input. | `63893f08` |
| HR-BREAK-CONVO-01 | 1 | Page returns an `ErrorState` with a safe `action` React element linking to Today, but the test's recursive text walker ignored the `action` prop and falsely concluded the link was missing. | Traverse `action` as well as `children/title/description`. Retain forbidden-message redaction assertions. | `3a527874` |
| HR-BREAK-JOB-02 | 5 | All malformed recruiter filters use a safe `ErrorState` with `action={<Link>Clear filters</Link>}`. The test text walker omitted `action`, incorrectly reporting five separate missing recovery actions. | Read `action` React content; leave all five invalid-filter and no-redirect assertions in place. | `00488860` |

These are evidence-based test corrections against current source. The next cloud CI round determines confirmed pass/fail; no test was skipped or removed.

## Independent messaging receipt history hardening

| Finding ID | Pre-fix severity | Source evidence | Defect and fix | Commit | Direct regression |
|---|---|---|---|---|---|
| HR-BREAK-MESSAGING-CSV-02 | MAJOR | `src/modules/messaging/receipt-history-export-model.ts`, prior CSV guard only recognized `\\s`, selected ASCII controls and one zero-width code point | A purpose prefixed with Unicode word-joiner, joiner, or paragraph separator before `=`, `+`, `-`, `@` could bypass CSV formula neutralization. Expanded prefix set to Unicode control, format and separator classes, preserving numeric aggregate exports and quoted CSV. | `ff4cc631` | `tests/unit/HR-BREAK-chat19-messaging-csv-unicode.test.ts` (`56ad0e20`) |
| HR-BREAK-MESSAGING-HISTORY-01 | COVERAGE | `src/modules/messaging/receipt-history-service.ts`, previously not referenced by unit tests | Exercised both exported service functions using transaction/authorization mocks for TPO vs recruiter vs wrong role, disabled session, persisted grant recheck, malformed filters, bounded pagination and 2001-row cap. No code defect found in reviewed path. | `133cd61c`, `0dc7ace6` | `tests/unit/HR-BREAK-chat19-messaging-receipt-history-service.test.ts` |

Cloud verification of the newly authored service mocks is pending a post-merge CI cycle; this ledger distinguishes authored test coverage from a confirmed passing run.

## Projects independent breaker additions

| ID | Pre-fix severity | Source | Defect / correction | Commit(s) | Regression |
|---|---|---|---|---|---|
| PROJ-BREAK-TEAM-MOVE-01 | MAJOR | `src/modules/projects/class-team-split-model.ts` (`movePreviewMember`) | Moving the sole learner out of a team produced an empty group; `classTeamPreviewSchema` disallows empty membership arrays, so the planner could show an impossible-to-submit preview. Deny the move before mutating, preserve immutable prior plan and allow harmless same-team selection. | `eb6e9698` | `tests/unit/PROJ-BREAK-chat19-team-preview-integrity.test.ts` (`4b7229c4`) |
| PROJ-BREAK-COLLEGE-LOCK-01 | COVERAGE | `src/modules/projects/admin-submission-lock-policy.ts` | Exercised membership FK actor policy for active College Admin, disabled/suspended, wrong org/college, TPO, learner, recruiter grants and Super Admin acting-college denial. No source defect identified. | `f14fbeb2` | `tests/unit/PROJ-BREAK-chat19-admin-delivery-lock-role.test.ts` |

The new planner guard is a source change; browser and PostgreSQL verification remain orchestrator gates.

## Unowned TPO Drive Day responsive roster spillover

| ID | Pre-fix severity | Affected surface | Defect and source correction | Commit | Behavioral regression |
|---|---|---|---|---|---|
| UX-SPILL-TPO-ROUND-01 | MAJOR | `src/components/placements/tpo-round-drive-day-read-only.tsx` — `Round applicant roster` | The critical check-in/result controls were inside a 46rem horizontally scrollable table, inaccessible at phone width without horizontal navigation. Converted to the shared `DataTable` with mobile identity and roll number and always-visible attendance and result action cells. Preserved status, eligibility, empty copy, audit warnings and server-controlled mutations; mobile controls are not hidden in `More details`. | `a0ed8a36` | `tests/unit/UX-SPILL-chat19-tpo-round-drive-day-responsive.test.tsx` (`2a27820d`) |

This is an independent unowned responsive UX pickup for the critical TPO/HR placement workflow. A real 320/360/390px screen-reader/browser pass remains an acceptance gate; SSR test validates emitted controls and no wide-table requirement.

## Unowned TPO request clipboard spillover

| ID | Before-fix severity | Source | Defect and fix | Commits | Test |
|---|---|---|---|---|---|
| UX-SPILL-TPO-CLIP-01 | MAJOR | `src/components/placements/tpo-request-page-clipboard.tsx` | The Choose columns control hid columns visually, but Copy selected rows still exported **all** fields, including concealed employer/student-number data. TSV also allowed Unicode zero-width/paragraph prefixed spreadsheet formulas and copied rows in original rather than displayed sort order. Scope clipboard fields to selected visible columns, retain canonical headings, preserve displayed sort, neutralize Unicode formulas and strip row/column delimiters. | `a5d72407` | `tests/unit/UX-SPILL-chat19-tpo-request-clipboard.test.ts` (`41ceef55`, `3457acc4`) |

## Further TPO request phone accessibility

| ID | Severity | Source | Problem and correction | Commit | Test |
|---|---|---|---|---|---|

| UX-SPILL-TPO-CLIP-02 | MAJOR (mobile accessibility) | `src/components/placements/tpo-request-page-clipboard.tsx` | Desktop-only spreadsheet plus separate narrow phone selector showed only student/company, hiding request kind, decision and status on a phone. Replaced dual display with shared `DataTable` cards showing primary identity, additional fields via accessible More details, and selectable actions at every viewport. Kept Select visible page, sortable rows, chosen column controls and clipboard semantics. | `9aea98f0` | `tests/unit/UX-SPILL-chat19-tpo-request-responsive.test.tsx` (`cbc3cd33`) |

## Further request clipboard hardening

| ID | Before-fix severity | Source | Issue and remediation | Commit | Test |
|---|---|---|---|---|---|
| UX-SPILL-TPO-CLIP-03 | COVERAGE | `src/components/placements/tpo-request-page-clipboard.tsx` | Extracted immutable visible-row sorting and selected-row projection so clipboard output matches chosen sort order and stale IDs from prior pages cannot be copied. | `108622ce` | `tests/unit/UX-SPILL-chat19-tpo-request-clipboard.test.ts` (`e0c33c4c`) |
| UX-SPILL-TPO-CLIP-04 | MAJOR | Same clipboard serializer | NEL (U+0085), vertical tabs and other Unicode control codes were not stripped by the narrow tab/CR/LF separator cleanup. Spreadsheet importers can treat them as row separators. Replace Unicode control and line/paragraph separators with spaces before formula neutralization; preserve the authorized visible-column restriction. | `cbc0d6e4` | Same direct unit suite (`5e2a2efa`) |

## HR notifications stale-tab recovery

| ID | Pre-fix severity | Source and defect | Fix | Commits | Regression |
|---|---|---|---|---|---|
| HR-BREAK-NOTIFICATIONS-02 | MAJOR | `listHrNotifications` accepted a syntactically valid old `page=9999` even after the selected college/unread filter shrank to one page. SQL offset returned zero rows and misleadingly said there were no matching notifications, although the database still contained authorized notifications. | After counting only authorized matching events, clamp the page to the final actual page before SQL offset and response metadata. Leave strict 1–10000 query validation and original bounds helper semantics unchanged. | `e0febf75`, `93d4d1ca` | `tests/unit/HR-BREAK-chat19-notification-stale-page.test.ts` (`0ec2ea1f`), `tests/integration/hr-notifications.test.ts` (`5d4b6fa6`) |

## HR report stale-page correction

| ID | Before-fix severity | Source | Problem and fix | Commits | Direct regression |
|---|---|---|---|---|---|
| HR-BREAK-REPORTS-02 | MAJOR | `src/modules/placements/recruiter-company-reports-service.ts` | A saved HR report link with a now-out-of-range page (after status filters or drive counts changed) returned zero drives and a misleading empty state. Count the exact authorized employer-college/status portfolio first, clamp the requested page, then apply that page to SQL offset and rendered page metadata. Preserve tenant/company permission checks and 1–10000/1–50 request schema. | `406c9f52`, `55095c1b` | `tests/unit/HR-BREAK-chat19-company-report-stale-page.test.ts` (`2f9fa839`) |

## Projects class team CSV export

| ID | Severity | Source | Finding and fix | Commit | Regression |
|---|---|---|---|---|---|
| PROJ-BREAK-TEAM-CSV-02 | MAJOR | `src/modules/projects/class-team-csv-export.ts` | CSV spreadsheet formula defense stripped only a manually enumerated set of invisible prefixes and could miss Unicode format controls such as U+034F/U+180E. Defuse leading formulas behind any Unicode control, format, spacing, line or paragraph separator while preserving team IDs, CSV quoting, and authorized visible rows. | `c77b3822` | `tests/unit/PROJ-BREAK-chat19-class-team-csv-unicode.test.ts` (`8ea27868`) |

## Unicode spreadsheet mark and final clipboard accessibility hardening

| ID | Severity | Source | Finding and correction | Test |
|---|---|---|---|---|
| HR/PROJ-CSV-UNICODE-03 | MAJOR | `class-team-csv-export.ts`, `admin-workspace-page-export-model.ts`, `report-interactive-table-export-model.ts`, `receipt-history-export-model.ts`, `tpo-request-page-clipboard.tsx` | Unicode combining marks, e.g. U+034F before an equals sign, were omitted from existing control/format/space prefixes and could bypass formula neutralization across Projects and placement exports. Include Unicode Mark category before formula characters; also sanitize NEL/vertical-tab in report clipboard TSV. | `tests/unit/chat19-invisible-mark-export-matrix.test.ts` |
| UX-SPILL-TPO-CLIP-05 | MAJOR | `TpoRequestPageClipboard` | Request sorting, column chooser, reset button and option touch targets were as short as 40px or less, with missing visible keyboard-focus treatment. Set 44px minima and focus outlines without changing filter/sort semantics. | `tests/unit/UX-SPILL-chat19-tpo-request-responsive.test.tsx` |

## Duplicate-key HR URL parameter ambiguity

| ID | Severity | Source | Defect / hardening | Regression |
|---|---|---|---|---|
| HR-BREAK-QUERY-05 | MAJOR | `/hr/notifications`, `/hr/conversations`, `/hr/activity` page entrypoints | Repeated query parameters (`collegeId=A&collegeId=B`, `page=1&page=2`, repeated search text) were silently reduced to the first value before Zod validation. This made a URL appear to contain one tenant/filter selection while the app acted on another. Pass raw query values to the strict schemas, rendering the existing recoverable invalid-filter state for ambiguous arrays; no private service read occurs. | `tests/unit/HR-BREAK-chat19-notifications-page.test.ts`, `tests/unit/HR-BREAK-chat19-conversation-inbox-page.test.ts`, `tests/unit/HR-BREAK-chat19-activity-results-pages.test.ts` |

## IIT Dharwad class-team outcome report injection

| ID | Severity | Source | Defect and fix | Unit evidence |
|---|---|---|---|---|
| PROJ-BREAK-OUTCOME-CSV-03 | MAJOR | `src/components/projects/class-team-workspace-creator.tsx` individual creation outcome export | The CSV download quoted untrusted learner display names and workspace titles but did not neutralize spreadsheet formulas (`=HYPERLINK`, invisible prefix, U+034F), allowing malicious cell values to be interpreted as spreadsheet commands. The previous download also revoked object URLs immediately, potentially racing browser Blob reading. Extracted pure, shared safely quoted/formula-neutralized serializer; export only authorized `outcome.individualResults` and roster names, preserve filename/IST page wording, defer blob cleanup and show recoverable error. | `tests/unit/PROJ-BREAK-chat19-class-team-outcome-csv.test.ts` |

## Post-merge HR adversarial mutation and search follow-up

| Gap ID | Severity | Source | Finding, fix and risk | Behavioral evidence |
|---|---|---|---|---|
| HR-BREAK-NOTIFICATION-OWNER-06 | MAJOR | `src/modules/placements/hr-notification-read-service.ts` and `hr-notification-read-model.ts` | Listing the recruiter notifications already checked `recruiter.userId===user.id`, but the write endpoint only checked active flags. A context containing a mismatched recruiter identity could reach employer job inventory before failing. Require exact signed-in user/recruiter ownership on mutation before any job lookup or DB transaction. | `tests/unit/HR-BREAK-chat19-notification-ownership.test.ts`: real service call for cross-user, disabled user and absent recruiter; assert no DB/job queries |
| HR-BREAK-INBOX-SEARCH-07 | MAJOR | `src/modules/placements/hr-conversation-inbox-service.ts` and `hr-conversation-inbox-model.ts` | Message search selected a maximum 1000 distinct thread IDs after per-recruiter scoping, silently hiding matches at position 1001+ for large employers. The per-tenant set of authorized thread IDs already supplies the exact maximum possible distinct matches. Bound by this cardinality instead of an arbitrary global cutoff, without widening SQL scope. | `tests/unit/HR-BREAK-chat19-inbox-search-boundary.test.ts`: 1205 matches, ownership exclusions, last page and SQL scope |

Cloud CI, real database tenant-isolation and scale benchmarks remain pending, and no passing run is asserted.

## HR Today unread-notification misnavigation

| Gap | Severity | Affected source | Wrong behaviour, correction and tests |
|---|---|---|---|
| HR-BREAK-TODAY-UNREAD-08 | MAJOR | `src/modules/placements/hr-today-unread-model.ts`, `src/app/(authenticated)/hr/messages/page.tsx` | The unread **notifications** action incorrectly opened `/hr/messages?unreadOnly=true`. The legacy Messages route now correctly aliases recruiter **conversations**, so this sent the recruiter to a different inbox and failed to show the expected system-notification list. Route the action to `/hr/notifications?collegeId=…&unreadOnly=true`, preserving college grant and unread filtering. Update the stale, incorrect URL expectation and add explicit regression in `tests/unit/hr-today-unread-model.test.ts`. |

## CI 834983cc — direct chat-19 failure remediation

The refreshed unit failure register contains exactly two chat-19 entries. The production typecheck and lint report **PASS** and has no chat-19 test-file TS diagnostics. Both reported failures are addressed without suppressing tests.

| ID | Reported failing assertion | Root cause | Correction |
|---|---|---|---|
| PROJ-BREAK-EXPORT-02 | Project export button did not appear enabled for authorized visible rows | SSR `<Button>` always carries Tailwind's `disabled:opacity-50` and `disabled:cursor-not-allowed` **CSS class names** even when enabled, so the previous blanket `html.not.toContain("disabled")` falsely treated CSS selectors as a disabled DOM attribute. | Inspect the actual rendered `<button ...>` and assert the presence/absence of the **disabled HTML attribute** using a whitespace-anchored matcher. Retain the nonempty authorized row, empty disabled state, 44px target and no global export-link assertions. |
| COL-XA-14 | Faculty assignment history did not carry expected accessible caption | The live `DataTable` caption had changed from `Persisted teaching assignments` to `Faculty teaching assignments`. The original test's accessibility contract is appropriate and was retained. | Restore `caption="Persisted teaching assignments"` in the college-scoped faculty detail server page, keeping the visible heading `Faculty teaching assignments` and the persisted-row projection unchanged. |

The two corrections are authored on chat-19's branch. The next CI run is required to establish a passing result.

## Independent HR drive messaging service security review

| ID | Before-fix severity | Source | Finding / fix | Direct regression |
|---|---|---|---|---|
| HR-BREAK-DRIVE-THREAD-09 | MAJOR | `src/modules/placements/hr-drive-conversation-service.ts` | The service correctly authorized the workspace and filtered by job/recruiter, but did not independently confirm each returned thread belonged to the **same college**. Harden the composition boundary against a malformed nested list result by filtering `thread.collegeId===workspace.college.id` before passing through recruiter/job filtering. | `tests/unit/HR-BREAK-chat19-drive-conversation-service.test.ts` directly invokes the service with other-college, other-recruiter and other-job rows, invalid job UUID, authorization denial and primary read failure. |

## HR profile identity second-pair-of-eyes hardening

| ID | Severity | Source | Finding, correction, evidence |
|---|---|---|---|
| HR-BREAK-PROFILE-IDENTITY-10 | MAJOR | `src/modules/placements/recruiter-profile-service.ts`, `src/app/(authenticated)/hr/profile/page.tsx` | Both the self-profile reader and own-grant selector previously relied on `hasActiveRecruiter(context)` but did not verify `context.recruiter.userId===context.user.id`. Reject the mismatched identity before any DB lookup/mutation, matching the already-hardened grant overview. Added service and real page tests to assert no read/write is attempted. |
| HR-BREAK-PROFILE-NAME-11 | COVERAGE | `src/modules/placements/hr-recruiter-name-fields-model.ts` | Added independent direct tests for Unicode name splitting, canonical editing, strict rejection of injected fields, length boundaries and millisecond IST/UTC optimistic versioning; no source defect identified on review. |
