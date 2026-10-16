# Round R review: Learner / My Placements (`docs/audit/pages/learner/placements.md`)

Reviewer: Round R agent (Sonnet 5.5), 2026-10-16. Checked against origin/main at `69296e123` (includes chat-5 batch invitation and registration deadline work, and the later migrations 0099 to 0101).

## 1. Summary

Round A gaps: 58. CONFIRMED 55, WRONG 1, SEVERITY-CHANGE 2, MISSED (new) 8.
Discrepancy rate = (MISSED 8 + WRONG 1 + SEVERITY-CHANGE 2) / (58 + 8) = 11 / 66 = 16.7%.

Round A is thorough on copy, layout and the big missing surfaces. What it missed is mostly behaviour behind the UI: why Apply is blocked, what accepting an offer does to other applications, which learner notifications are ever sent, and two inconsistent withdrawal paths.

Independence: legacy FE (`_hr-tpo-fe` at `lms-dev-2026`: `my-placements/*`, `Placements/student/*`, `PlacementCellContent.js`, `JobsListContent.jsx`, `JobDetailContent.jsx`, `AnnouncementList.jsx`) and BE (`LearnerPlacementController`, `LearnerPlacementService`, `LearnerJourneyService`, `LearnerEligibilityController`, `ApplyGate`, `PlacementCascadePolicy`, `TpoOfferService.respondInApp`, `LearnerRegistrationController`, `LearnerRequestController`, `LearnerScheduleController`, `LearnerAnnouncementController`) were read before the Round A file was opened.

## 2. Round A gap verdicts

| Round A gap ID | Verdict | Note |
|---|---|---|
| LEARNER-placements-01 | CONFIRMED | No unread count or mark-read in vNext notices. Legacy `LearnerAnnouncementController.list` marks read and `/unread` feeds the tab count. |
| -02 | CONFIRMED | |
| -03 | CONFIRMED | |
| -04 | CONFIRMED | |
| -05 | CONFIRMED | |
| -06 | CONFIRMED | `learner-job-service.ts` computes `debarred` and uses it only in `canShowLearnerSelfApply`; no banner anywhere in `learn/my-placements`. |
| -07 | CONFIRMED | |
| -08 | CONFIRMED | |
| -09 | CONFIRMED | |
| -10 | CONFIRMED | Owner decision. |
| -11 | CONFIRMED | |
| -12 | CONFIRMED | |
| -13 | CONFIRMED | `saved-job-service.ts` and table `placement_saved_jobs` exist; zero importers in `src/` (grep). No UI, no route. |
| -14 | CONFIRMED | |
| -15 | CONFIRMED | Stronger than stated: see MISSED R08 (non-targeted drives are dropped, not shown as "Not open to you"). |
| -16 | CONFIRMED | |
| -17 | CONFIRMED | |
| -18 | CONFIRMED | |
| -19 | WRONG | `learner-jobs-browse.tsx:20` `PAGE_SIZE = 20`. Same as legacy `JobsListContent.jsx:51`. No gap. |
| -20 | CONFIRMED | No resume at apply; the apply payload carries only role option, channel and confirmation. |
| -21 | CONFIRMED | |
| -22 | CONFIRMED | |
| -23 | CONFIRMED | Reason minimum is 5 characters (`learner-withdrawal-model.ts:7`). The drive-detail request path accepts 3 to 2000 (`learner-placement-jobs.tsx:176`), so the two vNext forms disagree (see R05). |
| -24 | CONFIRMED | |
| -25 | CONFIRMED | Pay breakdown split out as R06. |
| -26 | CONFIRMED | Cross-reference typo: it says "see -52"; registration is -50. |
| -27 | CONFIRMED | |
| -28 | CONFIRMED | `applications/[applicationId]/company/page.tsx` is a "Company and drive" page, not the shared-columns preview. |
| -29 | CONFIRMED | Premise needs correcting. vNext has two paths: drive detail posts an `APPLICATION_WITHDRAWAL` request (`learner-placement-jobs.tsx:235-262`, "placement team must review"), application detail posts a direct withdrawal (`learner-application-detail-withdraw.tsx`). Neither implements legacy SELF vs REQUEST by booked round (`LearnerJourneyService.java:148-149`). `canSelfWithdrawPlacementApplication` only checks issued or accepted offers (`application-service.ts:1076`). See R05. |
| -30 | CONFIRMED | |
| -31 | CONFIRMED | |
| -32 | CONFIRMED | |
| -33 | CONFIRMED | |
| -34 | CONFIRMED | |
| -35 | CONFIRMED | No `student_confirmed_at` equivalent and no round booking/slot-assignment table in the vNext schema (only recruiter `placement-hr-interview-slots.ts`). `learner-career-rounds-workspace.tsx:318` states scheduled time "does not confirm attendance". This needs schema work, not only UI. |
| -36 | CONFIRMED | Requests are on the Placement cell page (and Home), via the "Request reschedule" link in the rounds workspace, not on Schedule. |
| -37 | CONFIRMED | |
| -38 | CONFIRMED | |
| -39 | CONFIRMED | |
| -40 | CONFIRMED | |
| -41 | CONFIRMED | |
| -42 | CONFIRMED | |
| -43 | CONFIRMED | |
| -44 | CONFIRMED | |
| -45 | SEVERITY-CHANGE S3 to S2 | Confirmed absent, and deeper than UI: no offer letter column in `placements.ts` offers, no `countsAsPlaced` per drive. Legacy internship offers (counts_as_placed false) are never held against the learner and never trigger the cascade (`PlacementCascadePolicy.java:36`); without the field vNext cannot reproduce that. |
| -46 | CONFIRMED | |
| -47 | CONFIRMED | |
| -48 | CONFIRMED | |
| -49 | CONFIRMED (still UNCONFIRMED live) | Narrowed: learner notices render only when `DB10_ANNOUNCEMENTS_READY === "DB10_VERIFIED"` (`readiness.ts:11`); TPO `createTpoNotice` writes to the same announcements module and the "From placement cell" filter keys on `senderLabel === "Placement cell"`. See section 5. |
| -50 | CONFIRMED | `registerOwnPlacementChoice` has no callers (its own header says "NOT yet wired to HTTP"); no learner route or UI. Chat-5 only added the TPO side (invitation and deadline). Worse than Round A states: the TPO invitation and reopen notification sends learners to `/learn/placements` ("Please record your choice"), which redirects to Home where nothing lets them register (`batch-participation-service.ts:517`). The invite is a dead end. S1 stands. |
| -51 | CONFIRMED | DB check constraint allows only the three request types (`placements.ts:1712`). |
| -52 | CONFIRMED | |
| -53 | CONFIRMED | `rules/page.tsx` still says vNext has no canonical college policy record, but `placement_college_rules` (`tpo-policy.ts`) exists and is already used by apply and offer gates. The page text is stale. |
| -54 | CONFIRMED | |
| -55 | CONFIRMED | |
| -56 | CONFIRMED | |
| -57 | CONFIRMED | |
| -58 | SEVERITY-CHANGE S3 to S4 | The company-preview half duplicates -28. The "who has my data" half: `getDataAccessLog` and `getAcademicRecord` are defined in `TpoHubService.js:191-192` but called nowhere in lms-dev-2026 `src` (git grep), so legacy has the API but no learner UI. Not a parity gap. |

## 3. MISSED gaps

| ID | Gap | Type | Severity | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| LEARNER-placements-R01 | Apply is blocked without saying why or what to do. Legacy `ApplyGate` returns a code, a sentence and an action per drive: NOT_IN_PLACEMENTS, REGISTER_FIRST ("Register for placements first. It takes a minute, and then you can apply." action REGISTER), REGISTRATION_NOT_OPEN, CHOSE_OTHER ("You told the placement cell you're not taking part ... Change that in Placement cell to apply."), BATCH_FINISHED, RULES (names the first failing rule), HELD_OFFER ("You already hold an offer. Your college's rules let you apply now only to a Dream drive or for a CTC at least N% higher ..."). Drives list also moves failing drives into "Not open to you" with the reason (apply-checks, up to 100 ids), and Home counts only drives that pass. vNext computes the same predicates (`canShowLearnerSelfApply` with registration state, debarment, participation, held-offer) but shows one of two strings: "Complete your placement academic evidence to apply." or "You do not currently meet this job's eligibility rules." A debarred, unregistered or offer-holding learner is told they fail eligibility rules. | STATE | S2 | `ApplyGate.java` (`check`, `Answer`); `LearnerEligibilityController.java:70-100`; `PlacementCascadePolicy.applyBlockedReason`; `JobsListContent.jsx:436-449`; `JobDetailContent.jsx:229-252`; `index.js:66-67` | `learner-placement-jobs.tsx:354-362`; `learner-job-service.ts:259-285`; `learner-job-availability-banner-model.ts` (generic kinds only) |
| LEARNER-placements-R02 | Accept-offer impact preview is missing, and Round A mis-describes vNext as having an "acceptance impact preview". Legacy calls `offer-accept-preview` and lists Withdrawn, Other offers declined and You stay in (with counts and notes) before "Yes, accept"; error state "We couldn't check what accepting will change" with "Check again". vNext's `learnerOfferAcceptancePreview` only re-validates the offer's own terms (company, role, CTC, joining, expiry, status) and shows them; nothing says other applications will be withdrawn and other offers declined. | MISSING-MODAL | S2 | `OfferCard.jsx:49-60,89-113`; `JobController.java:692-704` | `learner-offer-acceptance-preview.ts:1-37`; `learner-placement-offers.tsx:493-510`; server cascade `offer-service.ts:719-785` runs silently |
| LEARNER-placements-R03 | Accept cascade is unconditional and not rules-aware. Legacy `PlacementCascadePolicy.keepsOpen` keeps other applications open when the college's held-offer limit, uplift % or Dream tag still admit the drive, and never blocks drives whose type does not count as placed (internship). vNext, on accept, declines every other ISSUED offer and withdraws every other SUBMITTED application ("placed elsewhere") with no rules branch, no Dream, no internship exemption. Accepting an internship offer therefore ends all other applications irreversibly (the cascade id only supports staff compensation). | SIDE-EFFECT | S2 | `PlacementCascadePolicy.java:32-40`; `TpoOfferService.respondInApp` then `JobServiceImpl.respondToOffer` | `offer-service.ts:719-785` |
| LEARNER-placements-R04 | Learner-facing notification coverage is far below legacy. Legacy writes APP notices for about 27 events with student-wording text and a deep link per event (`LearnerPlacementService.TEXT` and `linkFor`): ROUND_SCHEDULED, ROUND_REMINDER, RESCHEDULE_DECIDED, OFFER_RELEASED, OFFER_EXPIRING, OFFER_EXPIRED, OFFER_WITHDRAWN, OFFER_ACCEPTED_REPORTED, ACCEPTANCE_REVERSED, DEADLINE_TODAY, DRIVE_PUBLISHED, DRIVE_UPDATED, DRIVE_CANCELLED, DRIVE_CLOSED, DRIVE_REMIND_NOT_APPLIED, APPLICATION_STATUS_CHANGED, APPLIED_ON_BEHALF, NOW_INELIGIBLE, REQUEST_DECIDED, MARKED_ABSENT, DEBARRED, REGISTRATION_OPEN, REGISTRATION_REMINDER, NUDGE, PREP_ASSIGNED, PROFILE_VERIFIED, PROFILE_SENT_BACK, PLACEMENT_ANNOUNCEMENT. In vNext the only learner in-app deliveries from the placements module are batch registration invite/reopen and "Placement offer received" (`deliverInAppNotificationInTransaction` has one placements caller: offer issue; batch-participation inserts directly). Round booked/moved, status changes, request decisions, drive cancelled/published/closing, absence and debarment send nothing, although the notification-preferences page offers "application updates" and "matching jobs" toggles. The two links that exist point to `/learn/placements` (Home) rather than Offers or the placement cell. | SIDE-EFFECT | S2 | `LearnerPlacementService.java:74-102,157-172`; `ApplyGate`/`TpoOfferService` bells | `offer-service.ts:538-548`; `batch-participation-service.ts:513-520`; `learner-placement-notification-service.ts`; grep of `src/modules/placements` for in-app deliveries |
| LEARNER-placements-R05 | Two inconsistent withdrawal paths and no SELF vs REQUEST rule. Drive detail sends a placement-team request ("Withdrawal requested", reason 3 to 2000 chars); application detail withdraws directly (reason 5 to 500 chars, "Confirm withdrawal"). Legacy: self-withdraw until booked into an unresolved round, then "Ask to withdraw" request to the placement cell (reason min 3, max 900), with copy "You leave {role} for good. The company and the placement cell are told. This cannot be undone." Same learner, same application, different outcome depending on page. | VALIDATION | S2 | `LearnerJourneyService.java:90-97,148-149`; `applications.js:82-89,178-190`; `JobDetailContent.jsx:446-480` | `learner-placement-jobs.tsx:176,235-262`; `learner-application-detail-withdraw.tsx:12-35`; `application-service.ts:1076-1081` |
| LEARNER-placements-R06 | Pay is shown only as a min/max annual CTC range. Legacy drive detail shows each package's own CTC, fixed/variable split, joining bonus and stipend per month ("Pay" fact). Schema already stores `fixed_lpa`, `variable_lpa`, `joining_bonus_lpa` on role options (`placements.ts:591-593`) but the learner views do not read them. | MISSING-FIELD | S3 | `JobDetailContent.jsx:666-693,1166-1200` | `learner-placement-job-detail.tsx` (no pay section); `learner-placement-jobs.tsx` (min/max only) |
| LEARNER-placements-R07 | Round time handling differs. Legacy treats a midnight round time as "day only, time to be told", ends a round at its slot end or start plus duration (default 60 min) before moving it to Past, and keeps it in Coming up while in progress. vNext Schedule prints every non-null date with a time ("12:00 am" for a day-only round) and puts a round in Past the moment its start time passes; no duration, no end time, no "time to be told". | STATE | S3 | `words.js:10-21,51-58`; `ScheduleCard.jsx:62-66`; `schedule.js:115` | `schedule/page.tsx:15-19` (`fmt`); `learner-placement-schedule-model.ts:21-26` |
| LEARNER-placements-R08 | Drives outside the learner's cohort/section are removed entirely (`targetedRows` filter) rather than listed under "Not open to you" with a reason. Legacy shows them collapsed with "This drive is for a different branch, program or batch. Open it to see its rules, or ask your placement cell if you think this is wrong." and lets the learner open the drive to see its rules. Possibly intentional (privacy, legacy V188); owner call. | STATE | S4 | `JobsListContent.jsx:195-203,663-682` | `learner-job-service.ts:204-225` |

## 4. WRONG and SEVERITY-CHANGE details

- A-19 WRONG: vNext page size is 20, equal to legacy (`learner-jobs-browse.tsx:20`). Remove the gap.
- A-45 SEVERITY-CHANGE S3 to S2: no letter field and no counts-as-placed field exist, which also blocks R03's internship rule. Needs schema (offer letter URL, drive `counts_as_placed`).
- A-58 SEVERITY-CHANGE S3 to S4: the learner data-access log has no legacy UI (definitions only in `TpoHubService.js:191-192`); company preview is already -28.
- Additional corrections to Round A narrative (no ID change): section 6 describes vNext as having an "acceptance impact preview" (see R02); A-29 premise (see verdict table); A-26 cross-reference (-52 should be -50).

## 5. UNCONFIRMED items and how to confirm (for the live dev-site check)

1. Announcements reach learners (A-49): check `DB10_ANNOUNCEMENTS_READY` in the dev deployment env; publish from `/tpo/announcements`, then open `/learn/my-placements/announcements` and `?source=placement-cell` as a seeded learner of the same college.
2. R04: on dev, as TPO release an offer, move an application status, schedule/move a round, cancel a drive and decide a request; then list the learner's in-app notifications (`/api/learn/notifications` or the bell). Expect only the offer one today.
3. R03: seed a learner with one ISSUED offer for an internship-type drive plus two SUBMITTED applications and one other ISSUED offer; accept the first and read the other applications' statuses.
4. R05: as a learner booked into a round, withdraw once from drive detail and once from application detail; compare outcomes and history rows.
5. R07: create a round with a date and no time (midnight IST) and one with a 2 hour slot; view Schedule at start+30 min.
6. Whether `workspace.rounds` (Schedule data) includes TALK rounds and rounds of withdrawn or rejected applications (`request-service.ts:1194` onward); seed a talk round and a withdrawn application.
7. Whether vNext notifies the TPO (bell/activity) when a learner accepts, declines, withdraws or raises a request (legacy `audit.bell` in `respondInApp` and request creation). Check TPO notification list after each learner action.
8. Held-offer facts include verified off-campus placements as legacy `heldCtcs` does (`held-offer-facts-service.ts`): record an external placement for a learner and check Apply availability on a lower-CTC drive.
9. Keyboard and screen reader behaviour: legacy application header is `role=button` with Enter/Space; confirm vNext applications drawer and drive filters at 375 px and 1280 px.
10. Emails: legacy registration reminders and nudges may also email (outbox channel); confirm whether any learner email is sent for the events in R04 on dev.
