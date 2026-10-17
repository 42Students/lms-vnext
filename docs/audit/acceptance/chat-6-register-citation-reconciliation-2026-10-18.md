# Chat-6 gap register citation reconciliation — 2026-10-18

The generated `docs/audit/gap-register.md` is **not edited by hand**. Its status index predates some recently committed acceptance lines. This inventory cross-references *all* chat-6 queue IDs still labelled `FIXED-ON-MAIN` without a `verified by` index entry, plus six previously indexed Faculty rows whose acceptance summary called them unverified. It is source documentation, **not** proof Vitest, TypeScript, PostgreSQL or browser tests have run. `BLOCKED` and `PARTIAL` retain those limitations.

| Gap ID | Direct acceptance citation | Named test citation (where available) | Evidence disposition |
|---|---|---|---|
| LEARNER-profile-misc-18 | `docs/audit/acceptance/learner-profile-misc-verification.md` | `tests/unit/chat11-final-LEARNER-profile-misc-18.test.ts` | DONE — source-level, access integration pending |
| COL-placements-02 | `docs/audit/acceptance/college-placements-verification.md` | `tests/unit/chat16-final-col-placements-02.test.ts` | DONE — FIXED-ON-MAIN; runtime pending |
| COL-placements-10 | `docs/audit/acceptance/college-placements-verification.md` | `tests/unit/chat16-final-col-placements-10.test.ts` | DONE — FIXED-ON-MAIN; policy/DB runtime pending |
| COL-placements-12 | `docs/audit/acceptance/college-placements-verification.md` | `tests/unit/chat16-final-col-placements-12.test.ts` | DONE (authored earlier, final-sprint verified; browser/DB pending) |
| COL-placements-20 | `docs/audit/acceptance/college-placements-verification.md` | `tests/unit/chat6-cross-page-verification-round4.test.ts` | DONE (source verified; PostgreSQL/browser pending) |
| SA-academics-people-91 | `docs/audit/acceptance/superadmin-academics-people-3-people-recruiters-verification.md` | `tests/unit/chat6-people-legacy-copy-round11.test.ts` | DONE (legacy copy restored; runtime parity pending) |
| SA-academics-people-94 | `docs/audit/acceptance/superadmin-academics-people-3-people-recruiters-verification.md` | `tests/unit/chat13-final-sprint-sa-94.test.ts` | DONE (source) |
| SA-academics-people-100 | `docs/audit/acceptance/superadmin-academics-people-3-people-recruiters-verification.md` | `tests/unit/chat6-student-csv-and-legacy-copy-round12.test.ts` | DONE (source authored; OD-23 intentionally replaces permanent deletion with reversible suspension) |
| SA-academics-people-103 | `docs/audit/acceptance/superadmin-academics-people-3-people-recruiters-verification.md` | `tests/unit/chat6-superadmin-faculty-assignment-copy-103.test.ts` | DONE (source authored; browser acceptance pending) |
| SA-placements-projects-102 | `docs/audit/acceptance/superadmin-placements-projects-c-tracker-verification.md` | `tests/unit/chat6-faculty-schedule-and-tracker-evidence-round17.test.ts` | FIXED-ON-MAIN — source verified; browser pending |
| SA-placements-projects-104 | `docs/audit/acceptance/superadmin-placements-projects-c-tracker-verification.md` | `tests/unit/chat6-tracker-parity-round4.test.ts` | DONE (source authored; real-browser/database pending) |
| SA-placements-projects-106 | `docs/audit/acceptance/superadmin-placements-projects-c-tracker-verification.md` | `tests/unit/chat6-tracker-bulk-saved-views-verification.test.ts` | DONE (source verified; workflow/database pending) |
| SA-placements-projects-107 | `docs/audit/acceptance/superadmin-placements-projects-c-tracker-verification.md` | `tests/unit/chat6-tracker-bulk-saved-views-verification.test.ts` | DONE (browser-local; multi-device sync not offered) |
| SA-placements-projects-109 | `docs/audit/acceptance/superadmin-placements-projects-c-tracker-verification.md` | Acceptance line only | DONE (provider-gated UI) |
| SA-placements-projects-112 | `docs/audit/acceptance/superadmin-placements-projects-c-tracker-verification.md` | `tests/unit/chat6-tracker-theme-nav-verification.test.ts` | DONE (source authored; browser contrast/keyboard acceptance pending) |
| SA-placements-projects-113 | `docs/audit/acceptance/superadmin-placements-projects-c-tracker-verification.md` | `tests/unit/chat16-graceful-redaction-r8.test.ts` | Source hardened; CI pending |
| SA-placements-projects-114 | `docs/audit/acceptance/superadmin-placements-projects-c-tracker-verification.md` | `tests/unit/chat16-tracker-known-error-link-round4.test.ts` | DONE (source; integration pending) |
| SA-placements-projects-116 | `docs/audit/acceptance/superadmin-placements-projects-c-tracker-verification.md` | `tests/unit/chat16-graceful-telegram-r8.test.ts` | Source contract regression suite added; provider/CI pending |
| SA-placements-projects-117 | `docs/audit/acceptance/superadmin-placements-projects-c-tracker-verification.md` | Acceptance line only | DONE (provider-gated UI) |
| SA-placements-projects-119 | `docs/audit/acceptance/superadmin-placements-projects-c-tracker-verification.md` | `tests/unit/chat6-independent-audit-findings-round9.test.ts` | DONE (independent schema registered; runtime/browser pending) |
| SA-placements-projects-121 | `docs/audit/acceptance/superadmin-placements-projects-c-tracker-verification.md` | `tests/unit/chat6-independent-finding-actions-round10.test.ts` | DONE (source authored; real DB/integration pending) |
| SA-placements-projects-122 | `docs/audit/acceptance/superadmin-placements-projects-c-tracker-verification.md` | `tests/unit/chat6-independent-audit-findings-round9.test.ts` | DONE (source authored; real DB/browser pending) |
| FAC-assessments-R01 | `docs/audit/acceptance/faculty-assessments-verification.md` | `tests/unit/chat6-faculty-evidence-r01-r02-27-r05-r07.test.ts` | FIXED-ON-MAIN — source verified; runtime pending |
| FAC-assessments-R02 | `docs/audit/acceptance/faculty-assessments-verification.md` | `tests/unit/chat6-faculty-evidence-r01-r02-27-r05-r07.test.ts` | FIXED-ON-MAIN — source verified; runtime pending |
| FAC-assessments-27 | `docs/audit/acceptance/faculty-assessments-verification.md` | `tests/unit/chat6-faculty-evidence-r01-r02-27-r05-r07.test.ts` | FIXED-ON-MAIN — source verified; runtime pending |
| FAC-assessments-R05 | `docs/audit/acceptance/faculty-assessments-verification.md` | `tests/unit/chat6-faculty-evidence-r01-r02-27-r05-r07.test.ts` | FIXED-ON-MAIN — source verified; runtime pending |
| FAC-assessments-R07 | `docs/audit/acceptance/faculty-assessments-verification.md` | `tests/unit/chat6-faculty-evidence-r01-r02-27-r05-r07.test.ts` | FIXED-ON-MAIN — source verified; runtime pending |
| FAC-attendance-grades-R02 | `docs/audit/acceptance/faculty-assessments-verification.md` | `tests/unit/chat6-faculty-schedule-and-tracker-evidence-round17.test.ts` | FIXED-ON-MAIN scope/overlap guard source-verified; historical scheduling decision remains open for runtime acceptan |

## Reconciliation counts

- Register `FIXED-ON-MAIN` gaps without an indexed citation but with a current direct acceptance row: **22**.
- Additional Faculty source contract tests and explicit acceptance rows newly added this round: **6**.
- Unique IDs cross-referenced above: **28**.
- Source test files were created for the six Faculty IDs and `SA-placements-projects-102`; four other queue gaps (`SA-academics-people-94`, `COL-placements-02`, `COL-placements-10`, `LEARNER-profile-misc-18`) already have named gap tests from their builder lanes.
- `SA-academics-people-49` was separately resolved under OD-34: the hidden global progress policy is now actually applied at service boundaries; see `tests/unit/chat6-superadmin-progress-policy-decision-49.test.ts` and its acceptance line. Database and browser behavior remain unverified.
