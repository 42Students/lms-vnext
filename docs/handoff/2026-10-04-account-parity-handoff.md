# LMS vNext — Account Parity Continuation Handoff

**Date:** 2026-10-04  
**Repository:** `42Students/lms-vnext`  
**Branch:** `main`  
**Pre-parity baseline:** `ce564b60dac0c2db6a7bb7698257285e1664c0d1`  
**Legacy UI baseline:** `42Students/lms2-fe@prod-2026` @ `38cdd38e592a6f416c8e8e99ce36438f548ed577`

## Locked product decision

Use **clone-first, redesign-later** for Learner, Faculty, Mentor, College Admin, Super Admin, TPO and HR/Recruiter.

Recreate every meaningful legacy page, tab, section, action, modal and workflow, but implement with the vNext architecture. Nothing disappears silently.

Surface/status tracker: `docs/planning/account-surface-parity.md`.
Mechanical route backstop: `docs/planning/legacy-ui-route-manifest.md`.
Detailed per-page index: `docs/parity/README.md`.
Counters:
- `npm run parity:status` — 323-row master surface matrix
- `npm run parity:pages` — granular page/section/action/modal/state checklists

**Route audit result:** 210 candidate real account/shared/public/ops/error routes checked against matrix v2; **0 unmatched** at the frozen legacy SHA.

**Detailed page-audit baseline:** the eight files under `docs/parity/` contain **1,517 detailed closure checks** at initial creation: 9 explicitly checked (primarily proven retired redirects plus the already-fixed late-assignment rule) and 1,508 deliberately open pending exact vNext-vs-legacy verification. **This is an audit workload count, not an estimate that the LMS is only 0.59% implemented.** Existing vNext workspaces may satisfy many checks once each is verified.

**2026-10-04 deep audit:** matrix v1 was not exhaustive. Matrix v2 now explicitly includes hidden TPO Companies/Profile/More, public recruiter/company-share/auth/AI-grading flows, operational tracker surfaces, redirects/artifacts, specialized notification behavior, and decomposed TPO/HR/Super-Admin/Project sub-workflows. Do not work from an older matrix copy.

## Continuation order

Learner → Faculty → Mentor → College Admin → Super Admin → TPO → HR/Recruiter → shared Identity/Storage blockers → final fresh legacy diff → browser regression sweep → UI/UX redesign.

## Every future chat must

- fetch latest `lms-vnext/main` and `lms2-fe/prod-2026`;
- preserve parallel work; never force-push;
- read AGENTS, master plan, execution checklist, account parity matrix, legacy route manifest, `docs/parity/README.md` and the active account's detailed page spec;
- start at the first unresolved detailed page/workflow check for the active account, using the master row as the high-level status;
- inspect the exact legacy route **and its supporting component(s)** before implementing it;
- update the parity matrix and detailed page spec in the same commit;
- keep tenant authorization centralized;
- never call authored tests “green” unless CI actually executes them.

## Current CI boundary

Recent CI runs fail before any job steps start (no runner/steps). This is a verification blocker, not a reason to stop non-cloud parity implementation.

## Audit corrections that future chats must preserve

- Mentor Courses/Contacts/Quizzes/File Explorer/Profile are legacy redirect stubs, not missing product pages.
- Faculty File Explorer is a legacy redirect stub.
- HR `/hr/colleges` is a retired redirect; college choosing happens on HR Home.
- TPO Companies, TPO Profile and TPO More are real surfaces and are now tracked.
- Shared Notifications does not automatically close role-specific notification parity.
- TPO Settings has ten tracked sections; TPO Reports has ten named report types.
- TPO and HR drive details are tracked tab/action-by-tab/action.
- Super Admin Tenant Setup/Settings/Module Access/HR Accounts and Admin Project workspaces are decomposed explicitly.
- Public/shared surfaces such as `/hr-invite`, `/company-share`, `/auth/handoff`, `/ai-grading`, tracker, marketing/legal and error pages cannot disappear silently.

## Immediate implementation sequence

Start Learner with `docs/parity/learner.md` as the closure contract:
1. Class Schedule — close its schedule source, filters/navigation, session detail, loading/empty/error, timezone, authorization and mobile checks.
2. Learner self Profile — use the explicit profile section/upload/edit checklist; do not treat a basic identity form as profile parity.
3. Finish Attendance/Course Attendance browser/CI verification; implementation and reusable attendance foundation are committed.
4. Course Discussions.
5. Placement subpages + Career Calendar, including their documented modals/drawers/filters/actions.
6. Exact Course and Project section parity.

Closed in Learner parity batch 1:
- Global Assignments
- Global Quizzes
- legacy-compatible late assignment submission behavior

Then move immediately to Faculty.
