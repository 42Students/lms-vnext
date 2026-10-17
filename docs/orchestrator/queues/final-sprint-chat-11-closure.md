# Chat-11 final sprint closure — 2026-10-18

Source/acceptance evidence is below. GitHub connector commits were pushed to `chatgpt/chat-11-b`; the orchestrator must execute `tsc --noEmit`, Vitest, database integration tests, and mobile/browser acceptance. **Authored tests are not executed tests.**

| Gap ID | Decision | Specific test | Acceptance |
|---|---|---|---|
| TPO-settings-audit-07 | DONE source — grouped TPO settings links and sticky desktop navigation; viewport acceptance pending | `tests/unit/chat11-final-TPO-settings-audit-07.test.ts` | `docs/audit/acceptance/tpo-settings-audit-verification.md` |
| TPO-settings-audit-11 | DONE source — deny unsupported SELECTED on TPO rule write boundary | `tests/unit/chat11-final-TPO-settings-audit-11.test.ts` | TPO settings acceptance |
| TPO-settings-audit-23 | **PARTIAL — not falsely closed**: persisted college job-type settings CRUD and built-in/custom management exist, but new drives are still limited to employment type and do not consume custom job-type IDs, nor do downstream reports use this policy | `tests/unit/chat11-final-TPO-settings-audit-23.test.ts` | TPO settings acceptance |
| TPO-settings-audit-41 | DONE source — college-scoped published content and completion evidence, saved prep-course and percentage policy, bounded queries, unknown-data distinction, TPO journey update | `tests/unit/chat11-final-TPO-settings-audit-41.test.ts` | TPO settings acceptance |
| TPO-settings-audit-60 | DONE safe CSV; legacy XLS/XLSX export remains absent | `tests/unit/chat11-final-TPO-settings-audit-60.test.ts` | TPO settings acceptance |
| TPO-settings-audit-80 | NOT-A-GAP: no preferences editor on legacy dev UI, so retain working notification inbox instead of fake switches | `tests/unit/chat11-final-TPO-settings-audit-80.test.ts` | TPO settings acceptance |
| TPO-settings-audit-95 | DONE source — allowlisted canonical job/lead/company links from scoped audit history | `tests/unit/chat11-final-TPO-settings-audit-95.test.ts` | TPO settings acceptance |
| TPO-settings-audit-R04 | DONE browser-local saved views (max five pinned, rename/delete/reuse and last used); cross-device/server persistence not claimed | `tests/unit/chat11-final-TPO-settings-audit-R04.test.ts` | TPO settings acceptance |
| LEARNER-profile-misc-02 | **BLOCKED**, private signed storage and malware/image validation must be provisioned before secure photo upload; disabled status tested | `tests/unit/chat11-final-LEARNER-profile-misc-02.test.ts` | `docs/audit/acceptance/learner-profile-misc-verification.md` |
| LEARNER-profile-misc-18 | DONE source — authorized learner-only academic record and accurate data-access/membership-change history without pretending full view logging exists | `tests/unit/chat11-final-LEARNER-profile-misc-18.test.ts` | learner profile misc acceptance |
| SA-tenants-modules-R01 | DONE source — all three control-page scope headings and page-bounded metrics with persisted authorization | `tests/unit/chat11-final-SA-tenants-modules-R01.test.ts` | `docs/audit/acceptance/superadmin-tenants-modules-verification.md` |

## Typecheck
`tests/unit/chat11-college-setup-integrity-round11.test.ts` was repaired by projecting the heterogeneous readonly phase tuples into explicit mutable `SetupStep` records with ordinary loops, avoiding both the generic readonly tuple/array problem and implicitly unknown `step`. No local TypeScript or Vitest run was available; CI still needs to verify.

## Gaps needing follow-up, not invented closures
1. `TPO-settings-audit-23`: add a persisted college job-type choice to new/edit drive schemas and pages, enforce it at the job-write boundary, and consume the chosen type in placement counts/reports. This cannot be safely inferred from the existing three-choice `employmentType`; a migration and coordinated downstream policy change are needed.
2. `LEARNER-profile-misc-02`: provision and validate private signed image storage, scanner and learner-owned receipts before allowing a photo upload.
3. `TPO-settings-audit-60`: optional strict Excel format is still absent; current CSV is scoped, spreadsheet-safe, and downloadable.
4. `TPO-settings-audit-R04`: views intentionally persist only in the current officer's browser; cross-device/server sharing was not implemented.

All source-only DONE items require automated, persisted-data, and browser acceptance before an orchestrator may mark them VERIFIED.
