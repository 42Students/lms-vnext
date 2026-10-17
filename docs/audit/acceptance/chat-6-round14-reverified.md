# Chat-6 round: source-evidence reconciliation

This is a **source-verification inventory, not a successful test run**. Source-level coverage was rechecked on the synced chat-6 branch for existing `FIXED-ON-MAIN` entries. Each row below had an existing named unit-test case containing the exact gap ID, an existing acceptance record, and its queue status changed to DONE in a gap-ID-tagged commit. Runtime/DB/browser verification remains the orchestrator's responsibility.

Total source-verifications: **34**. Includes **31** queue FIXED-ON-MAIN rechecks plus **3** previously OPEN provider-gated Tracker workflows implemented on main. No storage credentials, provider configuration, or UI restyling implied.

## College dashboard

| Gap ID | Existing test case verified in source | Acceptance |
|---|---|---|
| `COL-dashboard-03` | `tests/unit/chat6-college-dashboard-verified.test.ts` — COL-dashboard-03 shows today scheduled held and marked class counters | Existing source acceptance row found |
| `COL-dashboard-04` | `tests/unit/chat6-college-dashboard-verified.test.ts` — COL-dashboard-04 flags held sessions missing marked attendance for 7 days | Existing source acceptance row found |
| `COL-dashboard-05` | `tests/unit/chat6-college-dashboard-verified.test.ts` — COL-dashboard-05 checks attendance below the college policy threshold over 30 days | Existing source acceptance row found |
| `COL-dashboard-06` | `tests/unit/chat6-college-dashboard-verified.test.ts` — COL-dashboard-06 shows waiting-to-be-graded submissions per course | Existing source acceptance row found |
| `COL-dashboard-07` | `tests/unit/chat6-college-dashboard-verified.test.ts` — COL-dashboard-07 reports current unstaffed active course deliveries | Existing source acceptance row found |
| `COL-dashboard-08` | `tests/unit/chat6-college-dashboard-verified.test.ts` — COL-dashboard-08 surfaces specific persisted setup relationship gaps | Existing source acceptance row found |
| `COL-dashboard-09` | `tests/unit/chat6-college-dashboard-verified.test.ts` — COL-dashboard-09 shows published quizzes closing in the next seven days | Existing source acceptance row found |

## Learner profile and misc

| Gap ID | Existing test case verified in source | Acceptance |
|---|---|---|
| `LEARNER-profile-misc-07` | `tests/unit/chat6-learner-profile-round2-verified.test.ts` — LEARNER-profile-misc-07 restores exact legacy section headings | Existing source acceptance row found |
| `LEARNER-profile-misc-09` | `tests/unit/chat6-learner-profile-round2-verified.test.ts` — LEARNER-profile-misc-09 shows profile completion ring and completed remaining pills | Existing source acceptance row found |
| `LEARNER-profile-misc-10` | `tests/unit/chat6-learner-profile-round2-verified.test.ts` — LEARNER-profile-misc-10 guards unsaved profile edits before discarding | Existing source acceptance row found |
| `LEARNER-profile-misc-11` | `tests/unit/chat6-learner-profile-round2-verified.test.ts` — LEARNER-profile-misc-11 refreshes saved profile on returning to visible tab | Existing source acceptance row found |
| `LEARNER-profile-misc-12` | `tests/unit/chat6-learner-profile-round2-verified.test.ts` — LEARNER-profile-misc-12 supports deep links to profile sections | Existing source acceptance row found |
| `LEARNER-profile-misc-13` | `tests/unit/chat6-learner-profile-round2-verified.test.ts` — LEARNER-profile-misc-13 provides skill catalogue searching instead of free text only | Existing source acceptance row found |
| `LEARNER-profile-misc-14` | `tests/unit/chat6-learner-profile-round2-verified.test.ts` — LEARNER-profile-misc-14 shows verification badge at top of profile | Existing source acceptance row found |
| `LEARNER-profile-misc-21` | `tests/unit/chat6-learner-profile-round2-verified.test.ts` — LEARNER-profile-misc-21 displays audience context for learner notifications | Existing source acceptance row found |
| `LEARNER-profile-misc-22` | `tests/unit/chat6-learner-profile-round2-verified.test.ts` — LEARNER-profile-misc-22 merges college department program and class announcements safely | Existing source acceptance row found |
| `LEARNER-profile-misc-24` | `tests/unit/chat6-learner-calendar-round3.test.ts` — LEARNER-profile-misc-24 restores the today next and all courses schedule labels | Existing source acceptance row found |
| `LEARNER-profile-misc-25` | `tests/unit/chat6-learner-calendar-round3.test.ts` — LEARNER-profile-misc-25 renders the legacy partial calendar failure with Retry | Existing source acceptance row found |
| `LEARNER-profile-misc-26` | `tests/unit/chat6-learner-profile-round2-verified.test.ts` — LEARNER-profile-misc-26 shows total attendance and accurate marked-session explanation | Existing source acceptance row found |

## College placements

| Gap ID | Existing test case verified in source | Acceptance |
|---|---|---|
| `COL-placements-07` | `tests/unit/chat6-college-placements-read-parity.test.ts` — COL-placements-07 College pipeline table exposes legacy email college source applied date age and match score | Existing source acceptance row found |
| `COL-placements-08` | `tests/unit/chat6-college-placements-read-parity.test.ts` — COL-placements-08 College drive table has legacy columns mobile cards bulk lifecycle and row actions | Existing source acceptance row found |
| `COL-placements-09` | `tests/unit/chat6-college-placements-read-parity.test.ts` — COL-placements-09 College Admin can duplicate a drive or extend the published application deadline | Existing source acceptance row found |
| `COL-placements-21` | `tests/unit/chat6-college-placements-read-parity.test.ts` — COL-placements-21 College drive overview shows pipeline stages attention badges and deep links | Existing source acceptance row found |
| `COL-placements-11` | `tests/unit/chat6-college-placements-round2-verified.test.ts` — COL-placements-11 retention report and college student placement lookup are accessible | Existing source acceptance row found |
| `COL-placements-13` | `tests/unit/chat6-college-placements-round2-verified.test.ts` — COL-placements-13 drive settings support draft edit reopen and impact-preview archive | Existing source acceptance row found |
| `COL-placements-17` | `tests/unit/chat6-college-placements-round2-verified.test.ts` — COL-placements-17 analytics provide department program batch date funnel company and export | Existing source acceptance row found |
| `COL-placements-18` | `tests/unit/chat6-college-placements-round2-verified.test.ts` — COL-placements-18 College report navigation never links to TPO-only reports | Existing source acceptance row found |
| `COL-placements-19` | `tests/unit/chat6-college-placements-round2-verified.test.ts` — COL-placements-19 interview directory has filters summary ics and outcome controls | Existing source acceptance row found |
| `COL-placements-05` | `tests/unit/chat6-college-placement-verified-pipeline.test.ts` — COL-placements-05 scopes applicant filters by source academic department program batch and stage | Existing source acceptance row found |
| `COL-placements-06` | `tests/unit/chat6-college-placement-verified-pipeline.test.ts` — COL-placements-06 caps all-matching selection and reports per-candidate failures | Existing source acceptance row found |
| `COL-placements-20` | `tests/unit/chat6-cross-page-verification-round4.test.ts` — COL-placements-20 provides drive-scoped interview scheduling, statuses and calendar download | Existing source acceptance row found |

## Tracker logs

| Gap ID | Existing test case verified in source | Acceptance |
|---|---|---|
| `SA-placements-projects-109` | `tests/unit/chat16-mentor-tracker-contract-round2.test.ts` — SA-placements-projects-109 fetches scoped redacted warnings around the reported timestamp | Existing source acceptance row found |
| `SA-placements-projects-114` | `tests/unit/chat16-mentor-tracker-contract-round2.test.ts` — SA-placements-projects-114 offers safe log permalink, copy and report entry points | Existing source acceptance row found |
| `SA-placements-projects-117` | `tests/unit/chat16-mentor-tracker-contract-round2.test.ts` — SA-placements-projects-117 downloads redacted logs and produces Claude report without hidden raw stack | Existing source acceptance row found |

## Additional authored work in this round

- `SA-academics-people-101`: the tab now renders a selected-college teaching assignment form based on active delivery and faculty pickers, using same-origin POST and existing audited mutation service. Remains OPEN because edit parity is not yet complete. Named tests: `tests/unit/chat6-superadmin-faculty-assignment-create-101.test.ts`.
- `SA-placements-projects-115`: Known Errors adds a read-only aggregate SQL clipboard query restricted to a validated 64-hex hash and safe environment. Its broader create-and-link issue parity remains OPEN. Named tests: `tests/unit/chat6-safe-known-error-sql-115.test.ts`.
- The existing 18 UNCONFIRMED chat-6 decisions were re-inspected at `docs/audit/acceptance/chat-6-unconfirmed-decisions.md` and `tests/unit/chat6-unconfirmed-decisions-round13.test.ts`; no new owner clarification needed.
- The stale October 17 typecheck and failure reports were read: the five SA authoring `points` fixtures, zero-point model/SQL, recruiter heading, and active Super Admin Audit Findings guard already appear on main. This is **not** evidence of a current passing run.
