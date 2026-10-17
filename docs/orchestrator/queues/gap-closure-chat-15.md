# Gap-closure queue chat-15 (reassigned rebalance)

Follow docs/orchestrator/briefs/gap-closure-lane.md exactly. These OPEN gaps are yours now (page groups: learner/learning-misc, learner/placements, learner/course-detail). Look each ID up in docs/audit/gap-register.md for the legacy behaviour, implement with exact legacy wording, add tests named with the gap ID and an acceptance note in docs/audit/acceptance/<account>-<page>-verification.md. Push to chatgpt/chat-15-b.

- LEARNER-course-detail-03 (S2) 
- LEARNER-course-detail-05 (S3) 
- LEARNER-course-detail-08 (S3) 
- LEARNER-course-detail-09 (S3) 
- LEARNER-course-detail-12 (S4) 
- LEARNER-course-detail-13 (S4) 
- LEARNER-course-detail-14 (S3) 
- LEARNER-course-detail-15 (S3) 
- LEARNER-course-detail-16 (S3) 
- LEARNER-course-detail-17 (S3) 
- LEARNER-course-detail-19 (S3) 
- LEARNER-course-detail-20 (S4) 
- LEARNER-learning-misc-01 (S1) Mentioned in docs/audit/acceptance/learner-learning-misc-verification.md but not cited by a commit on main; not marked VERIFIED.
- LEARNER-learning-misc-02 (S2) 
- LEARNER-learning-misc-04 (S2) 
- LEARNER-learning-misc-07 (S2) 
- LEARNER-learning-misc-11 (S3) 
- LEARNER-learning-misc-12 (S4) 
- LEARNER-learning-misc-13 (S4) 
- LEARNER-learning-misc-15 (S3) 
- LEARNER-learning-misc-16 (S3) 
- LEARNER-learning-misc-19 (S3) 
- LEARNER-learning-misc-24 (S3) 
- LEARNER-learning-misc-27 (S3) 
- LEARNER-learning-misc-28 (S4) 
- LEARNER-learning-misc-29 (S4) 
- LEARNER-learning-misc-34 (S3) 
- LEARNER-placements-01 (S3) Mentioned in docs/audit/acceptance/learner-placements-verification.md but not cited by a commit on main; not marked VERIFIED.
- LEARNER-placements-03 (S3) 
- LEARNER-placements-05 (S3) 
- LEARNER-placements-09 (S3) 
- LEARNER-placements-28 (S2) 
- LEARNER-placements-30 (S3) 
- LEARNER-placements-33 (S4) 
- LEARNER-placements-41 (S3) 
- LEARNER-placements-43 (S3) 
- LEARNER-placements-51 (S2) 
- LEARNER-placements-52 (S2) 
- LEARNER-placements-R03 (S2) 
- LEARNER-placements-R04 (S2) 
- LEARNER-placements-R08 (S4) 

## Chat-15 verified closure group A

LEARNER-course-detail-08, LEARNER-course-detail-09, LEARNER-course-detail-13, LEARNER-course-detail-14, LEARNER-course-detail-15, LEARNER-course-detail-16, LEARNER-course-detail-20, LEARNER-placements-03, LEARNER-placements-05 — source completed, ID-named tests added; not run by builder.

## Chat-15 reassigned closure B1

- DONE (source): LEARNER-learning-misc-13, LEARNER-learning-misc-29. Legacy assignment date labels and quiz submitted popover. Test: tests/unit/chat15-assessment-legacy-copy.test.ts (not run).

## Chat-15 closure group B2

- DONE source: LEARNER-placements-09, LEARNER-placements-33. PARTIAL LEARNER-course-detail-12 (six playback rates; platform-tunable save cadence still outstanding). `tests/unit/chat15-player-and-placement-copy.test.ts` (authored, not run).

## Chat-15 missed quiz closure group C

- SOURCE DONE: LEARNER-learning-misc-24, LEARNER-course-detail-17, LEARNER-learning-misc-27, LEARNER-learning-misc-28. Missed learners may review only after CLOSED, results published, and due date elapsed; standalone read-only answer key, no submission; progress per question desktop and mobile. `tests/unit/chat15-missed-quiz-release.test.ts` names each ID (tests not run).

## Chat-15 placement group D

SOURCE DONE: LEARNER-placements-R03 (policy-aware acceptance cascade already built, independently test-named). PARTIAL: LEARNER-placements-30 (origin banner without opt-out request type); LEARNER-placements-52 (absence escalation without registered dispute request type); LEARNER-placements-41 (safe test link, no verified deadline); LEARNER-placements-28 (company privacy footer, no dedicated company-preview data source). Tests authored but not run.

## Chat-15 learner quiz table group E

- SOURCE DONE LEARNER-learning-misc-16: seven-column accessible desktop table, mobile card alternative, grade withheld pending result publication, real quiz links. `tests/unit/chat15-quiz-table-legacy.test.ts` names the ID; authored not executed.

## Chat-15 learner alerts group F

- SOURCE DONE LEARNER-placements-01: personal placement alert open now uses recipient-scoped POST /api/notifications/[notificationId]/read before navigating, with an explicit mark-read button when no action link and a retryable friendly failure message. `tests/unit/chat15-personal-placement-alert-read.test.ts`, not executed. The separate global badge refreshes after mutation; college broadcast notices are NOT silently acknowledged by a GET.

## Chat-15 class scope group G

- SOURCE DONE LEARNER-learning-misc-19: read authoritative ACTIVE section enrollment independently of published course delivery, display legacy no-class copy only when truly absent, failed read with Retry, and generic no-quizzes when section exists; named test tests/unit/chat15-class-scope-quiz-empty.test.ts (not run).

## Chat-15 calendar range group H

- PARTIAL LEARNER-learning-misc-34: class schedule now fetches only the selected three-month IST window (previous/current/next month, including week spillover) with strict 100-day bound and SQL overlap predicate; attendance calendar still needs similar bounded query. `tests/unit/chat15-calendar-window-bounds.test.ts` authored, not run.

## Chat-15 2026-10-17 verification ledger (not runtime-certified)

The historical OPEN list above is the reassigned queue; this ledger records actual source progress without equating authored tests with executed, database-backed acceptance. No main-branch changes have been made by this lane. All named source tests were authored, not executed here. Migration `docs/proposed-migrations/learner-general-placement-requests.sql` must be numbered, registered and PostgreSQL replayed by the orchestrator before requests `-43/-51/-52` can be certified.

| Gap ID | Current source status | Evidence / blocker |
|---|---|---|
| LEARNER-course-detail-03 | OPEN | Instructor-provided resource read path missing |
| LEARNER-course-detail-05 | OPEN | Rich-text/Drive import/submission discard details unresolved |
| LEARNER-course-detail-08 | SOURCE-DONE | chat15-reassigned-learner-parity.test.ts |
| LEARNER-course-detail-09 | SOURCE-DONE | chat15-reassigned-learner-parity.test.ts |
| LEARNER-course-detail-12 | PARTIAL | Rate selection present; platform-tunable cadence/threshold missing |
| LEARNER-course-detail-13 | SOURCE-DONE | chat15-reassigned-learner-parity.test.ts |
| LEARNER-course-detail-14 | SOURCE-DONE | chat15-reassigned-learner-parity.test.ts |
| LEARNER-course-detail-15 | SOURCE-DONE | chat15-reassigned-learner-parity.test.ts |
| LEARNER-course-detail-16 | SOURCE-DONE | chat15-reassigned-learner-parity.test.ts |
| LEARNER-course-detail-17 | SOURCE-DONE | chat15-missed-quiz-release.test.ts |
| LEARNER-course-detail-19 | OPEN | Graceful partial-failure read and retry states missing |
| LEARNER-course-detail-20 | SOURCE-DONE | chat15-reassigned-learner-parity.test.ts |
| LEARNER-learning-misc-01 | BLOCKED | Private scanned object storage integration required |
| LEARNER-learning-misc-02 | OPEN | Faculty-authored resource attachments absent |
| LEARNER-learning-misc-04 | OPEN | Multi-part combined submission not yet complete for all methods |
| LEARNER-learning-misc-07 | OPEN | Source/Notebook upload type policy differs from legacy |
| LEARNER-learning-misc-11 | OPEN | Rich-text editor response authoring absent |
| LEARNER-learning-misc-12 | OPEN | Google Drive file import absent |
| LEARNER-learning-misc-13 | SOURCE-DONE | chat15-assessment-legacy-copy.test.ts |
| LEARNER-learning-misc-15 | OPEN | Server-side page filtering not implemented |
| LEARNER-learning-misc-16 | SOURCE-DONE | chat15-quiz-table-legacy.test.ts |
| LEARNER-learning-misc-19 | SOURCE-DONE | chat15-class-scope-quiz-empty.test.ts |
| LEARNER-learning-misc-24 | SOURCE-DONE | chat15-missed-quiz-release.test.ts |
| LEARNER-learning-misc-27 | SOURCE-DONE | chat15-missed-quiz-release.test.ts |
| LEARNER-learning-misc-28 | SOURCE-DONE | chat15-missed-quiz-release.test.ts |
| LEARNER-learning-misc-29 | SOURCE-DONE | chat15-assessment-legacy-copy.test.ts |
| LEARNER-learning-misc-34 | PARTIAL | Schedule and calendar bounded by IST window; general attendance history unbounded |
| LEARNER-placements-01 | SOURCE-DONE | chat15-personal-placement-alert-read.test.ts |
| LEARNER-placements-03 | SOURCE-DONE | chat15-reassigned-learner-parity.test.ts |
| LEARNER-placements-05 | SOURCE-DONE | chat15-reassigned-learner-parity.test.ts |
| LEARNER-placements-09 | SOURCE-DONE | chat15-player-and-placement-copy.test.ts |
| LEARNER-placements-28 | PARTIAL | Company profile is not the actual employer-visible selected applicant projection |
| LEARNER-placements-30 | PARTIAL | Staff applied tag; opt-out lifecycle not verified |
| LEARNER-placements-33 | NOT-A-GAP | OD-38 approves additional vNext count tiles |
| LEARNER-placements-41 | PARTIAL | Assessment link visible; persisted due date not confirmed |
| LEARNER-placements-43 | SOURCE-DONE | chat15-learner-general-requests.test.ts; schema proposal unregistered |
| LEARNER-placements-51 | SOURCE-DONE | chat15-learner-general-requests.test.ts; schema proposal unregistered; scanned letter attachment blocked |
| LEARNER-placements-52 | SOURCE-DONE | chat15-learner-general-requests.test.ts; schema proposal unregistered |
| LEARNER-placements-R03 | SOURCE-DONE | chat15-placement-policy-and-escalation.test.ts |
| LEARNER-placements-R04 | OPEN | Twenty-seven placement event notification families not yet all wired |
| LEARNER-placements-R08 | NOT-A-GAP | OD-38 protects out-of-audience drive privacy |

This reconciliation is not a claim that all 41 gaps are closed. Final VERIFIED decisions require orchestrator tests, migration registration where applicable, and application acceptance.

## Chat-15 follow-up after ledger

- LEARNER-placements-28: SOURCE-DONE after the ledger entry; `tests/unit/chat15-company-shared-preview.test.ts` is new and ID-named. Runtime verification outstanding.
- LEARNER-placements-30: PARTIAL improvement; staff-sourced application now has a direct safe route to confirmed withdrawal or request, but an explicit opt-out deadline remains unresolved.
- LEARNER-placements-43: SOURCE-DONE with externally reported acceptance-dispute window; the companion `-43/-51/-52` general-request migration is proposed, not registered or replayed.

- LEARNER-learning-misc-04: SOURCE-DONE after ledger. See `tests/unit/chat15-multipart-no-file.test.ts`, `assignment-submission-file-service.ts`, `assignment-method-policy.ts` and the one-shot learner control. Runtime tests not executed in this connector session.


## Chat-15 last reconciled result (source review only)

- 25 IDs SOURCE-DONE (including the follow-up improvements for LEARNER-placements-28 and LEARNER-learning-misc-04); source tests are authored, but not executed or runtime-accepted.
- 2 IDs NOT-A-GAP by recorded owner decision: LEARNER-placements-33 and LEARNER-placements-R08.
- 4 PARTIAL: LEARNER-course-detail-12, LEARNER-learning-misc-34, LEARNER-placements-30, LEARNER-placements-41.
- 1 BLOCKED: LEARNER-learning-misc-01, scanned private object storage.
- 9 remain OPEN: LEARNER-course-detail-03/05/19; LEARNER-learning-misc-02/07/11/12/15; LEARNER-placements-R04.

The SOURCE-DONE label does not replace test, DB replay or deployment verification. The general request schema proposal for LEARNER-placements-43/51/52 still requires registered migration and full PostgreSQL acceptance. No unexecuted test has been recorded as passing.

## Chat-15 follow-up after migration 0134

Registered on origin/main: `drizzle/0133_*`, `drizzle/0134_lanes_round_2.sql`. Do not treat previous `LEARNER-placements-43/51/52` general-request **table** as unavailable. Source/test remain unexecuted and request categories without implemented specialist effects must never auto-approve.

- LEARNER-course-detail-12: SOURCE-DONE, see `tests/unit/chat15-learner-playback-settings.test.ts`; configurable threshold and save interval used by server and both players.
- LEARNER-course-detail-19: SOURCE-DONE, see `tests/unit/chat15-course-state-and-staff-optout.test.ts`; lessons persist across optional assessment state read failures.
- LEARNER-course-detail-05 and LEARNER-learning-misc-11: PARTIAL, see `tests/unit/chat15-learner-rich-response.test.ts`; formatted text editing and safe display, not full HTML WYSIWYG/Drive or attachment parity.
- LEARNER-learning-misc-34: SOURCE-DONE, `tests/unit/chat15-calendar-window-bounds.test.ts`; attendance detail and calendar each bounded to selected IST month.
- LEARNER-placements-30: PARTIAL, `tests/unit/chat15-course-state-and-staff-optout.test.ts`; persisted staff-origin and 48-hour IST deadline now shown, cutoff-enforced opt-out service remains.
- LEARNER-learning-misc-07: OPEN; needs owner of `src/modules/storage/file-policy.ts` (this lane may not modify storage) to align source-code/notebook/archive allowance with malware scanning.
- LEARNER-learning-misc-12: BLOCKED: Google Drive OAuth/provider credentials plus private scan-backed import. Do not silently substitute a Drive URL.
- LEARNER-course-detail-03, LEARNER-learning-misc-02: OPEN: instructor assignment material authoring/attachments need dedicated relation and safe learner read-grants; existing lesson RESOURCE materials cannot be misrepresented as assignment-scoped files.
- LEARNER-learning-misc-15: OPEN: replace all-course workspace fanout with server-side course-filtered paginated SQL.
- LEARNER-placements-41: OPEN: no authoritative assessment submission deadline in the current placement round schema; `resultsDueAt` is the *results* deadline and must not be mislabeled `Take it by`.
- LEARNER-placements-R04: OPEN: 27 placement learner event families require durable recipient-scoped notification writes in the corresponding mutators, not GET-time invented notices.
- LEARNER-course-detail-05: remaining Google Drive/assignment resource gaps noted above. LEARNER-learning-misc-01 remains BLOCKED on private bucket+malware scanner.

Gap-register additional learner OPEN rows not assigned to chat-15 are `LEARNER-home-courses-02/03/18/22`, `LEARNER-course-detail-R03/R04` under learner/home-courses, and `LEARNER-profile-misc-02/08` (chat-7 owns those pages; do not duplicate). The current gap register shows 47 OPEN learner IDs: 39 are on this lane's three reassigned pages and eight are on chat-7's home-courses/profile-misc pages. The historical chat-15 queue lists 41 assigned IDs, two of which no longer have OPEN status in the register.
