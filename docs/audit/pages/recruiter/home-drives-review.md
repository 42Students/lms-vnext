# Round R review: Recruiter / Today (home) and Drives (`home-drives`)

Reviewer: Claude (Sonnet 5.5, Round R, read-only), 2026-10-16. Round A file: `docs/audit/pages/recruiter/home-drives.md` (opened only after my own independent audit). Judged against current `origin/main` (includes chat-7: recruiter calendar slot events, TPO message bells, staged drive-request contract `b262dd795`; none of it changes the Home or Drives behaviour audited here, `hr/drives/new` is still proposal-message only and `recruiter-drive-request-model.ts` / `placement_recruiter_drive_requests` are staged but referenced by no page or route).

## 1. Summary

Round A gaps: 56. Verdicts: CONFIRMED 52, WRONG 0, SEVERITY-CHANGE 4 (23, 37, 38, 48). MISSED: 8 (IDs `REC-home-drives-R01` to `R08`).
Discrepancy rate = (8 MISSED + 0 WRONG + 4 SEVERITY-CHANGE) / (56 + 8) = 12 / 64 = 18.8%.

Round A is thorough: my independent list (about 45 items) matched 50 of its 56 rows before I opened it. The misses are mostly cross-cutting: server side effects toward the TPO, scope semantics, closed-drive handling and URL compatibility. Two Round A UNCONFIRMED items are resolved here (49 and 41, see section 5).

Method note: legacy read in `_hr-tpo-fe` (home.js, RecruiterToday.jsx, drives/index.js, drives/new.js, drives/[jobId].js, RecruiterDriveOverview, RecruiterFocusedReview, recruiterReviewUtils, recruiterRoutes, useRecruiterCollege) and backend `RecruiterDriveController`, `RecruiterTodayService`, `RecruiterDriveWorkService`, `RecruiterWorkspaceService`, `RecruiterPlanDriveService`, `RecruiterCollegeController`, `RecruiterAccessService`, `TpoDriveService.createRequest`. vNext read: `hr/home`, `hr/drives`, `hr/drives/new`, `hr/placements/jobs/[jobId]`, rounds editor, interview slots, drive messages pages, `hr-drive-draft-form`, `recruiter-result-controls`, today/list/overview/draft models, slot and round-editor services, applicant export route.

## 2. Round A gap verdicts

| Round A gap ID | Verdict | Note |
| --- | --- | --- |
| REC-home-drives-01 | CONFIRMED | Task kinds verified against `RecruiterTodayService.today` (changes-, reviewdrive-, review-, slots-, results-, offers-, withcell-, selections-withcell, messages). |
| REC-home-drives-02 | CONFIRMED | |
| REC-home-drives-03 | CONFIRMED | |
| REC-home-drives-04 | CONFIRMED | |
| REC-home-drives-05 | CONFIRMED | |
| REC-home-drives-06 | CONFIRMED | `buildRecruiterToday` keeps only `kind === "ROUND" && status === "SCHEDULED"`, so the chat-7 slot events do not reach Today. Window is today..+6 (7 days) vs legacy today..+8. |
| REC-home-drives-07 | CONFIRMED | |
| REC-home-drives-08 | CONFIRMED | |
| REC-home-drives-09 | CONFIRMED | Prod-only in legacy (dev `home.js` does not render pending invites). S4 right. |
| REC-home-drives-10 | CONFIRMED | `hrApplicantFilterSchema` is `strictObject` with `tab` enum of four values; the ZodError is rethrown unless the id is not a uuid, so the route error page shows. |
| REC-home-drives-11 | CONFIRMED | |
| REC-home-drives-12 | CONFIRMED | `summarizeRecruiterDrives` hard-codes `waiting: 0`; list filter only PUBLISHED/CLOSED. S1 agreed (same root as 21). |
| REC-home-drives-13 | CONFIRMED | S2 agreed because of owner decision 13 (exact wording). |
| REC-home-drives-14 | CONFIRMED | |
| REC-home-drives-15 | CONFIRMED | |
| REC-home-drives-16 | CONFIRMED | |
| REC-home-drives-17 | CONFIRMED | |
| REC-home-drives-18 | CONFIRMED | |
| REC-home-drives-19 | CONFIRMED | Still UNCONFIRMED on the vNext side, see section 5. |
| REC-home-drives-20 | CONFIRMED | `recruiter-placement-portfolio.tsx` links `/hr/placements/jobs/{id}`; no Back link on the detail page at all. |
| REC-home-drives-21 | CONFIRMED | Re-verified on current main after chat-7 `b262dd795`: `hr-drive-draft-form.tsx` posts only to `/api/placements/recruiter/drives/proposal`. S1 agreed. |
| REC-home-drives-22 | CONFIRMED | |
| REC-home-drives-23 | SEVERITY-CHANGE | S2 -> S3, see section 4. |
| REC-home-drives-24 | CONFIRMED | |
| REC-home-drives-25 | CONFIRMED | |
| REC-home-drives-26 | CONFIRMED | |
| REC-home-drives-27 | CONFIRMED | `hrDriveDraftSchema`: description min 20, location min 2, rounds min 1 and distinct names; legacy needs only title (>= 3) and CTC. |
| REC-home-drives-28 | CONFIRMED | |
| REC-home-drives-29 | CONFIRMED | |
| REC-home-drives-30 | CONFIRMED | |
| REC-home-drives-31 | CONFIRMED | Preset labels verified in `hr-drive-round-presets.ts`. |
| REC-home-drives-32 | CONFIRMED | |
| REC-home-drives-33 | CONFIRMED | |
| REC-home-drives-34 | CONFIRMED | |
| REC-home-drives-35 | CONFIRMED | |
| REC-home-drives-36 | CONFIRMED | |
| REC-home-drives-37 | SEVERITY-CHANGE | S2 -> S3, see section 4. |
| REC-home-drives-38 | SEVERITY-CHANGE | S2 -> S1, see section 4. |
| REC-home-drives-39 | CONFIRMED | Grep of `src` finds no recruiter change-request code (only TPO students requests). S2 kept: the free-text conversation remains a workaround. |
| REC-home-drives-40 | CONFIRMED | |
| REC-home-drives-41 | CONFIRMED | Resolved: `ApplicantNotesPanel` has no rating, and the panel audience string is "recruiters of your company with access to this drive". |
| REC-home-drives-42 | CONFIRMED | Drawer states "Round-specific review decisions are not persisted by this drawer". Per-candidate staging in `RecruiterResultControls` keeps this at S2. |
| REC-home-drives-43 | CONFIRMED | |
| REC-home-drives-44 | CONFIRMED | `HR_APPLICANT_EXPORT_CAP = 200`. |
| REC-home-drives-45 | CONFIRMED | |
| REC-home-drives-46 | CONFIRMED | |
| REC-home-drives-47 | CONFIRMED | Same PUBLISHED-only guard also hits the slots page, see R04. |
| REC-home-drives-48 | SEVERITY-CHANGE | S3 -> S2, see section 4. |
| REC-home-drives-49 | CONFIRMED | UNCONFIRMED part resolved: vNext has no auto-apply setting at all, see R02. |
| REC-home-drives-50 | CONFIRMED | |
| REC-home-drives-51 | CONFIRMED | S1 agreed ("No selection list is sent" is printed on the Offers tab). |
| REC-home-drives-52 | CONFIRMED | |
| REC-home-drives-53 | CONFIRMED | |
| REC-home-drives-54 | CONFIRMED | |
| REC-home-drives-55 | CONFIRMED | Small correction: tab labels are lower-case in source but rendered capitalised by the `capitalize` class ("Overview", "Applicants"); counts and order point still hold. |
| REC-home-drives-56 | CONFIRMED | |

## 3. MISSED gaps

| ID | Gap | Type | Sev | Legacy evidence | vNext evidence |
| --- | --- | --- | --- | --- | --- |
| REC-home-drives-R01 | The TPO is not told when a recruiter adds or changes a round, stages results or proposes interview slots. Legacy writes an audit row and a TPO bell for each ("A recruiter added a round", "A recruiter sent results", "A recruiter proposed interview slots", "A recruiter sent a selection list"), linking to the drive tab. vNext writes only `activity_events` rows for rounds and slots, no TPO bell or notification delivery, and no TPO screen reads `placement_hr_interview_slots` at all, so a proposed slot can never be seen or acted on by the college. (Only the free-text recruiter message path got a TPO bell in chat-7.) | SIDE-EFFECT | S2 | BE `service/tpo/RecruiterDriveWorkService.java` addRound, submitResults, proposeSlots, submitSelections (`audit.log` + `audit.bell`) | `modules/placements/hr-round-editor-service.ts` (`activityEvents` insert, no bell); `hr-interview-slot-service.ts` (same); `modules/placements/result-service.ts` (no notification); `grep -rln hrInterviewSlots src` lists only the recruiter slot service, round editor and recruiter calendar; `docs/parity/hr.md` row "Interview slots" ("TPO acknowledgement, notifications ... do not exist yet") |
| REC-home-drives-R02 | Results auto-apply is absent. Legacy: when the TPO switched on "apply this company's results automatically" for a drive and the whole submission is PASS rows (and no other non-pass result waits in the round), the results apply at once and the recruiter sees "Applied" instead of "Sent to the placement cell to verify". vNext always stages and always says "Result staged ... for the college placement team to review and apply". Resolves the UNCONFIRMED part of REC-home-drives-49. | SIDE-EFFECT | S3 | BE `RecruiterDriveWorkService.submitResults` (`results_auto_apply`, `applyRound`); `[jobId].js:527`, `RecruiterFocusedReview.jsx:147` | `grep -i auto_apply|autoApply src` finds nothing; `recruiter-result-controls.tsx` success toast "Result staged" |
| REC-home-drives-R03 | Scope of a recruiter's drives is wider in vNext. Legacy filters every read and write by `j.recruiter_id = me` (and college), so a colleague's drive is "Not found" and Company & Team only shows a drive count per colleague. vNext lists and opens every drive of the recruiter's company relationship at the college, lets any such recruiter stage results and add rounds, and shares applicant notes company-wide. May be intended (multi-recruiter company model), but it is an undocumented permission change. Needs an owner decision, then either a note in section 4 or an owner-filter. | PERMISSION | S3 | BE `RecruiterDriveWorkService.requireOwn` / `drives` (`WHERE j.recruiter_id = :h`); `RecruiterTodayService.MINE_JOB` | `modules/placements/recruiter-service.ts` `listOwnRecruiterPlacementJobs` (selected by `companyRelationshipId` of grants, no per-recruiter filter); `hr/drives/page.tsx:38`; `hr-interview-slot-model.ts` "created by another recruiter" read-only message |
| REC-home-drives-R04 | Closed drives dead-end on the tools. Legacy keeps Rounds and Offers readable and replaces the write panels with "This drive is finished, so slots and results can no longer be sent." / "...a selection list can no longer be sent." and the server answers with the same sentence. In vNext the drive page always renders the links "Add, change or remove rounds" and "Interview slots" (also on CLOSED drives), but the slot service and round editor resolve PUBLISHED jobs only, so on a closed drive both links end in not-found with no explanation; result staging on a closed drive surfaces only as an error toast. (Round A 47 covers the editor's PUBLISHED-only scope, not the dead links or the slots page.) | STATE | S3 | `[jobId].js:432-434,467-469`; BE `requireOpenDrive` | `hr/placements/jobs/[jobId]/page.tsx:417-424`; `hr-interview-slot-service.ts:35`; `hr-round-editor-service.ts:39`; `result-service.ts:245,299,557` |
| REC-home-drives-R05 | Applicant drawer / focused review accessibility and keyboard handling. Legacy full-screen review is a modal dialog with focus trap, Esc to close, focus restored to the opener, and `aria-live` card, plus 1-5 rating keys, N/P navigation. vNext drawer is a server-rendered section with `role="dialog"` but no focus trap, no Esc handler and no focus return; Previous/Next applicant are full page navigations through `?applicant=` links, and the drawer is not modal outside `review=1`. | A11Y | S3 | `RecruiterFocusedReview.jsx:48-53,108-135,159-160,190` | `hr/placements/jobs/[jobId]/page.tsx:286-298` |
| REC-home-drives-R06 | Legacy list URL contract is not honoured. Legacy `/recruiter/drives?tab=all|live|waiting|closed&q=` (bookmarks, notification and email links); vNext reads `view=ALL|LIVE|CLOSED|WAITING` (upper-case) and `collegeId`, and silently ignores `tab`, so `?tab=live` shows All. `q` is compatible. Add a `tab` alias mapping (waiting -> WAITING, closed -> CLOSED) or accept both. | STATE | S3 | `pages/recruiter/drives/index.js:36-42,64-69` (`tab` query, `updateListQuery`) | `hr/drives/page.tsx:25-32` (only the keys it lists are read); `recruiter-drive-list-model.ts:3-12` |
| REC-home-drives-R07 | Date and time display zone. Legacy API sends UTC instants and the browser shows the viewer's own zone (`moment(...).format`, `momentFromApi`). vNext hard-codes `Asia/Kolkata` and appends "IST" or formats without a suffix in several places (Today, Drives deadline, rounds, offers). Fine for Indian colleges; wrong for a recruiter travelling or located abroad. Decide intentionally. | COPY | S4 | `RecruiterToday.jsx:13,222,299`; BE `RecruiterTodayService.iso` | `hr/home/page.tsx:28`; `hr/placements/jobs/[jobId]/page.tsx:103-104,388-389` |
| REC-home-drives-R08 | Unbounded reads on the two busiest pages. `listOwnRecruiterPlacementJobs` loads every job of every grant (no limit or paging), then Today and Drives filter, sort and paginate in JavaScript; Today also loads a page of notifications, conversations and the calendar on each request; the applicants CSV loops through pages sequentially up to the 200 cap. Legacy returned one college's rows only. | PERFORMANCE | S4 | BE `RecruiterDriveWorkService.drives` (one college, `ORDER BY j.id DESC`) | `modules/placements/recruiter-service.ts:386-440`; `hr/home/page.tsx:73-78`; `hr/drives/page.tsx:41`; `applicants/export/route.ts:28-36` |

## 4. WRONG / SEVERITY-CHANGE details

No Round A row is WRONG. Every vNext claim I re-checked held on current main.

- REC-home-drives-23 (JD file upload) S2 -> S3. The field is labelled optional in legacy ("Job description file (optional)"), a recruiter can paste the description, the vNext form is a message proposal that could not carry an attachment anyway, and the blocker is private storage (infra), already tracked by the form. It degrades nothing a recruiter needs to complete a request; it becomes S2 only once the formal request exists (REC-home-drives-21).
- REC-home-drives-37 (hiring funnel) S2 -> S3. vNext already shows shared, active, withdrawn, rounds completed, issued and accepted offers; what is missing is cumulative stage progression and percentages. Information, not a blocked step.
- REC-home-drives-38 (applicant columns and links) S2 -> S1. The legacy table, drawer and review card carry roll number, branch, UG %, 10th %, 12th %, skill match, phone, resume, GitHub and portfolio. vNext shows name, role, status, screening, applied date and a shared email. Those fields are the only basis on which a recruiter decides shortlist/waitlist/reject (REC-home-drives-42) or builds a selection list (REC-home-drives-51), and the resume link is the main artifact. With them missing the Applicants tab cannot support its purpose, so this blocks the review workflow rather than degrading it. Note the vNext policy deliberately shows only SUBMITTED + SHORTLISTED applications (`recruiter-shared-candidate-policy.ts`) and masks contact data; the legacy share-link column model (columns chosen by the cell, stage cap, direct-visibility setting) has no vNext equivalent, which should be part of the same fix.
- REC-home-drives-48 (interview slots) S3 -> S2. Not only different labels: legacy recruiter proposals are confirmed by the placement cell, who adds a room, and the cell is bell-notified. In vNext the lifecycle ends in a recruiter-side internal "Offer time to college" / "Reserve one internal slot", nothing on the TPO side reads the table and no bell is sent (see REC-home-drives-R01), so the slot workflow cannot complete. `docs/parity/hr.md` itself says TPO acknowledgement is not built.

## 5. UNCONFIRMED items and how to confirm (batch for the live check on the dev site)

Resolved by this review (code evidence above): auto-apply of results (R02), rating in notes (41 confirmed absent), TPO reader of recruiter slots (none, R01).

Still to confirm live or by owner decision:
1. R01 results: whether the TPO round-results queue shows recruiter-staged `STAGED` rows without a bell. Confirm: as a recruiter stage a result on a seeded published drive, then open the TPO bell and `/tpo/drives/{id}?tab=rounds`; check `notifications` table for a recruiter-sourced row.
2. R03 scope: confirm with the owner whether colleagues of one company at one college should see each other's drives, results and notes. Confirm by seeding two recruiters on one company and opening each other's `/recruiter/drives/{id}`.
3. R04 closed drive: open a CLOSED drive as a recruiter and click "Interview slots" and "Add, change or remove rounds"; expect not-found today.
4. R06: open `/recruiter/drives?tab=live` and `?tab=waiting`; expect the All view.
5. REC-home-drives-19: confirm whether a recruiter grant can exist without read access (inspect grant capabilities in `hr-recruiter-grant-navigation-model.ts` and `placements.recruiter.read`); if not, the legacy "Drive access is not switched on" state is moot.
6. REC-home-drives-10 and R06 together: verify what a recruiter sees from any legacy-format notification link once Messages and bells are wired (route error page vs content).
7. R05: keyboard walk of the vNext applicant drawer at 375 px and 1280 px (Tab order escapes the dialog, Esc does nothing).
8. Both apps were read statically; no rendering, responsive or timing checks were run.
 

## REC-home-drives-R06 source implementation (2026-10-17)

Legacy `/recruiter/drives?tab=all|live|waiting|closed&q=` bookmarks now map to the strict filter model. Within the recruiter list, tab, search, college selection, reset and pagination retain the `/recruiter/drives` namespace. The `/hr/drives?view=` alias continues to work; invalid tabs show a filter error. Unit tests are authored; browser and typecheck verification remain outstanding before marking this reviewed gap fully CLOSED.
