# Learner Family Verification Record

> This is the freshness/evidence gate above `learner-ui-surface-ledger.md`.
>
> Surface rows may preserve historical `CLOSED` evidence, but Learner cannot be declared release-ready until every family below is `VERIFIED` against the final frozen oracle.

## Status vocabulary

- `UNVERIFIED` — family has never completed the full evidence gate.
- `IN_PROGRESS` — current parity audit/fix is underway.
- `VERIFIED` — exact FE/BE oracle SHAs, source/test/browser/cross-role evidence recorded and no unresolved required delta remains.
- `STALE` — previously audited evidence predates material legacy drift and must be rechecked.
- `BLOCKED` — required external/browser/storage/CI/cross-role dependency prevents verification.

## Current oracle observation

- Legacy FE current head: `1d563f75f10ede5dcc0a7b17ad65b75ea03dd07d`
- Legacy BE current head: `94af997f8f9529ffbe7da317fff47f86c16bcebf`
- vNext head when this evidence gate was introduced: `db6f3c0db7ae4d2402211b1a65650de499b97c69`
- Prior Learner ledger oracle: FE `38cdd38e592a6f416c8e8e99ce36438f548ed577`, BE `36f93fc49dc93bfc8ad9f499a1247fbf7f98a1a9`

Because the oracle moved materially, every family starts `STALE` here even if some individual surface rows are historically `CLOSED`.

## Verification table

| Family | Scope | Status | Verified FE SHA | Verified BE SHA | vNext SHA | Source audit | Tests executed | Browser desktop | Browser mobile | Producer→consumer | Exceptions/notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L0 | Shell/navigation | STALE | — | — | `eff3d00c251a1db265b9212f6b6b3aa04963306a` | prior implementation remains FIXED, but the legacy oracle moved again and this family was not re-audited in the current batch | prior unit coverage exists; CI runner remains unavailable | pending | pending | owning TPO/admin producer UIs remain for their parity families | Recheck current FE/BE oracle before restoring IN_PROGRESS/VERIFIED |
| L1 | Courses list | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L2 | Course detail/Overview | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L3 | Learning Path | IN_PROGRESS | `1d563f75f10ede5dcc0a7b17ad65b75ea03dd07d` | `94af997f8f9529ffbe7da317fff47f86c16bcebf` | current learner parity batch | current syllabus roadmap helpers plus learner progress/content services inspected; current/progress/type-count/deadline/watched cues cloned | focused unit coverage authored; CI execution unavailable | pending | pending | faculty authoring/storage producer paths still own file-backed items | L3-033..036 fixed; exact viewer/drawer parity plus storage/browser/mobile evidence remain open |
| L4 | Course Attendance | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L5 | Course Discussions | IN_PROGRESS | `1d563f75f10ede5dcc0a7b17ad65b75ea03dd07d` | `94af997f8f9529ffbe7da317fff47f86c16bcebf` | current learner parity batch | current Classroom feed/polling/grouping/pin/composer behavior inspected and cloned | grouping/day-boundary/unseen-count unit coverage authored; CI execution unavailable | pending | pending | N/A for learner-only presentation deltas | L5-013..017 fixed; responsive browser evidence remains open |
| L6 | All Assignments | IN_PROGRESS | `1d563f75f10ede5dcc0a7b17ad65b75ea03dd07d` | `94af997f8f9529ffbe7da317fff47f86c16bcebf` | current learner parity batch | current AssignmentsContent + ViewAssignmentModal inspected; aggregate drawer/read/submit parity implemented for text/link | source parity regression coverage authored; CI execution unavailable | pending | pending | Faculty assignment producer exists; file-backed submission waits on shared storage | Drawer fixed; file upload and mobile/browser evidence remain open |
| L7 | All Quizzes | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L8 | Standalone Quiz | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L9 | Class Schedule | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L10 | Attendance summary | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L11 | Placements Dashboard | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L12 | Drives/Jobs | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L13 | Job Detail | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L14 | Applications | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L15 | Placement Assessments | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L16 | Interviews | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L17 | Career Calendar | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L18 | Placement Cell | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L19 | Placement Rules | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L20 | Projects list | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L21 | Project detail shell | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L22 | Project Overview | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L23 | People & Meetings | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L24 | Releases & Sprints | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L25 | Board/Tasks | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L26 | Project Resources | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L27 | Project Activity | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L28 | Final Delivery | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L29 | Notifications | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L30 | Profile | IN_PROGRESS | `1d563f75f10ede5dcc0a7b17ad65b75ea03dd07d` | `94af997f8f9529ffbe7da317fff47f86c16bcebf` | current learner parity batch | current learner Profile, removed-section regression, ProfileVerificationCard and backend verification state machine inspected | profile source-parity regression updated; CI execution unavailable | pending | pending | verifier UI + secure private-doc producer/storage flows remain in admin/TPO/storage work | obsolete self-profile placement cards removed; verification/storage/browser work remains |
| L31 | Conditional Drive Day | STALE | — | — | `eff3d00c251a1db265b9212f6b6b3aa04963306a` | prior implementation remains FIXED, but the legacy oracle moved again and this family was not re-audited in the current batch | prior shell/date unit coverage exists; CI runner remains unavailable | pending | pending | exact TPO Settings Team producer UI remains in TPO parity | Recheck current FE/BE oracle before restoring IN_PROGRESS/VERIFIED |

## Evidence required to change STALE/UNVERIFIED → VERIFIED

For a family row, replace the placeholders with concrete evidence:

- exact legacy FE/BE SHAs used;
- exact vNext SHA;
- legacy route/component/backend/test files inspected;
- test command/run result that actually executed;
- desktop browser result;
- mobile browser result;
- producer→consumer workflow result or explicit N/A with reason;
- any approved exception.

If any required evidence is unavailable, use `BLOCKED`, not `VERIFIED`.
