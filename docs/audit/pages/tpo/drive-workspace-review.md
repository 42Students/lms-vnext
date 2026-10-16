# Round R review: TPO / Drive workspace (`drive-workspace`)
Reviewed: 2026-10-16 by Phase 2 Round R agent. Round A file: `docs/audit/pages/tpo/drive-workspace.md` (opened only after my own independent audit; one earlier grep result list showed its file name, not its content).

Independent method: read legacy `_hr-tpo-fe` (lms-dev-2026) `pages/tpo/drives/[jobId].js` and `components/tpo/drive/*` (ApplicantsTab, ApplicantReviewModal, ApplicantsBoard, RoundsTab, ScheduleModal, ResultsEntryModal, OffersTab, OverviewTab, ShareModal, publishPreflight, ChangeRequests, InviteReviewer, DiscussionTab), then the vNext workspace (`placement-drive-workspace.tsx`, `placement-drive-controls.tsx`, `tpo-drive-*` forms and services, pipeline, offers, share-preview, candidate-schedule, round results pages, bulk-action panel and routes). Legacy backend services were not re-read in depth (frontend closure only), so backend-only claims are marked UNCONFIRMED.

## 1. Summary
Round A gaps: 74. Verdicts: CONFIRMED 72, WRONG 0, SEVERITY-CHANGE 2 (TPO-drive-workspace-21, TPO-drive-workspace-33). MISSED: 6 (R01 to R06). Discrepancy rate = (6 + 0 + 2) / (74 + 6) = 10%.
Round A is thorough; nearly everything I found independently was already there. The material miss is that the DB09 environment gate also disables bulk applicant actions, not only the export (R01).

## 2. Round A gap verdicts
IDs are `TPO-drive-workspace-NN`.

| Round A gap ID | verdict | note |
| --- | --- | --- |
| 01 | CONFIRMED | Tab nav exists only on the overview page (see R04). |
| 02 | CONFIRMED | No Next step card or state-driven main button in `placement-drive-workspace.tsx`. |
| 03 | CONFIRMED | Header is title plus `{company} · live placement workspace` only. |
| 04 | CONFIRMED | Only the "Preview capped applicant CSV" link. |
| 05 | CONFIRMED | No clone code under modules/placements or components. |
| 06 | CONFIRMED | Also drafts cannot be cancelled (R06). |
| 07 | CONFIRMED | |
| 08 | CONFIRMED | Core services run in one `Promise.all` (workspace.tsx:41-68), so one failure falls to `error.tsx`. |
| 09 | CONFIRMED | |
| 10 | CONFIRMED | `SEASON_NOT_ACTIVE` blocker in `tpo-drive-lifecycle-model.ts:31`. |
| 11 | CONFIRMED | `jobs/[jobId]/page.tsx` redirects non-TPO to /dashboard. |
| 12 | CONFIRMED | No request approve / send back / decline on the workspace. |
| 13 | CONFIRMED | Publish is a reason box plus `window.confirm`; no eligible/excluded counts, checklist or announcement. |
| 14 | CONFIRMED | vNext blockers are STALE_JOB_STATUS, SEASON_NOT_ACTIVE, COMPANY_NOT_ACTIVE, NO_ACTIVE_ROLE, NO_EVALUATIVE_ROUND, ELIGIBILITY_POLICY_NOT_PERSISTED, APPLICATION_DEADLINE_PASSED. No job type, pay or off-campus link check. Unconfirmed: whether a null deadline passes `deadlineValid`. |
| 15 | CONFIRMED | `changeTpoDriveLifecycle` (tpo-drive-lifecycle-service.ts:131-190) only updates status and records an activity event: no notification, no debarment counter. |
| 16 | CONFIRMED | Extend page only for drives that already have a deadline. |
| 17 | CONFIRMED | Close only flips status. |
| 18 | CONFIRMED | |
| 19 | CONFIRMED | |
| 20 | CONFIRMED | |
| 21 | SEVERITY-CHANGE | S1 to S2, see section 4. |
| 22 | CONFIRMED | Grid has Student, Role, Stage, Application, Channel, Eligibility evidence, Submitted, Screening. |
| 23 | CONFIRMED | Search scope is a separate miss (R02). |
| 24 | CONFIRMED | |
| 25 | CONFIRMED | See also R01 (gate). |
| 26 | CONFIRMED | Still UNCONFIRMED whether notices are held; no notifier found in the bulk path. |
| 27 | CONFIRMED | Drawer is per applicant, no keyboard queue. |
| 28 | CONFIRMED | |
| 29 | CONFIRMED | |
| 30 | CONFIRMED | |
| 31 | CONFIRMED | |
| 32 | CONFIRMED | |
| 33 | SEVERITY-CHANGE | S2 to S1 if `DB09_TPO_API_READY` is unset, see section 4 and R01. |
| 34 | CONFIRMED | Bulk reject requires a candidate message (`tpo-bulk-action-panel.tsx:79`). |
| 35 | CONFIRMED | |
| 36 | CONFIRMED | |
| 37 | CONFIRMED | `rounds/reorder` route exists, no component references reorder. |
| 38 | CONFIRMED | |
| 39 | CONFIRMED | |
| 40 | CONFIRMED | |
| 41 | CONFIRMED | Detail added in R03. |
| 42 | CONFIRMED | |
| 43 | CONFIRMED | |
| 44 | CONFIRMED | `candidate-schedule/page.tsx` says candidate slots and panels have no persistence. |
| 45 | CONFIRMED | |
| 46 | CONFIRMED | |
| 47 | CONFIRMED | Offer is issued directly (`placement-offer-controls.tsx:219-231`). |
| 48 | CONFIRMED | |
| 49 | CONFIRMED | |
| 50 | CONFIRMED | |
| 51 | CONFIRMED | |
| 52 | CONFIRMED | `window.prompt` at `placement-offer-controls.tsx:251`. |
| 53 | CONFIRMED | |
| 54 | CONFIRMED | |
| 55 | CONFIRMED | |
| 56 | CONFIRMED | |
| 57 | CONFIRMED | |
| 58 | CONFIRMED | `tpo-drive-tab-model.ts:7` links to the global `/tpo/drive-day`. |
| 59 | CONFIRMED | `/tpo/messages` is a notification inbox, not a drive thread. |
| 60 | CONFIRMED | |
| 61 | CONFIRMED | |
| 62 | CONFIRMED | |
| 63 | CONFIRMED | |
| 64 | CONFIRMED | |
| 65 | CONFIRMED | `company-share-controls.tsx` posts only `{expiresInDays}`; preview exposes application id, name, email. |
| 66 | CONFIRMED | |
| 67 | CONFIRMED | |
| 68 | CONFIRMED | |
| 69 | CONFIRMED | |
| 70 | CONFIRMED | |
| 71 | CONFIRMED | |
| 72 | CONFIRMED | |
| 73 | CONFIRMED | |
| 74 | CONFIRMED | Legacy-side note only; not re-verified against the backend. |

## 3. MISSED gaps
| ID | Gap | Type | Severity | Legacy evidence | vNext evidence |
| --- | --- | --- | --- | --- | --- |
| TPO-drive-workspace-R01 | Bulk actions on a drive's applications (shortlist, reject) are also gated by `DB09_TPO_API_READY`: the preview and confirm routes refuse `target=APPLICATIONS` unless the variable equals `DB09_VERIFIED`. Round A -33 lists only the export gate. The variable is not set in any non-test config in the repo, so wherever it is unset the applicant bulk panel and the CSV download are both dead. | PERMISSION | S1 (UNCONFIRMED on the dev site) | `ApplicantsTab.js:97-120` bulk move/reject work unconditionally | `app/api/placements/tpo/bulk-actions/preview/route.ts:17`, `confirm/route.ts:18`; `applications-export/page.tsx:18,35` |
| TPO-drive-workspace-R02 | Applicant search matches student name or role only. Legacy search covers name, roll number, branch, email, phone and batch, which is how a TPO finds one student in a list. | MISSING-FILTER | S2 | `ApplicantsTab.js` `searchOf` (name, rollNumber, branch, email, phone, batchName) | `tpo-applicant-pipeline-model.ts:5` (`search`, label "Student or role"); `tpo-drive-applications-export-service.ts` ilike on displayName and role title |
| TPO-drive-workspace-R03 | Bulk round-result recorder: at most 25 selected, only unset results, only PASS or FAIL. No bulk Waitlist or Absent, no waitlist rank by marking order, no "everyone I did not mark is Not cleared" switch; HOLD and ABSENT exist only in the one-by-one form. (Refines -41.) | MISSING-ACTION | S2 | `ResultsEntryModal.jsx:25-30, 806-897` (four outcomes, rank by marking order, rest Not cleared) | `tpo-bulk-round-result-recorder.tsx:20-60` (`current.length >= 25`, `"PASS" \| "FAIL"`, `resultStatus === null`) |
| TPO-drive-workspace-R04 | Drive navigation is inconsistent: the section nav appears only on the overview page, with `aria-current` fixed to "Overview". Offers, joining, letters, share-preview, candidate-schedule, shortlist and close-out show only a back link, so there is no tab strip and no active state elsewhere; Applicants and Rounds are redirects, so the tab clicked is never shown active. (Refines -01.) | A11Y | S3 | `[jobId].js:459-484` (one Tabs control with active key and `?tab=`) | `jobs/[jobId]/page.tsx:36-46`; `offers/page.tsx:26`; `applicants/page.tsx` and `rounds/page.tsx` redirects |
| TPO-drive-workspace-R05 | Machine codes and one generic error reach the user. The lifecycle panel shows `CLOSE blockers: NO_EVALUATIVE_ROUND` style codes; the pipeline stage select shows SUBMITTED / PENDING / HOLD; every publish or reopen failure (permission, validation, stale) shows "Readiness or job state changed. Refresh before retrying." because the service throws `PLACEMENT_JOB_READ_ONLY` for all of them. | COPY | S3 | Legacy blockers are sentences (`publishPreflight.js:380-394`) and the server `message` is shown (`errorText`) | `tpo-drive-lifecycle-controls.tsx:35-52,86-90,105-107`; `tpo-drive-lifecycle-model.ts:29-43`; `tpo-drive-lifecycle-service.ts:131-170`; `applicants-pipeline/page.tsx` stage select |
| TPO-drive-workspace-R06 | A draft cannot be cancelled (Cancel link and preview exist only for PUBLISHED) as well as not deleted (-06), and there is no clone (-05), so an abandoned or wrong draft stays in the list forever. | MISSING-ACTION | S3 | `[jobId].js:356-357` (Delete draft; Cancel for DRAFT and PUBLISHED) | `placement-drive-workspace.tsx:228-233`; `cancel-preview/page.tsx` ("only for published drives") |

## 4. SEVERITY-CHANGE details
- **-21 (S1 to S2).** Legacy Test/Interview stages and `Move to test/interview` are manual moves on applicants. vNext moves candidates by recording round results (staged, then applied) and the rounds model carries progression, so the workflow is not blocked. What is lost is the at-a-glance Current round and Last result, which belong with -20 and -22. Keep S1 only if the owner wants manual stage moves independent of rounds.
- **-33 (S2 to S1, conditional).** Legacy exports the whole filtered view with every column (`exportName` on `TpoDataTable`, plus the More-menu CSV Name, Roll, Branch, CGPA, Stage). In vNext the only download is a 500-row CSV of student name, role, status, screening, channel and submitted time (no Roll, Branch, CGPA, email, phone), and it is hidden unless `DB09_TPO_API_READY=DB09_VERIFIED`. If that variable is unset on the target environment this is a blocked workflow (see R01).

## 5. UNCONFIRMED items and how to confirm on the deployed dev site
1. Is `DB09_TPO_API_READY` set on the dev deployment (R01, -33)? Open `/tpo/placements/jobs/<id>/applications-export` and check whether "Download capped CSV" shows; open the applicants pipeline and run a bulk shortlist preview.
2. Do students get any notification on publish, close, cancel or extend (-15, -17, -18)? Publish a seeded drive and check the learner bell and outbox. Static read says no notifier is called in `changeTpoDriveLifecycle`.
3. Round results candidate set: `tpo-round-result-table` lists "eligible shortlisted submitted applications" for every round. On a drive with two rounds, confirm whether round 2 lists only those who passed round 1 (legacy does).
4. Does `deadlineValid` accept a null deadline, so a drive with no deadline can be published (-14)? Create a draft without a deadline and open the publish readiness.
5. Is there any UI to reorder evaluation-plan rounds (-37)? A component search found none; check the plan editor visually.
6. Held 30-second notice window and undo semantics for bulk moves (-26): shortlist two applicants, undo, and check whether the learner saw anything.
7. Legacy backend permissions (TPO admin or college admin) and audit action names were not re-read; confirm against `TpoDriveService` if -11 or the activity gap (-68) is prioritised.

## Chat-5 implementation follow-up (2026-10-17)

- **TPO-drive-workspace-R02**: pipeline and export now use the same authorized-college search predicate over learner name, role, roll/registration, email, phone, branch and cohort. Academic search uses correlated `EXISTS` to preserve one result per application. Search UI is relabeled, and unit and isolated PostgreSQL tests are committed. **Source implemented; tests/browser acceptance not executed in this session.**
