# Chat-7 course and learner hardening ledger

Source-reviewed for the **Learner role journey** and Super Admin courses/content audit. This is an incremental scope ledger, not a claim that every exported course module function is covered. The lane cannot execute tests locally; cloud CI and real PostgreSQL remain the authoritative execution gates.

| Surface or exported entry | Tenant / role / data-integrity contract | Gap-named test evidence | Status |
|---|---|---|---|
| `listActiveDeliveryLearners` in `src/modules/courses/delivery-roster.ts` | Elective and Section rosters use the exact authorized delivery, college, cohort and period; an inactive/deleted elective **never** falls through to the full Section roster; active learner membership and account required | `tests/unit/chat7-course-delivery-roster-weak.test.ts` (`COURSES-WEAK-DELIVERY-ROSTER-01`) | Authored, CI pending |
| `getSuperAdminStudentCourseProgress` in `src/modules/courses/super-admin-student-course-progress.ts` | Requires Super Admin + acting college + courses.read; selected offering belongs to that college; only active learner membership from current Section/cohort/period and non-ended deliveries included; 501-row sentinel detects real truncation at 500 | `tests/unit/chat7-superadmin-progress-roster-security.test.ts` (`SA-academics-people-67`), `tests/unit/chat7-final-sprint-superadmin-courses-content.test.ts` | Authored, PostgreSQL integration still required |
| `studentCourseCompletion` in `src/modules/courses/super-admin-student-progress-model.ts` | No measured items gives `null`, not invented 0%; counts are bounded by published item denominators | `tests/unit/chat7-superadmin-progress-roster-security.test.ts` (`SA-academics-people-67`) | Authored, CI pending |
| `exportCollegeAssessments` in `src/modules/courses/college-assessment-export-service.ts` | Keep authorized request context/kind on every page; validate kind-specific filters and cap at 1,000 rows | `tests/unit/chat7-college-assessment-export-service-weak.test.ts` (`COURSES-WEAK-EXPORT-SERVICE-01`) | CI reports two failures on old snapshot; source reinspection shows paging/cap guards; verify on new branch CI |
| `FacultyQuizReportPage` in `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx` | Quiz title remains dynamic; exact headings, privacy gate and empty states | `tests/unit/chat7-legacy-faculty-quiz-report-copy.test.ts` | CI reports a failure on old snapshot; reinspection confirms expected headings; requires rerun |
| `CollegeAssignmentActions` in `src/components/courses/college-assignment-actions.tsx` | Explicit changes and stale-version conflicts; never render unexpected raw API errors; edit draft retained on failed save | `tests/unit/chat7-superadmin-assessment-friendly-errors.test.ts` (`SA-academics-people-64`) | Authored, CI pending |
| `CollegeQuizActions`, `CollegeQuizAttempts` in `src/components/courses/` | Friendly errors on metadata/attempt reads and updates; independent retry without showing server details | `tests/unit/chat7-superadmin-assessment-friendly-errors.test.ts` (`SA-academics-people-65`) | Authored, CI pending |
| Super Admin courses/content final-sprint surfaces | Create/edit metadata, bulk visibility, lesson builder, quizzes, assignments, per-student progress; private scanned binary/URL ingestion deliberately gated | `tests/unit/chat7-final-sprint-superadmin-courses-content.test.ts`, `chat7-final-sprint-superadmin-course-visibility.test.ts` and corresponding acceptance | Partial: SA-50 imagery, SA-53 whole-course visibility, SA-60 external ingest still incomplete or blocked |

## Outstanding verification / defects

- **COURSES-WEAK-EXPORT-SERVICE-01:** two reported unit failures require a fresh CI result; no assertion weakened or deleted. The collector already projects the same request context and assessment kind on each page and clamps the export to 1,000.
- **COURSES-WEAK-DELIVERY-ROSTER-01:** inactive-elective fallback and mismatched offering delivery guards were repaired on `chatgpt/chat-7-b`; mock fixtures now reflect actual ACTIVE/deleted flags. Add real-PostgreSQL tenant/role cross-check before release.
- **SA-academics-people-67:** previous roster SQL lacked persisted LEARNER role and did not bind enrolments to the offering cohort; these checks and accurate truncation were added. Published item denominators for mixed section-specific content need separate integration verification.
- Complete the remaining exported `src/modules/courses` functions/learner pages systematically; this ledger documents only reviewed entries.

## Learner Projects cross-module role journey (IIT Dharwad)

| Surface | Invariant | Evidence | Status |
|---|---|---|---|
| `createLearnerOwnTask`, `deleteLearnerOwnTask`, `moveOwnLearnerProjectTask`, `pullOwnBacklogTask` | Persisted active learner/project membership rechecked within transaction; only owner-controlled TODO/IN_PROGRESS/BLOCKED paths and eligible project releases. Task creation previously rejected only SHIPPED; now it positively requires `PLANNED` or `IN_PROGRESS`, consistent with pull, delete and status services. | `tests/unit/PROJ-BREAK-chat7-learner-role-journey.test.ts` — `PROJ-BREAK-LEARNER-91..95` (especially `PROJ-BREAK-LEARNER-95 refuses learner-created tasks in cancelled or shipped release states`) | Source fix committed; Vitest and real-PostgreSQL concurrency checks pending |

This additive learner Projects review does not replace the chat-14-owned project function/page coverage ledger.

## Course and learner function/entrypoint matrix — round 2 (authored, CI pending)

| Exported function or screen | Tested behaviour and denied cases | Named test |
|---|---|---|
| `requireOwnCourseLearnerRead` | Missing, suspended and wrong-role context; persisted wrong actor, college, suspended user/membership; positive read scoped through `courses.read` | `tests/unit/chat7-learner-live-access-behaviour.test.ts` — `LEARNER-COURSE-ACCESS-01` |
| `requireLearningReadAccess` learner route in `learning-access.ts` | Source audit requires active persisted tenant membership, current LEARNER role, user status and exact cohort before granting a Section read; existing offering/delivery permission gate retained | `tests/unit/chat7-learner-live-access-behaviour.test.ts` — `LEARNER-COURSE-ACCESS-01 requires persisted cohort, tenant, active role and user` (source gate; PG role transition matrix still pending) |
| `getLearnerAssignmentMethods` | Rejects malformed IDs, draft/unpublished/hidden, wrong delivery, FACULTY/Mentor access, disappearing assignment; returns exact allowed submission methods for authorized learner | `tests/unit/chat7-learner-assignment-policy-boundary.test.ts` — `LEARNER-ASSIGNMENT-METHODS-01` |
| `listLearnerCourseDeliveries` | Authorized group electives only, never host-Section fallback; active learner role; persisted offering/Section/program cohort and period alignment | `tests/unit/chat7-learner-course-delivery-security.test.ts` — `LEARNER-courses-roster-01` |
| `listLearnerCourseInstructors` | Reject inactive staff membership and deactivated accounts when composing current learner-facing instructor names | `tests/unit/chat7-learner-course-delivery-security.test.ts` — `LEARNER-courses-roster-01 enforces exact offering cohort and period` (source assertion; independent behavioral DB test pending) |
| `parseLearnerQuizDraft`, `normalizeLearnerQuizDraftForQuestions` | Corrupt/oversized storage, constructor/prototype keys, bounded answer/options, stale options, single-choice and inherited selections | `tests/unit/chat7-quiz-draft-embargo-security.test.ts` — `LEARNER-QUIZ-DRAFT-01` |
| `learnerQuizResultsReleased`, `canReviewLearnerQuizCorrectAnswers` | Closed, published, valid due time and authorized attempt jointly required; no premature answer key | `tests/unit/chat7-quiz-draft-embargo-security.test.ts` — `LEARNER-QUIZ-EMBARGO-01` |
| `learnerQuizSubmitDeadlineOpen` | Strict before-deadline, invalid/missing deadlines; due equality is closed | `tests/unit/chat7-quiz-draft-embargo-security.test.ts` — `LEARNER-QUIZ-DEADLINE-01` |
| `learnerQuizRequestCurrent`, `learnerQuizSubmissionReceiptVisible` | Aborted stale navigation and mismatched quiz receipt rejected | `tests/unit/chat7-quiz-draft-embargo-security.test.ts` — `LEARNER-QUIZ-STALE-01` |
| `parseCollegeIstLocal` | Boundary and leap-day IST conversion; invalid day/minutes/timezone-style input | `tests/unit/chat7-course-ist-materials-policy.test.ts` — `COURSE-IST-01` |
| `resourceMaterialCommandSchema`, `resourceMaterialsWriteReady` | Strict commands, URL protocol/credentials/fragment, no storage authority and verified storage-flag enforcement | `tests/unit/chat7-course-ist-materials-policy.test.ts` — `LEARNER-resource-07` |

Limitations: this is an incremental coverage slice, not a complete 345-file course-service register. Real PostgreSQL, browser and cloud CI execution are outstanding; tests were authored without running them.

## Learner notices, discussion mutations, quiz secrecy and Super Admin page audit — round 3

| Entry point | Behaviour / attack case | Test case and status |
|---|---|---|
| `listLearnerCourseClassAnnouncements` | Valid Section UUID; current persisted learner/user/role; ACTIVE Section, enrollment, cohort, academic period; college-scoped official CLASS notice, bounded read; missing storage fails closed | `tests/unit/chat7-learner-announcements-scope.test.ts` — `LEARNER-COURSE-NOTICES-01`; authored, CI/PG pending |
| `createCourseDiscussionMessage`, `deleteCourseDiscussionMessage` learner path | Re-check persisted ACTIVE learner membership, user, college and LEARNER role under `FOR SHARE` in same transaction as insert/delete, reject late revocation without creating activity | `tests/unit/chat7-learner-discussion-revocation-races.test.ts` — `LEARNER-DISCUSSIONS-RACE-01`; mocked service behavior authored, real Postgres race pending |
| `shuffleQuizForLearner` | Deterministic shuffle preserves IDs but projects only public id/text/sequence; never outputs correct flags or arbitrary runtime secret attributes, including no-shuffle case | `tests/unit/chat7-learner-quiz-answer-key-leak.test.ts` — `LEARNER-QUIZ-KEY-01`; authored, CI pending |
| `adminAssessmentQuerySchema`, `adminAssessmentHref`, `adminAssessmentExportHref`, `adminAssessmentStats` | Strict scoped assessment filtering, URL/page fidelity, export retains audience/course/results and removes page | `tests/unit/chat7-superadmin-courses-content-model-matrix.test.ts` — `SA-academics-people-64/65` |
| `adminContentQuerySchema`, `adminContentHref`, `adminContentPages`, `contentTypesForKind`, `adminContentTypeLabel`, `safePublicCourseContentUrl` | Validate UUID and status, safe pagination, exclude unsafe old content links | `tests/unit/chat7-superadmin-courses-content-model-matrix.test.ts` — `SA-academics-people-61/62` |
| `adminLearningQuerySchema`, `adminLearningHref`, `adminProgressStats` | Retain course/cohort filters; do not invent summed distinct learners across offerings | `tests/unit/chat7-superadmin-courses-content-model-matrix.test.ts` — `SA-academics-people-68` |
| `collegeCourseCatalogueQuerySchema`, `paginateCollegeCourses` | Strict bounded paging, stable sorting, no tenant supplied in filters | `tests/unit/chat7-superadmin-courses-content-model-matrix.test.ts` — `SA-academics-people-54` |
| `/admin/courses`, `/admin/lessons`, `/admin/videos`, `/admin/resources`, `/admin/live-classes`, `/admin/assignments`, `/admin/quizzes`, `/admin/course-progress`, `/admin/course-progress/students` | Source-verified no-college, filter error, authoring and legacy recovery affordances; detailed browser interaction remains unverified | `tests/unit/chat7-superadmin-courses-content-page-gates.test.ts` — `SA-academics-people-50/54/56/57/61/62/64/65/67` |

Caveats: the unit test snapshot in `docs/orchestrator/unit-failures-latest.md` still predates these changes. The earlier delivery-roster source matcher was corrected to accept a semantically identical TypeScript trailing comma while retaining the academic-period equality assertion. Private scanned file/video imports and full Super Admin image management remain unavailable. This ledger is cumulative but still does not certify exhaustive module/page coverage.

## Admin course content effective-visibility correction

| Entry | Required behavior | Test |
|---|---|---|
| `listSuperAdminContentDirectory`, `effectiveCourseContentVisibleToStudents`, `SuperAdminContentDirectoryPage` | An active Course and Offering, PUBLISHED learning path and content, ACTIVE Lesson, and per-content visible flag must all hold before the admin says "Students Visible". Legacy published content under an unpublished path must say "Students Hidden". | `tests/unit/chat7-superadmin-effective-content-visibility.test.ts` — `SA-academics-people-62`; authored, CI pending |

## Learner media and quiz-answer non-disclosure — round 4

| Exported entry | Invariant | Test |
|---|---|---|
| `shuffleQuizForLearner` | Exact per-learner deterministic question IDs and option order, but no `correct`, `secret` or other DB/authored properties in client display objects, shuffled or unshuffled | `tests/unit/chat7-learner-quiz-answer-key-leak.test.ts` — `LEARNER-QUIZ-KEY-01` |
| `learnerVisibleContentExternalUrl`, `learnerSafeExternalContentHref` | Scheduled LIVE_CLASS HTTPS meeting links may be offered before start, ended meeting links denied, unsafe old DB URLs sanitized before learner read output | `tests/unit/chat7-learner-media-notice-boundary.test.ts` — `LEARNER-LIVE-LINK-01` |
| `resumePositionForGrant`, `playbackGrantRefreshDelay` | Finite nonnegative playback positions, intentionally preserved seek on renewal, refresh before expiry, invalid/expired URLs have zero delay | `tests/unit/chat7-learner-media-notice-boundary.test.ts` — `LEARNER-VIDEO-GRANT-01` |
| `learnerDueSoonNotices` | Only distinct not-yet-submitted assignments within due-soon window, scoped links carry Section delivery | `tests/unit/chat7-learner-media-notice-boundary.test.ts` — `LEARNER-ASSIGNMENT-REMINDER-01` |
| `learnerDiscussionDraftValid` | Trimmed, nonempty, shared 3,900-character maximum | `tests/unit/chat7-learner-media-notice-boundary.test.ts` — `LEARNER-DISCUSSION-LIMIT-01` |

Authoring note: no tests were executed in this lane. CI and PostgreSQL/browser verification are not claimed complete. Certificates and the remaining non-audited learner course exports are still outside this incremental test matrix.

## Owner master queue priority (2026-10-18): Projects learner journeys, then courses and Admin content

The owner suspended iterative CI/test-failure triage until all lane queues finish. This section records new source work and authored regression behavior; no green CI or browser/PG run is claimed.

| Export/page | Function/role/UX cases | Test |
|---|---|---|
| `/learn/projects/[projectId]` | Learner grant is checked before malformed Board search/priority/status/sprint/release/sort/assignee filters are rejected; invalid filters show a safe Clear filters action without broadening task visibility | `tests/unit/PROJ-BREAK-chat7-learner-board-filters-and-scroll.test.ts` — `PROJ-BREAK-LEARNER-96` |
| `filterLearnerBoardTasks`, `sortLearnerBoardTasks`, `learnerBoardEmptyState`, `learnerBoardActiveFilterCount` | Own-member filter, sectioned release/sprint constraints, deterministic sorting, empty vs filtered empty, nonmutation | `tests/unit/PROJ-BREAK-chat7-learner-board-filters-and-scroll.test.ts` |
| `learnerTaskProgressInputSchema`, `learnerTaskTransitionAllowed`, `canLearnerMoveOwnTask`, `/api/projects/[projectId]/tasks/[taskId]/learner-progress` | Disallow TODO, DONE, IN_REVIEW, ACCEPTED transitions; validate blocker length and ownership boundary; route origin guard; persisted role recheck under task transaction; audit and mentor notification | `tests/unit/PROJ-BREAK-chat7-learner-progress-transition-matrix.test.ts` — `PROJ-BREAK-LEARNER-98` |
| `LearnerBoardInteractive` | Drag-and-drop, select and Undo consult the same transition allowlist; keyboard-focusable horizontal lanes and 44px actions | `tests/unit/PROJ-BREAK-chat7-learner-progress-transition-matrix.test.ts`; `tests/unit/PROJ-BREAK-chat7-learner-board-filters-and-scroll.test.ts` — `PROJ-BREAK-LEARNER-97/98` |
| `LearnerCourseList` | Long all-course and credits lists show a scroll hint, named focus region and bounded vertical scrolling | `tests/unit/UX-chat7-learner-scroll-motion-01.test.ts` — `UX-LEARN-scroll-01` |
| `LearnerAssessmentOverview` | Submitted quiz list shows more-content hint; accessible scroll region and focus ring | `tests/unit/UX-chat7-learner-scroll-motion-01.test.ts` — `UX-LEARN-scroll-02` |
| `CollegeAssignmentReview` | 44px grade publication, retry and delivery-picker controls | `tests/unit/chat7-superadmin-course-assessment-ux-boundaries.test.ts` — `SA-academics-people-64` |
| `CollegeQuizAttempts` | Named keyboard-accessible attempt scroll, visible cue, 44px pagination, section choice and response controls | `tests/unit/chat7-superadmin-course-assessment-ux-boundaries.test.ts` — `SA-academics-people-65` |
| `/admin/assignments` | Reject a quiz-only result filter before session/DB reads; no-college fallback and direct in-page grading stay scoped | `tests/unit/chat7-superadmin-course-assessment-ux-boundaries.test.ts` — `SA-academics-people-64` |

See `docs/audit/ux/scroll-motion-courses.md` for the changed containers. Backend PostgreSQL race/rollback coverage and visual phone verification remain unexecuted. No claim of exhaustive coverage of 345 course files is made.

## Learner Projects services and safe Super Admin bulk errors — priority continuation

| Export | Behavior asserted / documented | Behavioral regression |
|---|---|---|
| `listMyLearnerProjectDueStates` | Reject inactive/wrong role/invalid and oversized UUID lists; never enumerate foreign mentor projects; ignore completed task dates; per-project no-due fallback | `tests/unit/PROJ-BREAK-chat7-learner-due-and-progress-services.test.ts` — `PROJ-BREAK-LEARNER-99` |
| `listMyLearnerProjectProgress`, `summarizeLearnerProjectProgress` | Only explicitly learner-accessible project IDs; duplicate IDs do not double count; zero-task project yields unknown completion `null`, not invented 0% | `tests/unit/PROJ-BREAK-chat7-learner-due-and-progress-services.test.ts` — `PROJ-BREAK-LEARNER-99` |
| `listMyLearnerProjectAttention` | Excludes archived and mentor-only projects, reads only latest submission version for DRAFT or CHANGES_REQUESTED | `tests/unit/PROJ-BREAK-chat7-learner-attention-service.test.ts` — `PROJ-BREAK-LEARNER-100` |
| `bulkSuperAdminCourseVisibility`, `superAdminCourseBulkSchema` | Current selected-college active Course IDs only; explicit confirmation, bounded 100 IDs/500 lessons; typed not-found/too-large instead of generic 500; partial count, failed-course retry IDs | `tests/unit/chat7-superadmin-course-bulk-typed-boundaries.test.ts` — `SA-academics-people-53` |
| `bulkSuperAdminLessonVisibility` | Only PUBLISHED lesson contents under ACTIVE Lesson/Course/Offering and PUBLISHED learning path; draft/archived ancestry preserved; per-record errors sanitized, limit error typed | `tests/unit/chat7-superadmin-bulk-published-only.test.ts` — `SA-academics-people-53` |
| `apiErrorResponse` course visibility response | `COURSE_NOT_FOUND` maps 404; `COURSE_VISIBILITY_BULK_TOO_LARGE` maps 400; body follows friendly error/request ID contract | `tests/unit/chat7-superadmin-course-bulk-typed-boundaries.test.ts`;  HTTP integration pending |
| `SuperAdminCourseBulkVisibility` | Shows current-content-only caveat; provides actionable “Select fewer courses” / “Refresh and select current courses” recovery on typed errors | `tests/unit/chat7-superadmin-course-bulk-typed-boundaries.test.ts` — UI source review; browser pending |

This still does **not** implement a persisted future whole-course visibility override (SA-53 remains PARTIAL). The owner deferred running all CI; therefore new tests are authored evidence and not a green-verification claim.

## Private course file / signed-download security — next learner entry

| Export / route | Authorization and failure behavior | Regression |
|---|---|---|
| `getLearnerCourseFileReference` | Strict delivery/content UUID; current learner entitlement including historical enrollment policy; published path/content, visible Lesson and content, exact offering/Section audience; `startsAt <= now()` or unscheduled enforced in PostgreSQL before private storage key leaves the service | `tests/unit/chat7-learner-course-file-embargo.test.ts` — `LEARNER-COURSE-FILE-EMBARGO-01`; authored, PostgreSQL scheduled-content negative witness pending |
| `GET /api/courses/deliveries/[deliveryId]/contents/[contentId]/file` | Strict `download=0/1`, no duplicate/unknown query keys; authorization before storage `HEAD`, before presigned 900-second GET; signed 302 no-store/no-referrer; absent file 404, storage outage 503 with no raw credentials, attachment filename sanitized | `tests/unit/chat7-learner-course-file-route-boundaries.test.ts` — `LEARNER-COURSE-FILE-ROUTE-02` |

These are unit-authored rather than CI-green. No live R2/storage object was touched. A browser's hidden `storageKey` while SCHEDULED is now backed by a server read constraint, not just UI masking.

## Learner quiz review and assignment material read — source coverage extension

| Function | Valid and invalid behavior | Named regression |
|---|---|---|
| `learnerQuizReviewRows` | Only selections belonging to current option IDs count, duplicates collapse, inherited browser draft answer properties never count; no answer-key correctness or points leave this projection | `tests/unit/chat7-learner-quiz-review-inherited-answers.test.ts` — `LEARNER-QUIZ-REVIEW-03` |
| `facultyAssignmentMaterialLinkSchema`, `safeLearnerAssignmentMaterialLink` | Public credential-free HTTPS links only; no hash fragments, localhost loopback, javascript/file/data, extra tenant or private-storage keys; learner read gets null for malformed historic links | `tests/unit/chat7-learner-course-material-link-safety.test.ts` — `LEARNER-ASSIGNMENT-MATERIALS-04` |
| `selectLearnerAssignmentFile` | Clearing the selected file leaves no error; malformed delivery ID drops file before upload-grant request | `tests/unit/chat7-learner-course-material-link-safety.test.ts` — `LEARNER-ASSIGNMENT-MATERIALS-04` |

Release safety note: `getLearnerCourseFileReference` newly denies SCHEDULED content using DB `now()` even when the learner is enrolled; the client hidden-key presentation by itself never suffices as authorization. All test evidence here was authored without CI/PG execution per owner priority.

## Super Admin live-class authoring — calendar-exact validation

| Function and component | Boundary and behavior | Named regression |
|---|---|---|
| `parseAdminContentLocalMoment`, `SuperAdminContentActions` | Browser `datetime-local` values are calendar-validated in IST and UTC before mutation, rejecting invalid leap dates, overflow days and clock values; End must be later than Start; no silent Date normalization to another meeting day. Existing unsaved edit and confirmation flow remains. Controls use 44px minimum touch height. | `tests/unit/chat7-superadmin-content-live-datetime-parity.test.ts` — `SA-academics-people-58 live meeting IST/UTC calendar integrity` (authored; CI/browser pending) |

This is **link-based live content metadata** hardening only. It does not bypass blocked scanned binary video import/storage, nor create a private resource upload capability.

## Learner workspace results embargo and material service behavior

| Export | Invariant | Named test |
|---|---|---|
| `getLearnerCourseWorkspace` quiz projection | Do not return raw authoring `resultsPublished`: the Quiz must be CLOSED, explicitly released and past its due time using one server clock; learner assessment feed and attempt detail use the same release rule | `tests/unit/chat7-learner-course-quiz-release-consistency.test.ts` — `LEARNER-QUIZ-WORKSPACE-EMBARGO-01` |
| `listOwnLearnerAssignmentMaterialLinks`, `assignmentMaterialTableReady` | Verify scoped delivery/enrolment first, deny draft/hidden/unpublished learner assignments before optional table probe, return honest disabled state when table absent, project only safe public HTTPS URLs | `tests/unit/chat7-learner-assignment-materials-service.test.ts` — `LEARNER-ASSIGNMENT-MATERIALS-04` |

Both tests were authored without execution as requested. Role/tenant and scheduled embargo require later PostgreSQL/route verification for certification.

## Continued security closure: signed media, upload metadata, bulk scope

| Export / route | New explicit contract | Behavioral or boundary test |
|---|---|---|
| `playbackGrantRefreshDelay` | Expired/invalid grants renew at zero delay; a near-expiry grant does not wait beyond expiry; short grants over 1 second back off 1 second to avoid a renewal burst | `tests/unit/learner-video-grant-model.test.ts` — `LEARNER-VIDEO-GRANT-02` |
| `getLearnerCourseFileReference` | A direct R2 file redirect is valid only for a `RESOURCE`, never a `VIDEO`; video bytes require the independent playback-grant path, even if a resource ID and delivery ID are both known | `tests/unit/chat7-learner-course-file-embargo.test.ts` — `LEARNER-COURSE-FILE-SCOPE-03` (source/authorization behavior); database type-negative verification pending |
| `learnerAssignmentUploadHeadersSafe`, `validateLearnerAssignmentUploadGrant` | Exact six-header PUT capability; extra `x-amz-meta-*` fields rejected in addition to missing, malformed and unsafe headers | `tests/unit/learner-assignment-file-model.test.ts` — `LEARNER-FILE-GRANT-05` |
| `bulkSuperAdminLessonVisibility`, `bulkSuperAdminCourseVisibility` | SQL counts currently published lesson contents under published paths, active offering/course/lesson, matching department and academic-period college; draft-only rows do not consume the 500-row safety cap | `tests/unit/chat7-superadmin-bulk-published-only.test.ts`, `tests/unit/chat7-superadmin-course-bulk-typed-boundaries.test.ts` — `SA-COURSES-BULK-PUBLISHED-06/SA-COURSES-BULK-SCOPE-07` |

The owner has deferred CI and PostgreSQL integration until final all-lane completion. These changes are committed to the lane branch but neither a green test run nor tenant-race sign-off is claimed.

## Legacy learner profile certification role journey

| Export and page | Contract | Behavioral test |
|---|---|---|
| `learnerProfileDocumentSchema.shape.certifications`, `/learn/profile` | The profile's **Certifications** section is not an auto-awarded course-completion certificate. Credentials require a name, valid independent optional calendar dates and, when both exist, expiry strictly after issue; rejects extra injected owner/college identity. The saved profile uses the existing authenticated profile-write path. | `tests/unit/chat7-learner-certification-date-parity.test.ts` — `LEARNER-CERT-EXPIRY-01` (authored, CI/browser pending) |

Source-only crosswalk: `docs/audit/legacy-vs-vnext-chat7-learner-gaps.md`. Learner source routes and legacy copy mapped, but dev and production legacy runtime sign-off are still outstanding.
