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
