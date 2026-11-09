# UX-G161 — Tracker interactive components

**Canonical state: DOING.** Eight interactive component sources belong to this group.

## Audited scope

- `audit-finding-status-action.tsx`: successful audited transition now locks stale version until server refresh; props version/current change re-syncs draft status and prevents an outdated second mutation.
- `tracker-live-logs-explorer.tsx`: CSV now uses shared Unicode-safe `spreadsheetCsvCell` for every untrusted field (including format/control/combining prefixes), while preserving existing static CSV header and LF row contract required by downstream consumers.
- `independent-finding-actions.tsx`, `known-errors-workspace.tsx`, `tracker-quick-report-launcher.tsx`, `tracker-report-form.tsx`, `tracker-telegram-manual-panel.tsx`, `tracker-workflow-panel.tsx`: audited component inventory for form/dialog/triage/alert/export states; other flows are not counted as newly browser-verified.

## Tests and verification debt

- Existing regression `tests/unit/chat16-SA-placements-projects-117-export-evidence.test.ts` asserts the original CSV header/line count; the compatibility contract was preserved. New `tests/unit/ux-five-group-batch-20261107.test.ts` tests Unicode-obscured formula cells and stale finding-state contract.
- Browser spec `tests/e2e/ux-five-group-batch-20261107.spec.ts` covers authenticated report route at 1280px and 390px with screenshot paths, when executed.
- Need exact-SHA CI results and real desktop/mobile testing for create report, similar search, attachments, known errors, status transitions, conflict, Telegram test/digest, log downloads, permission denials, no exported private secrets and screen reader focus.
- Server-side audit authorization, immutable records and redaction remain authoritative. No new export endpoint or permission was created.

**Do not mark DONE** until tests and authenticated browser matrix pass on an exact SHA and evidence is recorded in canonical tracker.

## 8 November 2026 — field accessibility, safe retry and shared CI

- [Shared exact-SHA workflow 42476817032](https://github.com/42Students/lms-vnext/actions/runs/42476817032) **SUCCEEDED** at `c98ddc2bf339ba1f3d7a0f7ff8a1fba091e0497a`: scoped ESLint, full TypeScript, focused unit regressions and **17/17 authenticated responsive Chromium scenarios** across the shared component groups.
- The tracker issue report now exposes Page, Screen, Section and Issue Type as stable accessible select names; when Page/Screen change, the previous uncertain-submission idempotency retry key is cleared. The report validation and retry contracts have new unit regressions.
- Browser acceptance uncovered that a test fixture accidentally contained literal backslash-n sequences inside a comment, preventing the Page and Screen commands from executing; this was corrected in `9756bc514113f3cb4f1131e053474bb997f20465`. An exact-SHA end-to-end create-and-open receipt is required before claiming this report workflow green.
- Full admin workflow transitions, attachments, log export, Telegram, stale concurrency and complete eight-component focus/permission matrix remain unverified. **Keep DOING.**

## 8 November 2026 — Telegram double-submit prevention

- [Source fix 3b55bfda](https://github.com/42Students/lms-vnext/commit/3b55bfdad75f9e440accec8f9ca41655df0d578e) puts a synchronous ref guard before the first awaited Telegram manual-alert request; rapid repeated confirmation clicks can no longer initiate duplicate POSTs before React sets pending. Existing server authorization, explicit confirmation, provider acceptance wording and rate limits remain unchanged.
- [Regression check d09c5a4e](https://github.com/42Students/lms-vnext/commit/d09c5a4e21a91bf4d119cb5c92cd52ebc1bcf078) protects the guard and confirmation contracts. [Shared workflow 2c4f6e49](https://github.com/42Students/lms-vnext/commit/2c4f6e49fd0d6fc3e2957f36df6b7abcf9411b77) scopes ESLint to the changed Telegram component and attendance component; [workflow 7dc4aa91](https://github.com/42Students/lms-vnext/commit/7dc4aa9179254dfc3345be34392e293a6f0a7e78) preserves already-running acceptance across concurrent main pushes.
- [Shared acceptance run 42487970844](https://github.com/42Students/lms-vnext/actions/runs/42487970844) was **pending when recorded**; no pass is asserted. Full actual provider test/digest, controlled failures, stale-version transitions, attachments and desktop/mobile browser/permission matrix remain open. Canonical group stays DOING.

## 8 November 2026 — workflow version-lock and real report journey

- [Source fix d2082b77](https://github.com/42Students/lms-vnext/commit/d2082b77799316fdd898a4656a383f2223724f1b) adds a synchronous single-flight mutation guard to `tracker-workflow-panel.tsx` across **status transition**, **engineering details save** and **retest**. The first click locks before any awaited API call, preventing rapid duplicate request submissions while React transitions update. A successful write or explicit 409 conflict requires fresh server issue props; a visible Refresh issue action prevents silent stale-version replay. All existing service permissions and optimistic compare-and-set versions remain unchanged.
- [Unit coverage 71951696](https://github.com/42Students/lms-vnext/commit/71951696e127142d6033c52eb7c0253615cf61d8) checks all three mutation paths, the lock's try/finally release, stale-version UI guidance and unchanged expectedVersion. [CI scope 056354d4](https://github.com/42Students/lms-vnext/commit/056354d41ae629fc81831bd7a0f7996610e99bd9) lints this source and runs the complete group Vitest regressions.
- [Browser fix 466c1cc0](https://github.com/42Students/lms-vnext/commit/466c1cc00e9498b9a2841c1a59cfbe85b9627df3) verifies the exact persisted View issue route after an HTTP 201 report POST without racing body consumption during navigation. The existing browser suite still requires two viewports and denial of privileged log export from a Learner. [Latest exact-SHA G154+G161 run 42495926875](https://github.com/42Students/lms-vnext/actions/runs/42495926875) was **pending**, not a pass.
- Remaining G161 acceptance gaps: true issue workflow mutations, known-error link/recovery, attachments, provider-backed Telegram dispatch and restricted live logs on real authorized/denied identities. **DOING remains** until group-wide proof is complete.

## 8 November 2026 — isolated G161 closure attempt (this chat)

**Still DOING; do not infer DONE from submitted tests or earlier partial passes.**

Concrete source fixes now on `main`:
- `audit-finding-status-action.tsx`: current-version triage draft also resets on finding identity change.
- `independent-finding-actions.tsx`: reset action-specific drafts for each finding/version, freeze edits on CAS conflict and show explicit refresh recovery; do not retry an uncertain update with an obsolete version.
- `tracker-workflow-panel.tsx`: engineering save and retest HTTP 409 now request fresh issue props and block repeated stale writes, as status changes already did.
- `known-errors-workspace.tsx`: synchronize linked issue ID after a server-proven refresh and clear consumed triage drafts only after a successful update.
- `tracker-quick-report-launcher.tsx`: do not copy URL query parameters (which may contain token material) into diagnostic report context.

Verification authored:
- `tests/unit/ux-g161-finding-actions-recovery.test.ts`: seven focused source contracts for these state and privacy recovery paths. **Authored, not an executed pass.**
- `tests/e2e/ux-g161-scoped-browser.spec.ts`: four isolated real-browser scenarios: report/create plus status CAS and stale rejection, Learner role denials, authorized Logs invalid filter/unconfigured recovery, and quick-report query privacy; desktop 1280x800 and mobile 390x844 screenshots.
- `.github/workflows/ux-g161-scoped-browser-acceptance.yml`: dedicated exact-SHA lint, typecheck, focused regression, seeded PostgreSQL and Chromium acceptance with screenshots; latest workflow dispatch is [42497872675](https://github.com/42Students/lms-vnext/actions/runs/42497872675), **pending at the time of documentation**. This avoids coupling G161's status to the separate G154 template assignment failure.
- `.github/workflows/ux-g161-finding-actions-acceptance.yml`: independent recovery source job [42497869564](https://github.com/42Students/lms-vnext/actions/runs/42497869564), **pending at the time of documentation**.

Earlier shared [run 42495926875](https://github.com/42Students/lms-vnext/actions/runs/42495926875) passed the two G161 browser cases but failed its G154 template-assignment assertion (403 instead of 200). This cannot serve as group-wide exact-SHA closure.

**Remaining independent acceptance:** execute and inspect the above jobs (including TypeScript and browser traces); real authorized issue workflow status/save/retest and denial/409 cases; independent audit-finding status, severity, comments, duplicate/fix commit and history; known-error triage and linkage in persistence-ready environment; live-log details/redaction/CSV/export and permission negatives with a configured provider; screenshot upload confirm/retry; actual Telegram test/digest provider acceptance, rate limit and error paths; keyboard/focus and 320px/390px/1280px across all eight components. Provider delivery must never be inferred from request acceptance. Only update `docs/tracker.json#uxReview` to DONE with executed green evidence and browser screenshots.

## 9 November 2026 — ambiguous update receipt recovery (atomic UX-G161 scope)

- On a triage status PATCH, HTTP 408 or 5xx is now treated as a potentially committed write: disable the old-version submit control and provide an explicit refresh path rather than saying the status definitely was not saved. Normal validation failures still show a definite unsaved state, and HTTP 409 retains its dedicated conflict message.
- The independent audit-finding editor now also quarantines transport failures (status 0) and HTTP 408 responses, not only 409 and 5xx. Unknown outcomes show neutral guidance to refresh before resubmitting; existing optimistic-version checks, authorization and audit events are unchanged.
- Regression contracts added to `tests/unit/ux-g161-finding-actions-recovery.test.ts`; the two existing G161 exact-SHA CI workflows are triggered by these source paths. Authored tests and pending CI do **not** certify the full group.
- The November 9 atomic repartition assigns five component files to UX-G161 and the other historical components to sibling UX-G339. Older eight-component scope references above remain historical. This patch is **IMPLEMENTED / VERIFY**, and the canonical UX-G161 status remains **DOING** pending full authenticated desktop/mobile workflow, permission and provider evidence.

## 9 November 2026 — Known Errors uncertain-write retry guard

- The Known Errors card now distinguishes a confirmed validation rejection from a timeout, interrupted response or 5xx of uncertain write outcome. These can outlive the client-side `useGuardedAction` timeout, so repeated ACKNOWLEDGE, MUTE, STATUS and LINK_ISSUE actions are disabled until a full page reload retrieves persisted state.
- A visible, accessible Reload known errors action explains the condition. Pure read/copy diagnostics remain available; ordinary authorized success and definite validation failures retain their existing behavior.
- A focused G161 regression contract was added. Full functionality, seeded database state, negative role/tenant behavior and mobile/desktop screenshot acceptance remain **unverified** until the exact-SHA checks complete. **DOING**, not DONE.

## 9 November 2026 — UX-G161 final-Doing-group recovery, current atomic five-file scope

- Current canonical ownership: **UX-G161 is DOING** and contains `audit-finding-status-action.tsx`, `independent-finding-actions.tsx`, `known-errors-workspace.tsx`, `tracker-live-logs-explorer.tsx` and `tracker-quick-report-launcher.tsx`. The former eight-component inventory split `tracker-report-form.tsx`, Telegram controls and workflow panel into sibling **UX-G339**. Do not count the historical eight files as this atomic group's evidence.
- [Source fix `4f92654a`](https://github.com/42Students/lms-vnext/commit/4f92654a5fe9879692a7b334974dec45e73fb4a3): the real Super Admin live-log explorer now removes previously displayed provider rows and invalid next-page cursors when a successful query indicates Cloud Logging is **not configured**. It does not carry prior records into a false current/zero state.
- The same fix flags changed-but-not-applied filters and prevents misleading exports of a different query. A transport loss, HTTP 408 or 5xx after a Known Error MUTE may indicate a committed write; further stale mute changes are disabled, the dialog closes, and a **Reload logs** action requests a fresh persisted state before retry. Definite validation rejection remains retryable. These are client UX/safety corrections; they do not change the provider, roles, authorization, database writes or the server CSV/redaction pipeline.
- [Regressions `317dab25`](https://github.com/42Students/lms-vnext/commit/317dab25672eeda852ac6b120d0b03c93ce733a7): two additional unit source contracts, scoped ESLint for `tracker-live-logs-explorer.tsx`, and exact-run Chromium gate increased from four to **six** scenarios.
- [Responsive acceptance `eba18018`](https://github.com/42Students/lms-vnext/commit/eba18018d0cbf0b4e549016c0ff30f7c90389662): two real Super Admin session UI tests with stubbed redacted provider rows solely to exercise configured→unconfigured refresh and interrupted MUTE behavior; asserts filter-change warning, disabled export until filters apply, no stale entries, no duplicate mutation, and saves desktop/mobile screenshots. These stubs are **not** proof of a configured production Cloud Logging provider or successful database-backed mute transition.
- [Latest six-scenario exact-SHA workflow #42670944647](https://github.com/42Students/lms-vnext/actions/runs/42670944647), source `eba18018d0cbf0b4e549016c0ff30f7c90389662`: **PENDING at documentation time, NOT GREEN evidence**. This follows earlier independent green [#42501048096](https://github.com/42Students/lms-vnext/actions/runs/42501048096) with 4/4 real browser cases, [#42500570748](https://github.com/42Students/lms-vnext/actions/runs/42500570748) with source regressions, and [#42641655870](https://github.com/42Students/lms-vnext/actions/runs/42641655870) with persisted report creation. Earlier outcomes are exact-SHA partial evidence, not equivalent to complete current atomic acceptance.

**Remaining before DONE:** require latest exact-SHA green unit/lint/TypeScript and six browsers, inspect screenshot artifacts; then record complete positive/negative UI execution for five components: audit finding status CAS and stale recovery, independent audit finding severity/comment/duplicate/fix commit and authorized vs denied cases, known error acknowledgement/mute/link and uncertain persisted outcomes with role denials, configured-provider live-log detail/redaction/pagination/export and OTP-backed step-up authorization (not just a fixture), quick reporter shortcut/context/form and focus at 320/390/1280; demonstrate no sensitive information in URLs/exports, prove stable mutation results, and append formal evidence to `docs/tracker.json`. Keep status **DOING** if any of these are unverified; no CI/security assertion may be weakened to force closure.
