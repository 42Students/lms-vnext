# 42LMS — adversarial legacy development UI-surface discovery (source pass)

**Observed 27 October 2026.** This is **source audit evidence**, not a second active tracker, not an exhaustive screen count, and **not** a release/green decision. The official project tracker remains `docs/tracker.json`; the detailed UI contracts remain `docs/parity/`.

## Verdict

**The historic 258 closure units are NOT an exhaustive LMS UI surface inventory.** They were derived from Markdown headings, not from legacy reachable component/action/state graphs. They MUST NOT be used as a final UI denominator or as evidence that hidden modals/drawers are covered.

Snapshots reviewed:
- Earlier frontend source census: `42Students/lms2-fe@c8b2a5e6779cdab58fdc0f1164f42440786a4154`
- Newer legacy development frontend: `42Students/lms2-fe@104c1a254032f9041187caf8ebd6c033221079da`
- Earlier backend controller census: `42Students/lms@4ef67db8f198205f11e1e6ca12718c38400dc7ca`
- Newer backend development source: `42Students/lms@ecb09416b107e82e5ac7d22f3bc94a85258754b`
- vNext source mapping sampled at `42Students/lms-vnext@15c52b3f445cd18a8b50acc6baf4a0fefe9ce4b2`

### What is actually counted

The frozen tree has 313 legacy frontend route-source files, across seven core accounts (266) plus shared/public/internal source artifacts (47), and 592 vNext page-route source files. The old frontend component/common/layout source census contains **491 source files**, including non-user-facing utilities and tests. The first-pass inspection records cover all 313 route files, **43 named overlay-file candidates**, another 28 deep/component samples, and **116 of 151 candidate backend controller source files**. These are different types of units and MUST NOT be added together into a "total screens" number.

The component samples overlap: 71 unique inspected component paths are present in the 43+28 historic inspection records, but one historic component path (`src/components/tpo/RecruiterSidePanel.jsx`) is absent from the baseline source tree. Therefore there are 421 frozen component/common/layout files without a matching component-level inspection record. This is a **source-investigation pool**, not 421 confirmed missing user-facing interfaces. Reconcile imports and remove tests/nonreachable helpers before generating any final UI denominator. See `node scripts/audit/legacy-census-status.mjs --json`.

## Confirmed complex families — inspect every child, not just its route

| Family | Confirmed reachable/delegated sub-surfaces and source evidence | vNext entrypoint(s) to compare | Mandatory next verification |
|---|---|---|---|
| **TPO drive detail** | Legacy `src/pages/tpo/drives/[jobId].js`, 530 lines, `TAB_KEYS = [applicants, rounds, offers, discussion, about]`; tab aliases; four `AsyncModal` uses; three `Modal.confirm` calls; `StudentPanel` drawer; imports `DriveRequestReview`, `DriveTalk`, and the tab implementations. | `src/app/(authenticated)/tpo/placements/jobs/[jobId]/page.tsx`, `layout.tsx`, sibling `applicants-pipeline`, `rounds`, `offers`, `discussion`, `about` and other detail routes. `/tpo/placements/jobs/[jobId]/applicants` redirects to the pipeline, not a blank/missing UI. | Map tab/deep-link aliases, each modal launch and close/dirty guard, branch for TPO-only/college context, destructive controls, messages, and source/API producer→consumer effects. |
| **TPO Applicants** | `src/components/tpo/drive/ApplicantsTab.js`: review/table/board views; modal-confirm flows including reminder nonapplicants; reason, message and note forms; imported `ShareModal`, `ApplicantsBoard`, `DriveStudents`, `BulkAction`, `ActionsWindow`, `TpoDataTable`. | `applicants-pipeline`, `applicants/[applicationId]`, `applications-export` plus UI under `src/components/tpo` and `src/components/placements`. | Verify all three layouts and actual bulk/message/share effects; denial, filtered-empty, stale state and return navigation. |
| **TPO Rounds** | `src/components/tpo/drive/RoundsTab.js`: add/edit modal (~line 344), apply-and-notify results modal (~392), delete confirmation (~291), multiple imported results, schedule, import and detail panels. | `.../rounds`, `.../rounds/[roundId]/results`, `.../rounds/[roundId]/slots`, `.../interview-slots`; vNext `tpo-drive-rounds-prototype-review.tsx` is only a component, not proof of all behaviors. | Trace round lifecycle, affected applicants, scheduling, apply-and-notify, cancellation, conflict/idempotency and history. |
| **TPO Offers** | `src/components/tpo/drive/OffersTab.js`: "Record a selection" modal (~366), "Import the company's selection list" (~421), "Attach the offer letter" (~433), release confirmation (~312), verify-all and other confirm paths; private upload. | `.../offers`, `.../letters`, `.../selections`, `.../joining`, plus download/storage components. | Prove LOI/offer lifecycle and recipient state, private letter grant, upload failures, release idempotency and cross-role visibility. |
| **TPO Discussion/requests** | `DriveTalk.jsx` composes `DiscussionTab.jsx`, `ChangeRequests.jsx`, `InviteReviewer.jsx`; reviewer invitation has a modal/work-email form. `DriveRequestReview.jsx` imports `VerifyCompanyWindow`. | `.../discussion`, `.../change-requests`, `.../share-preview`, `.../share-audit`. | Validate company-side messages, review invitations, change request approvals, tokens, trusted-company rules, and notification side effects. |
| **Recruiter drive detail** | `src/pages/recruiter/drives/[jobId].js`, 978 lines at newer dev SHA; five tabs (overview, applicants, rounds, offers, messages), "Which round are these decisions for?" modal, add/edit-round modal, several confirmation actions, slot-proposal form and selection/offer forms. | `src/app/(authenticated)/recruiter/drives/[jobId]/page.tsx` reexports `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx` (1,170 lines); review nested `recruiter-applicant-review-drawer`, `recruiter-round-inline-editor`, selection composer and HR grids. | Verify private notes, recruiter-vs-TPO decisions, interview slot workflow, selection list/LOI, per-college authorization and no duplicate sends. |
| **Mentor project detail** | `src/components/Projects/ProjectDetailContent.jsx`, **10,851 lines** at source SHA `15ea2217e2f1cb37e4d22f98d2ef45573493fc68`: 16 modal-shell JSX instances, 2 filter drawers, 19 Popconfirm instances, 145 direct event props; release/sprint details, task changes, meeting request/cancel, submission decision dialogs. The tiny legacy route file hides almost all of this. | `src/app/(authenticated)/mentor/projects/[projectId]/page.tsx` and `src/components/projects/project-workspace.tsx`; many dedicated mentor child routes for feedback, review, resources, history and meetings. | Enumerate each modal *instance* by triggering action and state; separate project tabs/producer dependencies; actual browser and DB evidence is mandatory before green. |
| **Faculty course Blueprint** | Legacy `src/pages/Dashboard/course/syllabus/syllabus.js`, 1,243 lines; `AddNewLessonContentDrawer`, `DrawerAssignment`, `QuizBuilderModal`, assignment viewer/modal, dropdown, lesson/video/resource/live-class editors. | `src/components/courses/faculty-course-workspace.tsx` and `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx`; vNext authoring subcomponents. | Distinguish upload, video, quiz, assignment draft/published/read-only/permission states and verify editor save/cancel/destructive flows. |
| **College Admin workspace Summary** | `src/pages/college-admin/projects/workspaces/[workspaceId]/summary.js`, 738 lines; archive/delete confirmations, change-template modal, workspace settings form and unsaved edits. | `src/app/(authenticated)/admin/projects/workspaces/[workspaceId]/summary/page.tsx` redirects to canonical `/admin/projects/[workspaceId]`; route count mismatch does not mean missing capability. | Verify canonical page implements the legacy outcomes, deep links, template change, safeguards, stage lifecycle and cross-role visibility. |
| **Super Admin assignment management** | `src/pages/superadmin/sections/Assignments.js`, 436 lines; grading/edit modal, `SubmissionsDrawer`, `AdminAssignmentBuilderModal`, publish-all and delete confirmations; superadmin `sections` may be compositional pages rather than menu destinations. | Needs direct mapping to the actual canonical vNext Super Admin academic assignment workspace. | Inspect actual parent nav/role guards before counting as a separate route; validate grades/publish/regrade and tenant isolation. |

These rows are **confirmed static source candidates**, not accepted parity matches and not a claim that vNext is missing each feature. Each candidate needs a stable ID and a testable disposition in its existing account's acceptance specification. No P0/P1 or GREEN may be assigned without confirming behavior.

## Freshness finding: existing audit is partially stale

The old dev source scan used FE `c8b2a5e...` / BE `4ef67db...`; subsequently observed dev commits are `104c1a254...` / `ecb09416...`. A precise tree comparison found:
- 7 changed FE route files: `recruiter/calendar.js`, `recruiter/drives/[jobId].js`, `recruiter/drives/new.js`, `tpo/companies.js`, `tpo/recruiters/[recruiterLeadId].js`, `tpo/recruiters/index.js`, `tpo/settings.js`.
- 16 changed FE component file paths (14 overlap frozen 491-file set), mostly TPO/Recruiter, and new company/invite components.
- 24 changed BE Java file paths in placement/recruiter/company/invite workflows.

Do not discard unrelated Faculty/Mentor/College acceptance evidence because TPO or Recruiter changed; however, these changed paths and their transitive dependents require targeted recertification. Full path-level delta: `oracle-drift-2026-10-27.json`.

## Open work before anyone can claim “exhaustive”

1. **Reachability:** graph actual legacy sidebar/header/tab launches; walk every transitively imported component; classify inlined, dynamically imported, shared, conditional and reused overlays. Distinguish dead code from user-reachable UI.
2. **Surface states:** for every reachable overlay, register open/save/cancel/dirty/close/failure/loading/empty/read-only/permission/timing/concurrency variants actually applicable; record tab/query/history semantics.
3. **Backend:** finish the 35 uninspected controller-source candidates, then trace each reachable write to services, persistence, authorization, tenant and side effects. A controller annotation count is not full functional coverage.
4. **vNext:** map each legacy reachable UI instance to actual vNext page/component/route/action (many-to-many permitted), preserve beneficial extras, verify behavior with authorized/denied browser and disposable DB journeys.
5. **Closure:** only after reconciling these sources can we derive the real denominator of required surfaces and prepare immutable acceptance receipts. Keep `docs/tracker.json` the only project phase/task tracker.

### Commands to avoid a misleading audit total

```bash
node scripts/audit/legacy-census-status.mjs --json
node scripts/audit/legacy-census-status.mjs --check
node --test tests/legacy-census-status.test.mjs
# Deliberately fails until static coverage and oracle drift are resolved:
node scripts/audit/legacy-census-status.mjs --assert-exhaustive
```

The static file census passing all checks is **necessary but not sufficient** for full UI-surface parity; visual/browser/UI-state acceptance remains separate.
