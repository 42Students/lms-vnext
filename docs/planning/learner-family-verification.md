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

- Legacy FE current head: `008d113ddd9f515df65ae7fe90dba360938314f6`
- Legacy BE current head: `ed1377b744088f2ec759895658105c494337ba30`
- vNext head when this evidence gate was introduced: `db6f3c0db7ae4d2402211b1a65650de499b97c69`
- Prior Learner ledger oracle: FE `38cdd38e592a6f416c8e8e99ce36438f548ed577`, BE `36f93fc49dc93bfc8ad9f499a1247fbf7f98a1a9`

Because the oracle moved materially, every family starts `STALE` here even if some individual surface rows are historically `CLOSED`.

## Verification table

| Family | Scope | Status | Verified FE SHA | Verified BE SHA | vNext SHA | Source audit | Tests executed | Browser desktop | Browser mobile | Producer→consumer | Exceptions/notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L0 | Shell/navigation | IN_PROGRESS | `008d113ddd9f515df65ae7fe90dba360938314f6` | `ed1377b744088f2ec759895658105c494337ba30` | current implementation commit | Sidebar, feature hook/filter, FeatureFlagController, ModuleAccessResolver, PlacementEligibilityService, TpoTeamService and Drive Day controller/service inspected | unit coverage authored; CI runner unavailable | pending | pending | backend producer contracts present; exact owning TPO/admin producer UIs remain for their parity families | L0-011 through L0-013 fixed; desktop/mobile browser evidence still required before VERIFIED |
| L1 | Courses list | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L2 | Course detail/Overview | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L3 | Learning Path | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L4 | Course Attendance | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L5 | Course Discussions | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L6 | All Assignments | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
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
| L30 | Profile | STALE | — | — | — | pending | pending | pending | pending | pending | Reverify against current/final oracle |
| L31 | Conditional Drive Day | IN_PROGRESS | `008d113ddd9f515df65ae7fe90dba360938314f6` | `ed1377b744088f2ec759895658105c494337ba30` | current implementation commit | Sidebar, `getDriveDayMine`, TpoTeamService coordinator rules, Drive Day landing/roster and attendance restrictions inspected | shell/date unit coverage authored; CI runner unavailable | pending | pending | coordinator assignment APIs/domain implemented; exact TPO Settings Team producer UI remains in TPO parity | L31-001..006 implementation fixed; browser/mobile + producer UI evidence required before VERIFIED |

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
