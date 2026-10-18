# Faculty/teacher chat-3 coverage ledger (targeted hardening slice)

**Scope:** verified source review and added tests for Projects Faculty role journeys and the published Section gradebook. The whole `src/modules/courses` module and all `/teacher` routes **are not yet exhaustively tested**. Unlike a completion ledger, this file names only rows with a test and separately lists unverified required work.

| Export / route | Test(s) | Behaviours asserted | Boundary still unverified |
|---|---|---|---|
| `requireProjectReadAccess` — `src/modules/projects/access.ts` | `PROJ-BREAK-FACULTY-02.test.ts`, `PROJ-BREAK-FACULTY-01.test.ts` | Active assigned Mentor + persisted roleKind; Faculty-only denial; wrong college, suspended/ended membership, disabled account, malformed project UUID | Query executes against mocked DB; real SQL filtering needs PostgreSQL |
| `requireProjectLifecycleMutationAccess` — `src/modules/projects/access.ts` | `PROJ-BREAK-FACULTY-02.test.ts` | Mutation allowed to active matching Mentor; denied to read-only/reviewer, disabled Projects module, stale principal | State races, transaction rollback and server action route tests |
| `mayMutateProjectWithRole` — `src/modules/projects/member-role-kind-model.ts` | `PROJ-BREAK-FACULTY-01.test.ts` | All supported role kinds versus canMutate flag | Persisted grant revocation in PostgreSQL |
| `mentorTaskTransitionSchema`, `allowedMentorTaskTransition` | `PROJ-BREAK-FACULTY-01.test.ts` | Invalid states, confirmation, stale timestamp shape, forced terminal states | Real parallel transaction retries |
| `mentorMeetingRescheduleSchema`, `mentorMeetingCanReschedule`, IST conversion helpers | `PROJ-BREAK-FACULTY-01.test.ts` | Midnight/leap days, invalid windows, archived transitions | Real scheduled meeting scope and concurrent changes |
| `facultyPublishedGradeRows` | `faculty-gradebook-model.test.ts`, `chat3-faculty-gradebook-integrity.test.ts` | Published-only totals, unknown versus zero, invalid numbers, foreign member exclusion, duplicates | Real grading/publication transactions |
| `facultyPublishedLearnerBreakdown` | `faculty-gradebook-model.test.ts`, `chat3-faculty-gradebook-integrity.test.ts` | Exact per-learner release visibility; corrupt-first, valid-second record consistency with totals | Dataset-level uniqueness enforcement |
| `facultyGradebookCsv` | `faculty-gradebook-model.test.ts`, `chat3-faculty-gradebook-integrity.test.ts` | CSV formula safety, authorization roster exclusion, 500-row cap and explicit truncation | HTTP download integration and tenant-scoped auth |
| `facultyGradebookParamsSchema`, `facultyGradebookViewQuerySchema` | `faculty-gradebook-model.test.ts`, `UX-teacher-gradebook-limit-chat3.test.ts` | Valid UUID only, no forged selectors/duplicated filters, bounded paging | Next.js page execution |
| `paginateFacultyGradebookRows`, `facultyGradebookViewHref` | `faculty-gradebook-model.test.ts` | Case-insensitive filtering, deterministic page order, safe filter URLs | Large-roster load test |
| `getFacultyPublishedGradebook` | `chat3-faculty-gradebook-service-journey.test.ts` | Role/session gating, delivery scope, no hidden grade release, wrong member filtering, report cap | External services mocked; live DB and end-to-end route |
| `getFacultyPublishedGradebookLearner` | `chat3-faculty-gradebook-service-journey.test.ts` | Guessed membership ID fails with private `MEMBERSHIP_NOT_FOUND` | Joined attendance roster actual grants |
| `facultyQuizAcceptsContentType`, `readFacultyQuizCommandBody` | `COURSES-BREAK-FACULTY-02.test.ts` | JSON media types, malformed/oversize/invalid UTF-8 inputs | Real HTTP stream cancellation |
| `facultyAssignmentGradingAllowed`, `facultyAssignmentGradePublicationAllowed`, `facultyGradeEditorState` | `COURSES-BREAK-FACULTY-01.test.ts` | Non-finite/negative/overflow grade denial, dirty grade cannot publish | Server write transaction and audit event |
| `facultyQuizResultsCommandSchema`, `facultyQuizResultsTransition` | `COURSES-BREAK-FACULTY-01.test.ts` | Strict confirmed command, stale version format, late/repeated publish and hidden results | Concurrent result release and notification dedupe |
| `/teacher/courses/[deliveryId]/gradebook` | `UX-teacher-gradebook-limit-chat3.test.ts`, `UX-teacher-courses-deliveryid-gradebook-coverage-01.test.ts` | Invalid filters caught before data read, accessible result-limit recovery with return link | DOM keyboard/mobile browser run |
| `/teacher/contacts` | `UX-teacher-contacts-coverage-01.test.ts` | Legacy redirect to authorized contacts tab | Target route end-to-end authenticated navigation |
| `/teacher/courses/[deliveryId]` | `UX-teacher-courses-deliveryid-coverage-01.test.ts` | Invalid delivery not-found, authorized home tab routing | Authenticated redirect integration |
| `/teacher/courses/[deliveryId]/attendance-corrections` | `UX-teacher-courses-deliveryid-attendance-corrections-coverage-01.test.ts` | Availability scope check before redirect, private not-found | Live correction service and browser |
| `/teacher/courses/[deliveryId]/notices` | `UX-teacher-courses-deliveryid-notices-coverage-01.test.ts` | Section notice scope before redirect, discussion fallback | Live notice service and browser |

## Remaining Faculty and Super Admin work

- Enumerate **every** exported faculty assessment/quiz/attendance/grade/lesson/discussion service and route handler from the full repository tree, then close happy path, failure, tenant, role, idempotency, stale version, activity and notification cases individually. Only the targeted rows above have reviewed test references; do not count source-string assertions as proof of runtime behaviour.
- Run PostgreSQL integration journeys for revoked faculty assignment, wrong college, expired authentication, stale tabs, duplicate submits, grade/result publication, rollback, race and audit events.
- Audit `/admin/academics*`, `/admin/people*` and `/admin/recruiters` including actions, phone UX, denials and partial data handling. The latter is a route re-export of `/admin/hr`.
- Current `docs/audit/ux/COVERAGE-MATRIX.md` reports **0** routes without a UX test mention; earlier 28 missing teacher test mentions were closed on main. Four `/teacher` routes still show `noShared` because they are redirect-only pages. Do not add decorative shared components to redirects; get approval before recording waivers.
- Run `node scripts/audit/ux-coverage.mjs`, `tsc` and Vitest in a checkout/CI. These were **not run** from the GitHub connector, so no pass claim is made.
