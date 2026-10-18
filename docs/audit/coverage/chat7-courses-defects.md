# Chat-7 courses and learner hardening defects

As-of 2026-10-18. These are **source-reviewed defects and authored regression tests**, not verified green CI or real-PostgreSQL/browser acceptance. Branch: `chatgpt/chat-7-b`. Scope: learner Courses, quizzes, assignments, discussions, and Super Admin course content pages.

| Defect | Severity / impact | Fix commit and source evidence | Regression |
|---|---|---|---|
| COURSES-WEAK-DELIVERY-ROSTER-01 | S2 test false failure: matcher rejected a valid comma after `scope.academicPeriodId` despite exact SQL equality | `68d9e140`; assertion tolerates optional trailing comma while preserving the scope guard | `tests/unit/chat7-course-delivery-roster-weak.test.ts` |
| LEARNER-courses-roster-01 | S1 potential audience mismatch: learner course list lacked full offering/Section/cohort/period ancestry checks | `dd60d810`; `src/modules/courses/learner-course-service.ts` binds offering cohort and period | `tests/unit/chat7-learner-course-delivery-security.test.ts` |
| LEARNER-COURSE-ACCESS-01 | S1 potential stale role/tenant read: delivery authorization trusted a signed-in learner context without re-reading active membership role and user status | `e7f41252`; `src/modules/courses/learning-access.ts` | `tests/unit/chat7-learner-live-access-behaviour.test.ts` |
| LEARNER-COURSE-INSTRUCTORS-01 | S2 revoked faculty role could remain on a learner-facing roster | `7ca3f6e2`; persisted FACULTY role and active staff status required | `tests/unit/chat7-learner-course-delivery-security.test.ts` |
| LEARNER-COURSE-NOTICES-01 | S2 old/withdrawn Section could still appear eligible to read class notices; malformed ID could reach UUID SQL | `02f7890f`, `dde13c7d`; active Section/cohort/period plus live learner, UUID validation | `tests/unit/chat7-learner-announcements-scope.test.ts` |
| LEARNER-DISCUSSIONS-RACE-01 | S1 potential write-after-revocation during course discussion post/delete | `2ac6a6d8`; transaction-scoped persisted role, account and college lock | `tests/unit/chat7-learner-discussion-revocation-races.test.ts` |
| LEARNER-QUIZ-DRAFT-01 | S2 untrusted restored drafts accepted prototype-sensitive keys and unchecked oversized input | `117c64c2`, `f02dae5e`; bounded storage and own-property answer lookup | `tests/unit/chat7-quiz-draft-embargo-security.test.ts` |
| LEARNER-QUIZ-KEY-01 | S1 possible authored answer disclosure if shuffle input includes `correct` or other runtime properties | `6f1c0f4f`; allowlist-only learner question/option projection | `tests/unit/chat7-learner-quiz-answer-key-leak.test.ts` |
| LEARNER-LIVE-LINK-01 | S2 legacy unsafe external meeting URL could leave learner service unsanitized | `1399ddb7`; safe URL read boundary | `tests/unit/chat7-learner-media-notice-boundary.test.ts` |
| LEARNER-CARDS-CONCURRENCY-01 | S2 NaN concurrency silently hid all valid learner course cards | `c4983827`; finite bounded worker pool | `tests/unit/chat7-learner-course-card-concurrency.test.ts` |
| LEARNER-ASSESSMENTS-CLASS-01 | S2 archived/mismatched Section counted as a present current class | `205a1cbc`; active Section matching cohort and period | `tests/unit/chat7-learner-assessment-class-state.test.ts` |
| SA-academics-people-62 | S2 Super Admin content wrongly labelled visible even when Course or parent learning path was unpublished | `2b476170`, `a0bdb93b`, `0c1862c7`; full ancestor status carried into badge | `tests/unit/chat7-superadmin-effective-content-visibility.test.ts` |
| SA-academics-people-67 | S2 per-learner progress could include wrong Section eligibility/denominator and falsely mark exactly 500 rows truncated | `3f10be09`, `0f54c13a`; eligible-delivery numerator and denominator, 501 sentinel | `tests/unit/chat7-superadmin-progress-roster-security.test.ts` |

## Not closed

- `SA-academics-people-50`: new course metadata implemented, binary image/replace/delete requires provisioned private scanned storage.
- `SA-academics-people-53`: selected-course content visibility works, but native persisted whole-course student-visibility state and future-content inheritance need parity verification.
- `SA-academics-people-60`: external URL video ingestion needs SSRF-safe private download and scanner; do not pretend an HTTPS link is a completed import.
- `SA-academics-people-64/65`: direct builder, submissions, grading and result-release actions exist; full legacy modal/destructive/bulk lifecycle remains under review.
- `COURSES-WEAK-DELIVERY-ROSTER-01`: new regression logic is written but the orchestrator's published failure file predates its rerun.
- PostgreSQL concurrency, uploaded-file/scanner setup, live browser focus/mobile walkthroughs and the remaining course/exported-function coverage are not claimed complete.

## Owner priority queue — incremental source defects (2026-10-18)

| ID | Severity | Root cause and user impact | Code fix / evidence | Verification |
|---|---|---|---|---|
| PROJ-BREAK-LEARNER-96 | S2 | Stale or malformed Board filters were silently reset to All, unexpectedly showing a larger task set | `3a76248c` `src/app/(authenticated)/learn/projects/[projectId]/page.tsx` now checks the learner project grant first and returns actionable Invalid Board filters UI; `tests/unit/PROJ-BREAK-chat7-learner-board-filters-and-scroll.test.ts` | Authored; no CI/browser run |
| PROJ-BREAK-LEARNER-97 | S2 | Invisible horizontal Board scrollbar had no phone hint or named keyboard scroll target | `a63a9e3d` `src/components/projects/learner-board-interactive.tsx`; same PROJ-BREAK test, `tests/unit/UX-chat7-learner-scroll-motion-01.test.ts` | Authored; 320px and keyboard real-browser walk pending |
| PROJ-BREAK-LEARNER-98 | S1 | `/learner-progress` permitted backwards `TODO` transitions disallowed by the established task lifecycle, including drag/Undo bypass | `1abba97f`, `3144b0d9` now reuse `canLearnerMoveOwnTask` for both services and Board controls, reject TODO destinations, max 2,000-character blocker, and render Undo only for legal transitions; `tests/unit/PROJ-BREAK-chat7-learner-progress-transition-matrix.test.ts` | Authored; PostgreSQL atomic state-race run pending |
| UX-LEARN-scroll-01/02 | S3 | Long semester course/credit and submitted quiz lists offered no visible hidden-scrollbar cue or keyboard region | `719e4381`, `e1fad11e`, `tests/unit/UX-chat7-learner-scroll-motion-01.test.ts` | Authored; phone/browser pending |
| SA-academics-people-53 | S1 | Published-course bulk visibility unexpectedly changed `DRAFT` lesson-content flags, affecting future visibility; unpublished path ancestry was also included | `4616b4ab`, `93fb9964`: `super-admin-lesson-bulk-visibility.ts` restricts updates to PUBLISHED content under active Course/Offering/Lesson and PUBLISHED path; `89427dc0` clarifies current-only UI; `tests/unit/chat7-superadmin-bulk-published-only.test.ts` | Authoring/source repaired; whole-course persisted override and PostgreSQL race not implemented, SA-53 remains PARTIAL |
| SA-academics-people-64 | S2 | Quiz-only results query could reach assignment aggregate and render an error instead of a filter recovery state | `5c2eeee7` `admin/assignments/page.tsx` validates results=ALL before data load; `tests/unit/chat7-superadmin-course-assessment-ux-boundaries.test.ts` | Authored, browser pending |
| SA-academics-people-64/65 | S3 | Grade publish and quiz attempt controls were 40px and long quiz attempt panels lacked visible overflow cue | `81b60c2e`, `7fc4be15`: 44px controls, named focusable attempt scroll with cue, `tests/unit/chat7-superadmin-course-assessment-ux-boundaries.test.ts` | Authored; full grade/book modal parity still PARTIAL |

Unaddressed in this batch: course binary image replacement, backend SSRF-safe video ingestion, persisted future whole-course student-visibility policy, full Super Admin quiz builder/modal parity, real PostgreSQL concurrency/replay and 320px device sign-off. Owner postponed CI until full lane queue completion; do not interpret authored tests as green.

## SA-academics-people-53 bulk scope/size recovery follow-up

New defect: **SA-COURSES-BULK-ERROR-01 (S2)**. Bulk visibility had two untyped exceptions: a foreign or inactive Course ID raised `COURSE_SCOPE_OR_STATE_INVALID` as a raw Error; selecting more than 500 matched lessons raised another raw Error. The shared API error boundary consequently returned a generic 500 instead of a recoverable validation/not-found response. Commit evidence: `69818dc0` (new domain code), `2c591241` (404 for foreign/inactive and typed size error), `1703d99c` (same typed size error for lesson fan-out), `9f037684` (HTTP 400 mapping), `ecc7f75c` (accessible remedial copy). `tests/unit/chat7-superadmin-course-bulk-typed-boundaries.test.ts` covers selected-college/role scope, 100-ID confirmation cap, 501-lesson cap, partial retries and customer-safe HTTP 400/404 response. Test authored; end-to-end run pending.

The underlying **SA-academics-people-53 persisted future-course visibility** remains only partial. The new bulk controls deliberately mutate only current published content; they do not create or claim inheritance onto new lesson materials. That behavior is now explicitly explained in the page, avoiding accidental future-release surprises.

## LEARNER-QUIZ-WORKSPACE-EMBARGO-01

**S1, fixed at source:** The course workspace read path projected `courseQuizzes.resultsPublished` directly. A faculty-published result flag could therefore surface in the course lesson overview even while the Quiz remained PUBLISHED or before its required due-time embargo. Other learner endpoints already had the stricter `learnerQuizResultsReleased` policy. Commit `ef466ac6` changes `getLearnerCourseWorkspace` to call `learnerQuizResultsReleased(row,snapshotNowMs)`; `tests/unit/chat7-learner-course-quiz-release-consistency.test.ts` exercises the deadline/closure/publication matrix and confirms source policy parity. Authored but CI/PG unverified.

**S1, fixed at source:** `getLearnerCourseFileReference` did not enforce `lessonContents.startsAt` when issuing a private R2 object key for a published future-scheduled resource. Commit `0020b94e` adds PostgreSQL `now()` embargo checking and `b95ed8aa` rejects duplicate/unknown signed-download flags. See `tests/unit/chat7-learner-course-file-embargo.test.ts` and `chat7-learner-course-file-route-boundaries.test.ts`. Tests not run, R2 untouched.

## Learner signed access and certification parity (subsequent source audit)

| ID | Severity | Observed defect | Committed change / regression |
|---|---|---|---|
| LEARNER-COURSE-FILE-SCOPE-03 | S1 | File-reference lookup checked enrolled/published content and schedule but did not restrict `contentType`; a known VIDEO content ID could request a general-purpose short signed GET outside the video's dedicated playback-grant path | `6897bc47` restricts direct file links to `RESOURCE`; `tests/unit/chat7-learner-course-file-embargo.test.ts` now asserts the VIDEO exclusion. Real R2 and cross-tenant PG integration pending. |
| LEARNER-FILE-GRANT-05 | S2 | Browser upload-grant validation allowed arbitrary extra `x-amz-meta-*` headers, exceeding the signed exact metadata contract | `f05aaf9d` enforces the exact expected six headers; `tests/unit/learner-assignment-file-model.test.ts` covers unexpected metadata denial. |
| LEARNER-VIDEO-GRANT-02 | S2 | Existing video-grant refresh could wait a whole second when fewer milliseconds remained before expiry; changing it to immediate renewal needs to avoid a tight loop for misconfigured short TTL grants | `8ead7bd3`, `01ef20b5` use immediate refresh only inside last second and 1-second bounded retry for short grants; `tests/unit/learner-video-grant-model.test.ts`. |
| SA-COURSES-BULK-PUBLISHED-06 / SA-COURSES-BULK-SCOPE-07 | S2 | Bulk mutation limits counted draft contents and draft learning paths and course fan-out did not independently check academic-period tenant lineage | `e14fb8b6`, `b8b7e69b`, `c125602c` constrain published/active scoped candidates in SQL; `tests/unit/chat7-superadmin-bulk-published-only.test.ts`, `chat7-superadmin-course-bulk-typed-boundaries.test.ts`. |
| LEARNER-CERT-EXPIRY-01 | S2 | Learner profile certification validation accepted expiry dates equal to or earlier than issue date despite explicit legacy warning | `34710259` enforces strict issue/expiry ordering, including exact calendar date handling, `tests/unit/chat7-learner-certification-date-parity.test.ts`. |

All regressions are *authored, not yet run* under the owner’s no-CI-until-final directive. Remaining debt includes real PostgreSQL race tests, scanner/object-store integration, final 320px/keyboard walkthrough and native future whole-course visibility inheritance.

## Learner course resource URL audit (2026-10-18)

**LEARNER-RESOURCE-LINK-08 — S2:** Prior `resourceMaterialLinkSchema` allowed credential-free HTTPS URLs to loopback and private-network targets, and `listLessonResourceMaterials` returned historical stored LINK `externalUrl` values without a safe read projection. Even without a server-side fetch, a learner clicking those links could target their own private network or cloud metadata endpoints. `b19c9c0b` rejects localhost and private IPv4/loopback IPv6 destinations during authoring and adds `safeLearnerResourceMaterialHref`; `14fd0b04` sanitizes historic LINK values before API response. `tests/unit/chat7-learner-resource-material-link-boundary.test.ts` asserts valid HTTPS, private-network denial, strict command payloads, feature readiness and server read sanitization. **Authored, CI/PG/browser pending;** no actual HTTP request to a private URL occurred.

## HTTP and stale-client scope safety — follow-up

| ID | Severity / cause | Source fix | Regression |
|---|---|---|---|
| LEARNER-RESOURCE-QUERY-09 | S2 repeated or unexpected `deliveryId` query parameters were accepted via `URLSearchParams.get`, leaving ambiguous audience scope | `9b890045` strict one-scope query schema for GET/POST with 400 on invalid values | `tests/unit/chat7-learner-resource-material-query-route.test.ts`; authored, not run |
| LEARNER-RESOURCE-POST-11 | S2 material mutation parsed arbitrarily large HTTP JSON bodies before schema validation | `b7e69ed5`, `f9ed4238`: 16 KiB true UTF-8 streaming cap, malformed/nonobject body 400, same-origin route guard unchanged | `tests/unit/chat7-resource-material-json-boundary.test.ts`, route test; authored, not run |
| LEARNER-RESOURCE-SCOPE-12 | S1 mounted client material list retained the old Section's private rows and could be overwritten by stale completed fetches after an acting-college switch | `b9d5fbf9` clears prior material/draft/edit state on URI change and guards async fetch, reload, error and notice completion against the active URI | `tests/unit/UX-chat7-resource-scope-privacy.test.ts`; real browser two-scope navigation still pending |
| UX-LEARN-RESOURCE-10 | S3 resource links, Save/Remove/Edit controls and input targets could be below the 44px mobile target | `53888b69` raises all direct material controls to 44px | `tests/unit/UX-chat7-resource-material-touch-10.test.ts`; device signoff pending |

## Mobile assessment and catalogue touch audit

- **LEARNER-DEADLINE-MOBILE-14 (S2):** Learner quiz and assignment mobile status treated the due instant as still available because comparison was strictly `due < now`, whereas server submission/attempt gates close at equality. `a8d38913`, `8da3281c` align to `due <= now`, with exact 1ms boundary, no-deadline, published-results tests in `tests/unit/chat7-learner-mobile-deadline-boundaries.test.ts`.
- **SA-COURSES-TOUCH-13 (S3):** Super Admin Course catalogue's Filter, CSV, Refresh, pagination, and Open learning controls rendered with 36–40px minimum heights on touch devices. `0b218337` raises them to 44px; `tests/unit/chat7-superadmin-course-catalogue-touch-pagination.test.ts` verifies touch targets and safe catalogue sorting/page clamping.

Authored-only under the owner’s no-CI policy; phone/browser acceptance remains pending.

## Learner thumbnail URL privacy

**LEARNER-THUMBNAIL-15 (S2):** The learner Course card accepted any credential-free HTTPS thumbnail host, including loopback, RFC1918/private and cloud metadata endpoints, and allowed fragments from imported legacy URLs. Browsers could be induced to request a learner's local network when merely loading Course cards. `0db8bd4e` now falls back to the bundled course illustration for local/private/fragment-containing image addresses; `tests/unit/learner-course-card-media-model.test.ts` covers the URL matrix. No privileged server fetch occurs and no image was externally fetched during this source-only audit.
