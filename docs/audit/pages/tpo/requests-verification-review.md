# TPO / Requests and Verification: Round R review

Reviewer: Claude Sonnet 5.5 (Round R, read-only, independent audit done before opening the Round A file). Date 2026-10-16. Judged against origin/main at `fd8e17ae4` (includes chat-5/chat-9 verification fixes `a02013950`, `265c9614d`, and chat-7 `b262dd795`).

## 1. Summary

Round A gaps 38: CONFIRMED 33, WRONG 3 (19, 20, 31: already closed on current main), SEVERITY-CHANGE 2 (21, 25), MISSED 3 (R01 to R03). Discrepancy rate = (3 + 3 + 2) / (38 + 3) = 8 / 41 = **19.5%**. Round A is accurate on legacy behaviour and on the three request kinds, the drive-request absence and the TPO verification queue limits. Its main weakness is staleness: three Verification rows were fixed by chat-9 between the audit and now. Nothing was run; all claims are from code (UNCONFIRMED items in section 5).

Legacy refs: `FE/` = `42LMS\_hr-tpo-fe\src\` (branch lms-dev-2026), `BE/` = `42LMS\42LMS-BACKEND\lms\src\main\java\com\_42students\lms\`. vNext refs are repo-relative.

## 2. Round A gap verdicts

| Round A gap ID | Verdict | Note |
|---|---|---|
| TPO-requests-verification-01 | CONFIRMED | DB check locks kinds to 3 (`db/schema/placements.ts:1713-1716,1724-1730`, target-shape check too), `application_id` is NOT NULL (`:1648`), and the list inner-joins applications and jobs, so kinds with no drive (registration change, PAP, off-campus offer) cannot even be stored. Extra: `modules/placements/external-offer-service.ts` has submit/review functions but no route, page or component calls them (grep), so off-campus offers are not reachable by either side. |
| TPO-requests-verification-02 | CONFIRMED | `tpo-request-decision-control.tsx:11-33`: `window.prompt` then `window.confirm`, one generic sentence, no toast, one generic failure string. |
| TPO-requests-verification-03 | CONFIRMED | Same file; only the 3-char rule exists (`tpo-request-decision-model.ts:7-9`). |
| TPO-requests-verification-04 | CONFIRMED | UNCONFIRMED (b) of Round A is now settled: `recordActivityEventInTransaction` (`modules/activity/service.ts:348`) has no recipient or notification fan-out, and `request-service.ts` never inserts `in_app_notifications`. No learner notice on decision. |
| TPO-requests-verification-05 | CONFIRMED | No notification on `createPlacementRequest` (`request-service.ts:414-540`), no escalation job. |
| TPO-requests-verification-06 | CONFIRMED | `shell-model.ts:194` has no badge. |
| TPO-requests-verification-07 | CONFIRMED | `placementLearnerRequests` is used only in 5 files (schema, request-service, count service, decision service, students service). Extra for the fix: the lifecycle CHECK (`placements.ts:1731-1735`) requires `decided_by_user_id` and `decided_at` for every non-PENDING status, so a system `AUTO_APPROVED` needs a schema change (new status and nullable actor), not only code. |
| TPO-requests-verification-08 | CONFIRMED | |
| TPO-requests-verification-09 | CONFIRMED | |
| TPO-requests-verification-10 | CONFIRMED | |
| TPO-requests-verification-11 | CONFIRMED | One sub-claim is wrong: the server search does match roll number (`tpo-students-service.ts:1015-1021` includes `row.rollNumber`); only the label ("Search student, job or company") hides it. The gap itself (missing filters) stands. |
| TPO-requests-verification-12 | CONFIRMED | |
| TPO-requests-verification-13 | CONFIRMED | The generic `/api/placements/tpo/bulk-actions/{preview,confirm}` routes exist but are student-action bulk only; no request decision plan. |
| TPO-requests-verification-14 | CONFIRMED | |
| TPO-requests-verification-15 | CONFIRMED | Omitting reasons is an intentional privacy choice; the gap is the page-only scope and missing columns. |
| TPO-requests-verification-16 | CONFIRMED | `listTpoStudentRequests` loads every request of the college and filters/slices in memory (`tpo-students-service.ts:896-1040`). |
| TPO-requests-verification-17 | CONFIRMED | `requests/page.tsx:46` header still has the eyebrow `TPO · Operations` and the vNext description. |
| TPO-requests-verification-18 | CONFIRMED | `tpo/requests/` has only `page.tsx`. |
| TPO-requests-verification-19 | WRONG (closed on main) | Commit `a02013950` added `app/api/tpo/verification/review`, `[membershipId]/[section]` detail and `.../documents/[receiptId]` routes, `TpoVerificationPanel.tsx` wiring `VerificationReviewDrawer` with `apiBase="/api/tpo/verification"`, and `modules/verification/tpo-staff-auth.ts`. A TPO can now open, verify and send back one section with private documents. Residual TPO gaps are 22 to 26, 29, 32. Close this row. |
| TPO-requests-verification-20 | WRONG (closed on main) | Commit `265c9614d`: `switch-state.ts` makes no settings row = enabled and no grant row = allowed (explicit revocation still denies); used by `tpo-verification-queue-service.ts:25-29` and `tpo-staff-auth.ts`. Residual S4: nothing can create or revoke a TPO grant from the UI, so the grant table is effectively dead weight; document or drop it. |
| TPO-requests-verification-21 | SEVERITY-CHANGE S3 to S4 | Denied-state copy is now legacy ("You cannot verify profiles here" / "Your college admin has not allowed the placement cell to verify profiles"; unavailable tables read "Could not check your verification access", `tpo/verification/page.tsx:12-19`). Only the always-visible sidebar row remains (`shell-model.ts:195`). |
| TPO-requests-verification-22 | CONFIRMED | `tpo-verification-queue-service.ts:49-53` still hard-codes `batchName:null, branchName:null, missingMarksheet:false, attention:[]`; no roll number, no By/Reason columns. |
| TPO-requests-verification-23 | CONFIRMED | `orderBy(desc(submittedAt)).limit(100)` with all statuses mixed (`:46-48`), counts computed client-side. Worse than described: the workspace then re-sorts the newest 100 oldest-first (`queue-order.ts`, `preserveServerOrder` not set by `TpoVerificationPanel`), so the "oldest first" order is only oldest of the newest 100, and Verified/Sent back rows can consume the whole cap and leave Waiting empty. |
| TPO-requests-verification-24 | CONFIRMED | |
| TPO-requests-verification-25 | SEVERITY-CHANGE S2 to S3 | Review one by one is throughput convenience; per-student review plus selection-free list works today. Keep with bulk verify (26) in the same fix. |
| TPO-requests-verification-26 | CONFIRMED | TPO panel has no selection or bulk route (`TpoVerificationPanel.tsx`, `api/tpo/verification/` has only `review` and `[membershipId]`). |
| TPO-requests-verification-27 | CONFIRMED | `review-reasons.ts`: four generic reasons, composed as `reason: details`; a custom-only reason is not possible (preset always prefixed). |
| TPO-requests-verification-28 | CONFIRMED | Drawer closes via `onSaved` with no message (`VerificationReviewDrawer.tsx:90`). |
| TPO-requests-verification-29 | CONFIRMED | Only last decision and note shown (`:101-107`). |
| TPO-requests-verification-30 | CONFIRMED | `transaction-writer.ts:213-220`. |
| TPO-requests-verification-31 | WRONG (closed on main) | `VerificationWorkspace.tsx` with `legacyTpoCopy` now renders h1 "Verification" and the exact legacy subtitle, empty states "Nobody is waiting" / "Nothing here yet" with the legacy subtitle. Only the extra "Back to students" link differs (S4). |
| TPO-requests-verification-32 | CONFIRMED | No TPO export route exists. |
| TPO-requests-verification-33 | CONFIRMED | Update: `b262dd795`/`451dfe151` staged `recruiter-drive-request-model.ts` (statuses REQUEST/SENT_BACK/DRAFT/REJECTED/CANCELLED, auto-approve policy function) and `docs/proposed-migrations/rec-home-drives-21-drive-requests.sql`, explicitly "PROPOSED, NOT A REGISTERED MIGRATION"; still no table, no recruiter submit route, no TPO tab. S1 stands. |
| TPO-requests-verification-34 | CONFIRMED | |
| TPO-requests-verification-35 | CONFIRMED | |
| TPO-requests-verification-36 | CONFIRMED | |
| TPO-requests-verification-37 | CONFIRMED | `initialRecruiterRequestStatus` only models trusted / approval-off / verification-pending; no persistence or settings wiring. See R03 for a legacy rule A37 omits. |
| TPO-requests-verification-38 | CONFIRMED | |

## 3. MISSED gaps

| ID | Gap | Type | Severity | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| TPO-requests-verification-R01 | Approving a withdrawal for a student who holds an offer that was released but not yet accepted: legacy approves and closes that offer in the same step (offer SELECTED/RELEASED becomes DECLINED) and refuses only when the student is placed (HIRED), with the message "This student is placed: reverse the acceptance on the Offers tab first, then approve". vNext refuses whenever any ISSUED or ACCEPTED offer exists, with the generic coded error and no message or link telling the TPO to revoke the offer first, so those withdrawals are stuck pending. | SIDE-EFFECT | S3 | `BE/service/tpo/TpoRequestService.java:109-113,121-129` | `request-service.ts:663-689` (activeOffer throws `PLACEMENT_REQUEST_EFFECT_INVALID`); `tpo-request-decision-control.tsx:31` |
| TPO-requests-verification-R02 | The TPO reviewing a drive request has no "What changed since the last request" card (before and after for Role, Description, Location, Pay packages, Eligibility, Deadline, shown on REQUEST and DRAFT drives from a recruiter that was sent back and resubmitted; "Nothing that we compare changed." when equal), and no recruiter card on the drive (email, phone, `Unverified` tag, `Agency for X` tag, `Open recruiter` link, warning "Recruiter access ended. Finish this drive yourself."). Server keeps `previousRequestJson` on every resubmit. Needed by the approve/decline decision (34, 35), so schedule with them. | MISSING-FIELD | S2 | `FE/components/tpo/drive/OverviewTab.js:12-18,95-109`; `BE/service/tpo/TpoDriveService.java:501-512` (`setPreviousRequestJson(requestSnapshot(job))`) | absent; staged contract has no previous-snapshot field (`recruiter-drive-request-model.ts`, proposed SQL has only `source_job_id` and `draft`) |
| TPO-requests-verification-R03 | Request routing rules A37 does not list: a recruiter whose college access is still PENDING verification always goes to review even when the college switched approval off (only the trusted rules bypass it), and the guard messages around submission: recruiter with no company ("Your account has no company yet. Please contact the placement cell"), request must be the recruiter's own and at the college else "Not found". The auto-approve bell names the rule ("trusted company", "joined through your public link", "approval is switched off in Settings"). | SIDE-EFFECT | S3 | `BE/service/tpo/TpoDriveService.java:444-450,459-498`; `BE/controller/RecruiterCollegeController.java:84-114` | `initialRecruiterRequestStatus` models `verificationPending` but nothing supplies it; no bell or audit |

## 4. WRONG and SEVERITY-CHANGE details

- **19 (WRONG)**: closed by `a02013950` (feat: enable TPO review and private documents) with test `tests/unit/tpo-verification-review-surface.test.ts`. Round A read an older checkout. Remaining TPO verification work is queue content (22, 23), filters (24), bulk and one-by-one (25, 26), export (32), plus drawer content shared with college (29).
- **20 (WRONG)**: closed by `265c9614d` with `tests/unit/tpo-verification-default-grant.test.ts`. Legacy default (no row = on) restored in page and routes. Keep a note about the now-unreachable grant UI (S4).
- **31 (WRONG)**: closed by chat-9 (`legacyTpoCopy` in `VerificationWorkspace.tsx`). Subtitle and empty states match `FE/pages/tpo/verification.js:16-17`.
- **21 (S3 to S4)**: denied copy fixed; only nav visibility remains and is cosmetic (a TPO who opens it sees the college reason).
- **25 (S2 to S3)**: the review path itself is available since `a02013950`; one-by-one speeds up a queue but blocks nothing.
- Not changed but worth noting for the register: gap 01 is really two items (kinds absent in UI and the schema being application-bound), and the fix for 07 needs a schema migration.

## 5. UNCONFIRMED items and how to confirm (batch for the deployed dev site)

1. Approving a withdrawal with a RELEASED/ISSUED offer (R01): seed learner with an issued offer and a pending withdrawal; approve as TPO; read the alert text. Also confirm there is no revoke link on the request card.
2. Whether learners ever see a notification after a decision through another path (04): decide a request on seeded data, read `in_app_notifications` for the learner and the learner bell. Code says none.
3. Pending withdrawal and no-show: legacy excuses a student with a pending withdrawal from no-show counting (`BE/service/tpo/TpoRequestService.java:226-228`, `TpoWorkspaceService` noShows). Check whether vNext attendance/no-show logic has any link to pending requests (grep found none in `modules/placements`).
4. Round reschedule decisions: legacy decides them on the Rounds tab via `POST /tpo/reschedule-requests/{id}/decide`; confirm side effects (student told, new slot) against vNext `applyApprovedEffect` ROUND_RESCHEDULE in the drive-workspace live check.
5. Whether a placement-team admin who is not a TPO-role member can reach `/tpo/requests` and `/tpo/verification` (legacy `isTpoAdmin` accepts TPO faculty or team role TPO_ADMIN, `ProfileVerificationService.java:50-54`; vNext requires the TPO membership role).
6. Resume link and masked Aadhaar/PAN display in the drawer (Round A UNCONFIRMED (a), gap 29): open a seeded Identity and Education submission as TPO.
7. Eligibility refresh after a TPO verifies Education: legacy calls `recalculateEligibility`; vNext `academic-publication.ts:32` states it refreshes the eligibility read model. Verify on dev that a newly verified CGPA changes a drive's eligible count.
8. Count and ordering behaviour of the TPO verification queue with more than 100 rows (23): seed 120 rows with mixed statuses and check Waiting count and oldest-first order.

Existing tests worth extending (not run here): `tests/unit/tpo-verification-review-surface.test.ts`, `tpo-verification-default-grant.test.ts`, `tpo-global-requests-model.test.ts`, `tests/integration/placements-requests.test.ts`.
