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
