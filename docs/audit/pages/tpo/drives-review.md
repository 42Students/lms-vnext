# TPO / Drives: Round R adversarial review

Reviewer: Phase 2 Round R agent, 2026-10-16. Reviewed file: `docs/audit/pages/tpo/drives.md` (Round A, 52 gaps). The independent audit (legacy list, DriveFormPage, JdUpload, CompanyPicker, InviteReviewer, presets, `TpoDriveController`, `TpoDriveService`, `TpoDriveExtrasService`, `TpoApplicantService.remindNotApplied`, `TpoWorkspaceController.clone`; vNext `/tpo/placements`, `/lifecycle`, `/new`, `/new/draft`, `/jobs/[jobId]/edit`, `job-service`, `tpo-drive-lifecycle-*`) was done before the Round A file was opened. Legacy = `_hr-tpo-fe` / `42LMS-BACKEND\lms` at lms-dev-2026; vNext = origin/main working tree.

## 1. Summary

Round A gaps: 52. CONFIRMED 50, WRONG 1 (-03), SEVERITY-CHANGE 1 (-15). MISSED 6 (TPO-drives-R01 to R06).
Discrepancy rate = (6 MISSED + 1 WRONG + 1 SEVERITY-CHANGE) / (52 + 6) = 8 / 58 = 13.8%.

Verdict on the audit: very strong on the legacy list and the form fields. Its main factual error is about where cancelled drives go (see -03), which also makes its "intentional difference 7" wrong. Its main blind spot is that vNext has two publish paths with different rules, and the create form uses the weaker one.

My own independent list (temporary IDs R-1 to R-42) overlapped Round A on every column, filter, action, form field and the missing side effects; only the six rows below were not in Round A.

## 2. Round A gaps: verdicts

| Round A gap ID | Verdict | Note |
|---|---|---|
| TPO-drives-01 | CONFIRMED | Sidebar `Drives` -> `/tpo/placements` (`shell-model.ts:191`); list is only at `/lifecycle`, reached from a header button. |
| TPO-drives-02 | CONFIRMED | `lifecycle/page.tsx` says requests are not included; `requestsAvailable:false`. |
| TPO-drives-03 | WRONG | See section 4. The live TPO cancel flow stores `CLOSED`, so cancelled drives are in the Closed view and counts. Real residue is R04. |
| TPO-drives-04 | CONFIRMED | |
| TPO-drives-05 | CONFIRMED | |
| TPO-drives-06 | CONFIRMED | |
| TPO-drives-07 | CONFIRMED | |
| TPO-drives-08 | CONFIRMED | |
| TPO-drives-09 | CONFIRMED | `lifecycle/page.tsx` prints `{job.status} · {job.employmentType} · {job.workMode}` raw. |
| TPO-drives-10 | CONFIRMED | |
| TPO-drives-11 | CONFIRMED | |
| TPO-drives-12 | CONFIRMED | |
| TPO-drives-13 | CONFIRMED | `tpo/bulk-actions/*` accepts only STUDENTS / APPLICATIONS targets (`tpo-bulk-workflow-model.ts:16-22`). |
| TPO-drives-14 | CONFIRMED | No remind route under `src/app/api/placements`; only batch reminder prep and learner assessment reminders exist. Legacy rules also include a 20-hour once-a-day limit and refusal after the deadline (`TpoApplicantService.remindNotApplied:117-132`); the gap row mentions the daily rule, not the refusal text "The deadline has passed, so they can no longer apply. Extend it first.". |
| TPO-drives-15 | SEVERITY-CHANGE | S3 -> S2. See section 4. |
| TPO-drives-16 | CONFIRMED | Cascade on close is owned by the drive-workspace audit; confirmed vNext `closePlacementJob` and `changeTpoDriveLifecycle` CLOSE only change status and withdraw ISSUED offers (`job-service.ts:535-570`, `tpo-drive-lifecycle-service.ts:162-170`), they do not end open applications or notify. Make sure that audit carries it as S1/S2. |
| TPO-drives-17 | CONFIRMED | |
| TPO-drives-18 | CONFIRMED | |
| TPO-drives-19 | CONFIRMED | `EmptyState` on the lifecycle page has no action. |
| TPO-drives-20 | CONFIRMED | |
| TPO-drives-21 | CONFIRMED | |
| TPO-drives-22 | CONFIRMED | |
| TPO-drives-23 | CONFIRMED | |
| TPO-drives-24 | CONFIRMED | `requestJson` title-cases `error.code`; `apiErrorResponse` returns only the code (`lib/api-error.ts:32-44`). |
| TPO-drives-25 | CONFIRMED | |
| TPO-drives-26 | CONFIRMED | No clone route. |
| TPO-drives-27 | CONFIRMED | |
| TPO-drives-28 | CONFIRMED | Still UNCONFIRMED (placed counting by custom job type). |
| TPO-drives-29 | CONFIRMED | |
| TPO-drives-30 | CONFIRMED | |
| TPO-drives-31 | CONFIRMED | |
| TPO-drives-32 | CONFIRMED | |
| TPO-drives-33 | CONFIRMED | No Dream / Super-dream anywhere in `src`. |
| TPO-drives-34 | CONFIRMED | Stays UNCONFIRMED for the workspace. |
| TPO-drives-35 | CONFIRMED | No `gender` in `modules/placements`. |
| TPO-drives-36 | CONFIRMED | |
| TPO-drives-37 | CONFIRMED | |
| TPO-drives-38 | CONFIRMED | No wanted-skills field in `src`. |
| TPO-drives-39 | CONFIRMED | |
| TPO-drives-40 | CONFIRMED | Only per-student eligibility (`jobs/[jobId]/eligibility/[membershipId]`) exists; no aggregate Eligible / Excluded / kept-out-by counts for a job. |
| TPO-drives-41 | CONFIRMED | |
| TPO-drives-42 | CONFIRMED | Correct, but see R01/R03: the problem is wider than missing form checks. |
| TPO-drives-43 | CONFIRMED | |
| TPO-drives-44 | CONFIRMED | See R05 for the worse case (`INVALID_REQUEST`). |
| TPO-drives-45 | CONFIRMED | |
| TPO-drives-46 | CONFIRMED | Still S1 and still UNCONFIRMED end to end; no enqueue in `job-service.ts`, `tpo-drive-lifecycle-service.ts`, `tpo-drive-deadline-service.ts`, `tpo-drive-cancel-service.ts`. Same absence applies to extend-deadline, cancel and close (legacy enqueues `DRIVE_CANCELLED`, `DRIVE_CLOSED`). |
| TPO-drives-47 | CONFIRMED | |
| TPO-drives-48 | CONFIRMED | |
| TPO-drives-49 | CONFIRMED | |
| TPO-drives-50 | CONFIRMED | |
| TPO-drives-51 | CONFIRMED | Legacy `DriveCtl:21-24` comment: college admin holds ROLE_ADMIN and works without a TPO account. |
| TPO-drives-52 | CONFIRMED | |

## 3. MISSED gaps

| ID | Gap | Type | Severity | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| TPO-drives-R01 | vNext has two publish paths with different rules, and the create form uses the weaker one. `Create & publish` (and `college-legacy-drive-settings`) call `POST /api/placements/jobs/{id}/status {PUBLISH}` which checks only season, DRAFT, active company, external URL and one role option. The TPO drive workspace uses `POST .../tpo-lifecycle`, which also blocks on `NO_EVALUATIVE_ROUND`, `ELIGIBILITY_POLICY_NOT_PERSISTED`, `APPLICATION_DEADLINE_PASSED` and needs a 10+ char reason. A drive created with publish-now therefore skips every readiness check the same TPO would face on the workspace. Conversely the workspace path is stricter than legacy (legacy treats "no rounds" and "no eligibility rules" as warnings, not blockers), and it prints blockers as raw codes (`PUBLISH blockers: NO_EVALUATIVE_ROUND, STALE_JOB_STATUS`). Neither path requires pay, job type or a deadline (`deadlineValid` is true when the deadline is null). | VALIDATION | S2 | `DriveSvc:741-766` (`publishBlockers`: job type, pay, deadline present and future, off-campus link; one list for client and server); `publishPreflight.js:14-52` (rounds / eligibility are warnings) | `job-service.ts:394-450`; `tpo-drive-lifecycle-model.ts:29-43`; `tpo-drive-lifecycle-service.ts:103`; `tpo-drive-lifecycle-controls.tsx:91-94`; `placement-job-create-form.tsx:398-405`; `placement-drive-workspace.tsx:508-515` |
| TPO-drives-R02 | `Create & publish` makes the drive live with no confirmation, no "who is told / how many reached" step and no email-or-not choice. Legacy never publishes from the form: `Publish` validates then goes to the drive page publish window (`?publish=1`) which confirms, and the API takes `notifyByEmail`; the audit line records "students emailed" or "no email sent". vNext publish-now is one ticked box and one click. | STATE | S2 | `form:437-466`; `DriveCtl:128-134` | `placement-job-create-form.tsx:398-405,950-973` |
| TPO-drives-R03 | Publish preflight warnings are absent: "No interview rounds added yet" and "No eligibility rules set - every registered student will see this drive" (shown but not blocking). On vNext an empty program/cohort/threshold set silently means every student. | VALIDATION | S3 | `publishPreflight.js:43-50` | `placement-job-create-form.tsx` (no warning); `job-service.ts:394-450` |
| TPO-drives-R04 | Consequence of the -03 correction: a cancelled drive and a closed drive are indistinguishable on the list, which shows only the raw `CLOSED`. No `Cancelled` tag, no cancellation reason, no "Declined" for recruiter requests. Legacy shows distinct tags (Closed / Cancelled red / Declined) and the reason in the drive page. | MISSING-COLUMN | S3 | `list:44` (`STATUS_TAG`), `DriveSvc:631-641` (`setCancelledReason`) | `tpo-drive-cancel-service.ts:165` (writes `CLOSED`); `lifecycle/page.tsx:97` |
| TPO-drives-R05 | Validation feedback in the create form: when the request fails Zod validation (min greater than max CTC, bad URL, openings out of range, non-numeric passing year) the API returns `INVALID_REQUEST` and the toast reads "Could not create opportunity / Invalid Request", with no field named. Number inputs have no `max` (CGPA above 10, percentages above 100 are typed and only rejected on the server, legacy inputs have `max={10}` / `max={100}`). Bounds also differ: role title 2-200 (legacy 3-100 with "At least 3 characters"), description required (legacy optional, sanitised rich text up to 15,000). | VALIDATION | S3 | `form:586-587,677-685`; `DriveSvc:152-174,361-367` | `lib/api-error.ts:23-30`; `placement-job-create-form.tsx:55-85,866-925`; `validation.ts:291-292` |
| TPO-drives-R06 | The lifecycle list (the only real list) has no create entry point at all: no `Create drive` button and no CTA in the empty state; the only create links are on `/tpo/placements` (`New opportunity`), the top-bar `Drive` quick link. Round A -19/-21 cover the empty-state CTA and button wording only on the assumption the button exists. | MISSING-ACTION | S3 | `list:383-388,453-456` | `lifecycle/page.tsx:28-34,78-82` |

## 4. WRONG and SEVERITY-CHANGE details

### TPO-drives-03: WRONG
Round A says CANCELLED drives are excluded from the Closed view and from the four count cards, visible only under `All jobs`, and intentional difference 7 says "Cancelled is a real stored state on the job table". The `placement_jobs_status_ck` constraint does allow `CANCELLED` (`src/db/schema/placements.ts:522`), but the TPO cancel flow writes `status: "CLOSED"` (`src/modules/placements/tpo-drive-cancel-service.ts:165`, with the comment at L186-188 that `CANCELLED` job status needs a separate migration). The only function that writes `CANCELLED` is `cancelPlacementJob` (`job-service.ts:639-651`) and nothing in `src` calls it. So in practice cancelled drives are counted and listed as Closed. The still-valid part is "Declined (REJECTED) has no state" (true, requests are not drives) and the display issue now logged as R04. Change the intentional-difference text accordingly.

### TPO-drives-15: SEVERITY-CHANGE S3 -> S2
Taken together with -42, vNext can publish a drive with no deadline (`deadlineValid` is `true` for a null deadline, `tpo-drive-lifecycle-service.ts:103`; `publishPlacementJob` has no deadline check), and `extendable` is false when the deadline is null (`tpo-drive-deadline-service.ts:23`) and the edit form does not take a deadline. A live drive with no deadline can therefore never be given one, whereas legacy has the explicit `Live with no deadline` work link and `Set or extend the deadline` for exactly that case (`list:121,252-262`). That is a stuck workflow, not a convenience.

## 5. UNCONFIRMED items and how to confirm (for the live check on the deployed dev site)

1. Publish notifications (-46): publish a seeded drive from `/tpo/placements/jobs/{id}` as TPO, then read the learner notification list and outbox/log for that learner; repeat for extend-deadline, close and cancel.
2. R01: create a drive with `Create & publish` and no deadline, no rounds and no eligibility rules; expect it to go live. Then on a second DRAFT with no rounds open the workspace and expect `PUBLISH blockers: NO_EVALUATIVE_ROUND` in raw code form.
3. R05: create with maximum CTC below minimum; capture the toast text. Type CGPA 11 and read the server response.
4. -03 / R04: cancel a seeded published drive from `cancel-preview`; check the lifecycle `Closed` count and the row text; query `placement_jobs.status` for the row (expect `CLOSED`). Also check whether any row with `CANCELLED` exists on dev.
5. Open drive close cascade (-16): close a drive that has APPLIED applicants; check whether applications change and students are told (belongs to the drive-workspace audit; record result there).
6. -28 placed counting: check whether any offer or placement metric reads a college job type; create an Internship drive and make an offer.
7. -34 batch targeting on the workspace: open a DRAFT drive workspace and look for batch/branch controls.
8. -51 college admin access: sign in as a college admin without a TPO membership and request `/tpo/placements` and `/tpo/placements/lifecycle`.
9. Whether `POST /api/placements/jobs` writes an audit entry visible in `/tpo/audit` (Round A says a "draft created" activity event exists; the Audit log display of it was not checked).

## 6. Notes for the owner (no gap row)

- vNext `REOPEN` of a closed drive exists in `tpo-drive-lifecycle-model.ts` while legacy says closing "cannot be undone" and sends users to clone. Treat as an improvement; confirm intent.
- vNext requires a 10+ character reason for publish, close, reopen, extend and edit; legacy asks for none on publish and extend. Extra audit friction, deliberate, but it affects wording parity.
- Delete draft is not a gap: `archivePlacementJob` (`job-service.ts:650-700`) with an Archive button in `placement-job-lifecycle-controls.tsx:129-150` replaces legacy `DELETE /tpo/drives/{id}` (legacy also refuses when applicants exist; vNext archives any non-published job).
