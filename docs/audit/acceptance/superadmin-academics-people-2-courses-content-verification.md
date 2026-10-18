# Super Admin / Courses and Content gap acceptance

Test authored, **not run**; orchestrator executes it.

| ID | Status | Evidence and test name |
|---|---|---|
| SA-academics-people-59 | BLOCKED | Super Admin binary video upload requires a provisioned private bucket and upload/scanner pathway; see queue note |
| SA-academics-people-60 | BLOCKED | URL-video import requires private storage, scanner and SSRF-resistant ingestion; see queue note |
| SA-academics-people-69 | DONE | `src/modules/admin-ui/super-admin-learning-csv-service.ts`, four `src/app/api/admin/{lessons,course-progress,assignments,quizzes}/export/route.ts`; `tests/unit/chat6-superadmin-content-verified-exports.test.ts` → `SA-academics-people-69 exposes four selected-college bounded CSV endpoints` |

| SA-academics-people-48 | DONE | `src/app/(authenticated)/admin/{assignments,quizzes,course-progress}/page.tsx`, `src/components/courses/super-admin-content-directory-page.tsx`; `tests/unit/chat6-superadmin-content-round2.test.ts` → `SA-academics-people-48 uses select college legacy empty copy consistently` |

Remaining: course field/policy parity, lesson-level operations, class-by-course progress, rich content and assignment/quiz actions. `SA-academics-people-58/59/60` binary files and URL import remain storage/scanner-dependent; content editing without files is partial. `SA-academics-people-57/68` bulk controls and course/batch selectors exist, but legacy lesson-level and exact class filtering must be verified before closure.

| SA-academics-people-63 | DONE | `src/modules/courses/super-admin-content-directory-model.ts`, `src/components/courses/super-admin-content-directory-page.tsx`; `tests/unit/chat6-superadmin-content-round2.test.ts` → `SA-academics-people-63 exact legacy video and live class labels and help` |
| SA-academics-people-71 | DONE | `src/components/courses/admin-assessment-read-directory.tsx`, `src/components/courses/super-admin-content-directory-page.tsx`; `tests/unit/chat6-superadmin-content-round2.test.ts` → `SA-academics-people-71 exact legacy empty text for assessment and content directories` |

| SA-academics-people-73 | DONE | `src/components/courses/admin-course-actions.tsx`; `tests/unit/chat6-superadmin-content-round2.test.ts` → `SA-academics-people-73 warns before closing unsaved course edits and blocks close while saving` |
| SA-academics-people-76 | NOT-A-GAP | `src/components/courses/college-lesson-reorder-actions.tsx`, `src/components/courses/faculty-content-order-editor.tsx`; `tests/unit/chat6-superadmin-content-round2.test.ts` → `SA-academics-people-76 keyboard operable move buttons are an approved equivalent to drag reorder` |

| SA-academics-people-51 | DONE | `src/app/(authenticated)/admin/courses/page.tsx`, `src/components/courses/admin-course-overview.tsx`, `src/components/courses/admin-course-create-panel.tsx`; `tests/unit/chat6-superadmin-content-round2.test.ts` → `SA-academics-people-51 Super Admin duplicate course prepopulates draft and returns to correct route` |

| SA-academics-people-70 | NOT-A-GAP | Server-rendered content directory reads the authoritative selected-college scope from `getCurrentRequestContext` before listing or authoring; unlike legacy, it does not independently apply a client scope cookie that could temporarily disagree. Approved intentional differences: OD-38. `tests/unit/chat6-superadmin-content-round2.test.ts` → `SA-academics-people-70 server authoritative scope requires selection before reading content` |

| SA-academics-people-77 | DONE (source authored; browser route verification pending) | `src/app/(authenticated)/admin/lessons/page.tsx`, `src/app/(authenticated)/admin/course-progress/page.tsx`, `src/components/courses/admin-assessment-read-directory.tsx`; `tests/unit/chat6-superadmin-course-entrypoints.test.ts` → `SA-academics-people-77 links lessons assignments quizzes and progress to owning offering workspace` |
| SA-academics-people-57 | DONE (source verified; runtime pending) | `src/app/(authenticated)/admin/lessons/page.tsx`, `src/components/courses/super-admin-lesson-bulk-visibility.tsx`; `tests/unit/chat6-superadmin-course-entrypoints.test.ts` → `SA-academics-people-57 lessons have course filter CSV and bulk visibility controls` |

## Round 4 — authored, not executed

| SA-academics-people-68 | DONE (source verified; runtime pending) | `src/app/(authenticated)/admin/course-progress/page.tsx`, `src/components/admin/super-admin-learning-filter-fields.tsx`; `tests/unit/chat6-cross-page-verification-round4.test.ts` → `SA-academics-people-68 filters course progress by course and batch with legacy completion guidance` |
| SA-academics-people-58 | BLOCKED (binary upload only; safe link-based create/edit/delete retained) | Private scanned video/files need storage actor; `src/components/courses/super-admin-content-authoring.tsx` and `super-admin-content-actions.tsx` use existing link/meeting/resource authoring with `apiFetch`; `tests/unit/chat6-cross-page-verification-round4.test.ts` → `SA-academics-people-58 retains in-page link-based content authoring and safely explains blocked binary uploads` |
| SA-academics-people-72 | BLOCKED (private per-item material upload/removal; editable resource metadata and delete copy implemented) | `src/components/courses/super-admin-content-actions.tsx` preserves unsaved resource edits, confirms archive, and keeps friendly API errors; `tests/unit/chat6-cross-page-verification-round4.test.ts` → `SA-academics-people-72 guards unsaved resource changes and uses legacy resource confirmations`; private material storage/scanner pending |

| SA-academics-people-54 | OPEN (filter/export/pagination authored; image/short title, Refresh and page-size choice remain) | `src/app/(authenticated)/admin/courses/page.tsx`, `src/components/courses/admin-course-overview.tsx`, `src/app/api/admin/courses/catalogue/export/route.ts`; `tests/unit/chat6-superadmin-course-catalogue-round4.test.ts` → `SA-academics-people-54 supports search sort pagination and route-correct actions`, `SA-academics-people-54 exports a bounded selected-college CSV without exposing other colleges`. Course imagery and short-title metadata remain owned by SA-academics-people-50. |

| SA-academics-people-74 | DONE (source authored; real database/admin browser pending) | `src/modules/admin-ui/super-admin-course-dependencies-service.ts`, `src/app/(authenticated)/admin/courses/page.tsx`, `src/components/courses/admin-course-overview.tsx`, `src/components/courses/admin-course-actions.tsx`, `src/modules/courses/course-service.ts`; `tests/unit/chat6-superadmin-course-catalogue-round4.test.ts` → `SA-academics-people-74 counts lesson dependencies only in the selected college and preflights archive`. Client disables archive with active Offerings; server retains independent authoritative race-safe guard. |

| SA-academics-people-55 | OPEN (legacy course heading/create/update copy and no-department link authored; further field and archive popconfirm parity pending) | `src/modules/courses/college-courses-copy.ts`, `src/components/courses/admin-course-create-panel.tsx`, `src/components/courses/admin-course-actions.tsx`; `tests/unit/chat6-superadmin-course-catalogue-round4.test.ts` → `SA-academics-people-55 keeps legacy course headings and creation update feedback with department recovery`. The separate Short display name schema belongs to SA-academics-people-50. |

| SA-academics-people-62 | OPEN (visibility/order/open-public-link source authored; private file count/preview still infra-blocked) | `src/modules/courses/super-admin-content-directory-service.ts`, `src/components/courses/super-admin-content-directory-page.tsx`; `tests/unit/chat6-superadmin-course-catalogue-round4.test.ts` → `SA-academics-people-62 shows scoped student visibility and lesson ordering with safe external links`. Effective visibility requires PUBLISHED content, active lesson/offering and the visibility flag; only HTTPS links are exposed. Private file handling remains deliberately absent until private scanned storage is ready. |

| SA-academics-people-61 | DONE (source authored; PostgreSQL/browser pending) | `src/modules/courses/super-admin-content-directory-{model,service}.ts`, `src/components/courses/super-admin-content-directory-page.tsx`; `tests/unit/chat6-superadmin-scoped-directory-filters.test.ts` → `SA-academics-people-61 applies scoped course, lesson, section and audience selectors with persistent paging`. |
| SA-academics-people-66 | DONE (source authored; PostgreSQL/browser pending) | `src/modules/courses/admin-assessment-directory-model.ts`, `src/components/courses/admin-assessment-read-directory.tsx`, admin assessment routes; `tests/unit/chat6-superadmin-scoped-directory-filters.test.ts` → `SA-academics-people-66 filters selected college assessments by course, section scope and result publication`. |

| SA-academics-people-75 | DONE (responsive source authored; 375px browser acceptance pending) | `src/components/courses/admin-course-overview.tsx`, shared overflow-scroll `DataTable`; `tests/unit/chat6-people-phone-session-and-mobile-round6.test.ts` → `SA-academics-people-75 keeps create controls and scrolling course tables within mobile width`. |

## Chat-6 UNCONFIRMED decisions, 2026-10-18

| SA-academics-people-49 | NOT-A-GAP (OD-34 hidden global policy control; computation implemented) | `src/modules/courses/learner-playback-settings.ts` validates global watched threshold and min-in-progress bound (defaults 90%, 5%); `src/modules/courses/progress-service.ts` uses both for learner status and completion. Owner OD-34 requires platform-wide hidden policy rather than legacy editable cards. `tests/unit/chat6-superadmin-progress-policy-decision-49.test.ts` names `SA-academics-people-49`. Source checked; PostgreSQL and browser tests pending. |
| SA-academics-people-75 | DONE (source) | Responsive course workspace uses DataTable; mobile browser signoff pending; decision evidence: `docs/audit/acceptance/chat-6-unconfirmed-decisions.md`; test: `tests/unit/chat6-unconfirmed-decisions-round13.test.ts` → `SA-academics-people-75` |

| SA-academics-people-54 | OPEN (page-size and Refresh now authored; image and short title pending -50) | `src/modules/courses/college-course-catalogue-model.ts`, `src/app/(authenticated)/admin/courses/page.tsx`, `src/components/courses/admin-course-overview.tsx`; `tests/unit/chat6-superadmin-course-pagination-54.test.ts` → `SA-academics-people-54 supports stable search sort and 25/50/100-page URL persistence`, `SA-academics-people-54 wires bounded UI page size and Refresh into the Super Admin page`. No claim of full parity before the course short title / image fields. |

## Chat-7 final sprint (11-item reassignment; 8 Super Admin items)

All tests below were authored but **not run** locally. The orchestrator must run strict TypeScript, Vitest and real PostgreSQL integration tests. The course metadata migration is unnumbered and must be registered before database rollout.

| Gap ID | Disposition | Acceptance evidence and residual condition |
|---|---|---|
| SA-academics-people-50 | PARTIAL — new catalogue metadata implemented; binary image BLOCKED | `src/db/schema/courses.ts` adds shortTitle, officialCode and cardColor; `src/modules/courses/validation.ts`, `course-service.ts` and `admin-course-{create-panel,actions,overview}.tsx` persist and edit them. Super Admin create uses an internal unique generated code separate from optional official code. `docs/proposed-migrations/chat7-sa-course-catalogue-metadata.sql` needs numbered registration and replay. `tests/unit/chat7-final-sprint-superadmin-courses-content.test.ts`: `SA-academics-people-50 validates short title, optional official code and colour independently from internal code`. Image/replace/delete binary flow requires the private bucket/scanner and cannot be marked DONE. |
| SA-academics-people-52 | DONE source; runtime pending | `src/modules/courses/super-admin-course-bulk-visibility.ts`, `src/app/api/admin/courses/bulk-status/route.ts`, `src/components/courses/super-admin-course-bulk-visibility.tsx` and `admin-course-overview.tsx` expose selected-course Show/Hide, confirmation, per-content partial failure counts and idempotent retry. `tests/unit/chat7-final-sprint-superadmin-course-visibility.test.ts`: `SA-academics-people-52 bulk Show/Hide confirms, reports partial failures and offers Retry failed`; second test file `chat7-final-sprint-superadmin-courses-content.test.ts` contains a named SA-52 case. This acts on existing published lesson content, not on future items. |
| SA-academics-people-53 | PARTIAL — working college-scoped content visibility; native per-course/per-lesson visibility bit pending | `super-admin-course-bulk-visibility.ts` proves selected-college active-course scope and reuses `bulkSuperAdminLessonVisibility` and audited `updateCollegeContentStudentVisibility` with source tenant revalidation. `tests/unit/chat7-final-sprint-superadmin-course-visibility.test.ts`: `SA-academics-people-53 guards college scope and preserves published lesson state when toggling student visibility`. Tests authored not run. A dedicated persisted whole-course visibility state and independent course/lesson toggles are still absent. |
| SA-academics-people-56 | PARTIAL — direct edit/archive/reorder and create entry built | `src/modules/courses/college-learning-directory-service.ts` returns lesson description/path, `src/app/(authenticated)/admin/lessons/page.tsx` embeds existing `LessonActions` and `CollegeLessonReorderActions`, linking to the selected offering's `#lesson-authoring` entry. `tests/unit/chat7-final-sprint-superadmin-courses-content.test.ts`: `SA-academics-people-56 can edit archive reorder and open offering creation from the lesson directory`. Standalone lesson create and whole-course picker modal remain offering-hosted. |
| SA-academics-people-60 | BLOCKED — private video storage and SSRF-resistant scanner/import service not provisioned | No untrusted remote URL is fetched by the application as a privileged server-side import. The legitimate YouTube/HTTPS link authoring surface is separate. `tests/unit/chat7-final-sprint-superadmin-courses-content.test.ts`: `SA-academics-people-60 does not pretend URL video import works without a private scanned ingestion service`. Do not call this DONE or bypass the scanner. |
| SA-academics-people-64 | PARTIAL — direct publish/archive and offering builder access; submission grading drawer pending | `src/components/courses/admin-assessment-read-directory.tsx` adds assignment transitions, direct offering builder/submission entry, while `src/app/(authenticated)/admin/assignments/page.tsx` has filters and CSV. `tests/unit/chat7-final-sprint-superadmin-courses-content.test.ts`: `SA-academics-people-64 connects assignments to publish archive and existing builder`. In-page per-student points editing, Publish all graded and submission-aware delete dialog remain unimplemented. |
| SA-academics-people-65 | PARTIAL — direct publish/close/archive and publish-results action; full builder modal pending | `src/components/courses/admin-assessment-read-directory.tsx` adds quiz transitions and `AdminQuizResultsActions`; quiz CSV and query filters remain in `admin/quizzes/page.tsx`. `tests/unit/chat7-final-sprint-superadmin-courses-content.test.ts`: `SA-academics-people-65 exposes quiz transitions, result releases and existing builder entry`. Per-submission edit metadata and standalone quiz builder/submission modal still use offering navigation. |
| SA-academics-people-67 | DONE source (verified persisted learner rows; DB execution pending) | `src/modules/courses/super-admin-student-course-progress.ts` obtains an exact tenant-scoped offering roster, counts distinct persisted learner video completions, assignment submissions and quiz attempts, `super-admin-student-progress-model.ts` avoids manufactured percentages for empty denominators. `src/app/(authenticated)/admin/course-progress/students/page.tsx` reports Average completion, Students, Not started, Items measured and per-student Videos / Assignments / Quizzes / Progress; `src/app/api/admin/course-progress/students/export/route.ts` CSV-exports the same rows. `tests/unit/chat7-final-sprint-superadmin-courses-content.test.ts`: `SA-academics-people-67 computes real persisted learner progress without fabricated 0% when no content`. Course offering is the scope, with a 500-student upper bound disclosed; per-section denominator and DB/live verification remain to validate. |


## Chat-7 final sprint — additional direct authoring and CI remediation evidence

| Gap ID | Final implementation note | Test |
|---|---|---|
| SA-academics-people-53 | The Super Admin Lessons directory now exposes the existing `CollegeLessonVisibilityControl`, using registered lesson-visibility persistence and acting-college permission/CAS checks, in addition to course-scoped bulk content visibility. A native whole-course visibility bit remains separate, and not implemented. | `tests/unit/chat7-final-sprint-superadmin-courses-content.test.ts`: `SA-academics-people-53 authorizes Super Admin college scoped course and lesson-content visibility` |
| SA-academics-people-56 | New `src/components/courses/super-admin-lesson-create.tsx` adds the missing in-directory Add Lesson flow, with a selected offering learning-path picker, next sequence from the persisted lesson GET API, and POST through the existing tenant-scoped lesson service. The picker covers available lesson paths on the current page; offerings with no lesson are still accessible through their offering builder. The directory already offers edit, archive and keyboard reorder. | `tests/unit/chat7-final-sprint-superadmin-courses-content.test.ts`: `SA-academics-people-56 can edit archive reorder and open offering creation from the lesson directory` |
| SA-academics-people-50 | The Drizzle schema check `courses_card_color_hex_ck` now matches the proposed SQL; registration remains with orchestrator. | `tests/unit/chat7-final-sprint-superadmin-courses-content.test.ts`: `SA-academics-people-50 validates short title, optional official code and colour independently from internal code` |


### SA-academics-people-50 final metadata refinement

`courses.takeaways` is now a separate nullable, bounded 2,000-character field, not embedded into description: Drizzle + `docs/proposed-migrations/chat7-sa-course-catalogue-metadata.sql`, create/update validation and service, Super Admin create/edit controls, and readback in the Courses table. The gap-named SA-50 case in `tests/unit/chat7-final-sprint-superadmin-courses-content.test.ts` tests valid/oversized takeaways. The migration still requires orchestrator registration and private image upload remains BLOCKED on object-store/scanner provisioning. No database/CI test executed in lane.

### SA-academics-people-64 / -65 final authoring and submissions integration

The Super Admin Assignments and Quizzes pages now render the existing full College Admin assignment/quiz builder modals directly, reusing tenant-scoped authoring lesson options. The authoring service grants Super Admin scope only through `resolveActingCollege(context,"courses.manage")` and then reuses existing course-level permission checks. `src/components/courses/admin-assessment-read-directory.tsx` now embeds existing `CollegeAssignmentActions`, `CollegeAssignmentReview` (per-section individual submissions, grader actions and Publish grades with retry), `CollegeQuizActions` (metadata/question editor) and `CollegeQuizAttempts` drill-down, alongside direct publish/close/archive and result-release controls. `src/modules/courses/college-assignment-submission-review-service.ts` authorizes a scoped Super Admin's course review while rejecting a foreign-college assignment. Evidence tests: `tests/unit/chat7-final-sprint-superadmin-courses-content.test.ts` individual SA-64 and SA-65 cases. **Tests not run**, so do not claim verified runtime delivery. Per-section review permissions and exact file feature flags require integration validation.

### SA-academics-people-56 full active offering picker

`src/modules/courses/super-admin-learning-path-picker.ts` reads selected-college active learning paths, including those with **zero lessons**, with an acting-college permission gate. The Super Admin Lessons page passes these choices into `SuperAdminLessonCreate`, supporting first-lesson creation directly from the Lessons directory. The existing edit/archive/keyboard reorder and offering drag/reorder remain available. This closes the prior missing zero-lesson path caveat in the create flow; high-volume picker uses a documented 1,000-path bound. Gap-named unit case: `SA-academics-people-56 can edit archive reorder and open offering creation from the lesson directory` in `tests/unit/chat7-final-sprint-superadmin-courses-content.test.ts`. Tests authored, not executed.

### chat-9 reassessment — SA-academics-people-60

| ID | Status | Evidence |
|---|---|---|
| SA-academics-people-60 | BLOCKED | Private object storage and an SSRF-resistant server-side media ingestion/scanner pathway are not provisioned. Do not fetch arbitrary external video URLs server-side or present a link as a completed binary import. Existing signed-grant upload path and safe YouTube/link authoring remain intact; `tests/unit/chat9-final-named-gap-verification.test.ts` → `SA-academics-people-60 BLOCKED: refuses fake remote video ingestion before private scanner exists`. |


## Chat-7 supplementary remediation (source committed; CI pending)

| ID | Status | New evidence |
|---|---|---|
| SA-academics-people-52 | DONE in source; runtime pending | Failed-course IDs now derive from exact failed content/lesson results; the client Retry failed does not replay successfully updated courses. `tests/unit/chat7-final-sprint-superadmin-course-visibility.test.ts` — `SA-academics-people-52 sends only failed courses on retry instead of reapplying successful changes`. |
| SA-academics-people-53 | PARTIAL | The same failed-course mapping remains scoped to selected courses and the acting college, but a native whole-course visibility bit remains separate. `tests/unit/chat7-final-sprint-superadmin-course-visibility.test.ts`. |
| SA-academics-people-62 | PARTIAL | Legacy public HTTPS link previews are now revalidated at render before creating a third-party link; test `SA-academics-people-62 imported content links fail closed` in `tests/unit/chat7-superadmin-content-public-link-safety.test.ts`. Private material previews and scanner remain blocked. |

No TypeScript, Vitest, browser or PostgreSQL execution was performed by chat-7. Existing infrastructure and release blockers remain unchanged.

## Chat-7 actionable catalogue copy correction (2026-10-18)

| ID | Status | Evidence |
|---|---|---|
| SA-academics-people-56 | PARTIAL; corrected misleading directory copy | The Super Admin Lessons page no longer claims to be "Read-only" while presenting create, edit, archive and reorder. `tests/unit/chat7-superadmin-course-catalogue-actionable-copy.test.ts` — `SA-academics-people-56 does not describe an actionable Lessons directory as read-only`. |
| SA-academics-people-64 | PARTIAL; corrected misleading directory copy | Assignment directory now states its scope without claiming read-only; create, review and grade actions remain surfaced. `tests/unit/chat7-superadmin-course-catalogue-actionable-copy.test.ts`. |
| SA-academics-people-65 | PARTIAL; corrected misleading directory copy | Quiz directory now states its scope without claiming read-only; create, attempts and result-release actions remain surfaced. `tests/unit/chat7-superadmin-course-catalogue-actionable-copy.test.ts`. |

Tests authored, not executed. This copy correction does not satisfy the unfinished full legacy authoring/grade publication matrix or PostgreSQL tenant/scope verification.

## Chat-7 export-filter parity — source remediation (2026-10-18)

| ID | Status | Evidence |
|---|---|---|
| SA-academics-people-64 | PARTIAL; filtered CSV contract now correct | Admin Assignments export previously discarded selected course-code and audience scope (kept only search and status). `src/modules/courses/admin-assessment-directory-model.ts:adminAssessmentExportHref` now projects the exact directory filter schema without a page number; `src/app/(authenticated)/admin/assignments/page.tsx` uses it. `tests/unit/chat7-superadmin-assessment-export-filter-parity.test.ts` — `SA-academics-people-64 assignment CSV keeps the exact active course and audience filters, without paging`. |
| SA-academics-people-65 | PARTIAL; filtered CSV contract now correct | Admin Quizzes CSV also preserves results-release filter and audience/course constraints; no request-supplied college ID is accepted by URL helper. Same regression suite — `SA-academics-people-65 quiz CSV carries published-results state but cannot emit stale pagination`. |

Tests authored, not run. These are export-URL/scope correctness repairs, not proof of full legacy export Excel parity, grading lifecycle or Postgres tenant isolation.

## Chat-7 role and error hardening (2026-10-18, CI pending)

| ID | Status | Evidence |
|---|---|---|
| SA-academics-people-67 | DONE in source; CI/PostgreSQL pending | `src/modules/courses/super-admin-student-course-progress.ts` now restricts the roster to an ACTIVE learner role, non-ended offering delivery, matching Section/cohort/academic period and the selected college; a 501st sentinel row prevents falsely labelling exactly 500 results truncated. `tests/unit/chat7-superadmin-progress-roster-security.test.ts` — `SA-academics-people-67 uses only active LEARNER membership in the exact offering cohort, period and section`, `SA-academics-people-67 fetches a sentinel row before marking the 500-row export/page as truncated`, `SA-academics-people-67 never invents a 0% completion rate for a course with no measurable content`. |
| SA-academics-people-64 | PARTIAL (friendly failures fixed; lifecycle verification open) | `src/components/courses/college-assignment-actions.tsx` retains a visible, actionable message on unknown save/read errors instead of rendering raw internal API codes. `tests/unit/chat7-superadmin-assessment-friendly-errors.test.ts` — `SA-academics-people-64 does not expose unexpected API error identifiers while editing and reviewing assignments`. |
| SA-academics-people-65 | PARTIAL (friendly failures fixed; lifecycle verification open) | `src/components/courses/college-quiz-actions.tsx` and `college-quiz-attempts.tsx` replace raw server codes in the error fallback while preserving known stale-version guidance. `tests/unit/chat7-superadmin-assessment-friendly-errors.test.ts` — `SA-academics-people-65 renders friendly failure text for quiz updates and submissions without leaking internal errors`. |

These are source and authored-test changes, not a claim of a green CI run, browser verification or a completed entire lane queue. The `SA-academics-people-50` image and `-60` URL video importer remain blocked on private scanned storage.

## SA-academics-people-67 follow-up — Section-specific measurement integrity

| ID | Status | Verified source evidence and test |
|---|---|---|
| SA-academics-people-67 | DONE in source; CI and real-PostgreSQL pending | `src/modules/courses/super-admin-student-course-progress.ts` now computes video, assignment and quiz denominators **per learner**, including only shared items or items assigned to the learner's active eligible delivery, and filters completed/submitted/attempted numerators to those same eligible deliveries. It excludes draft/archived learning paths (requires actual `PUBLISHED` enum), inactive lessons, disabled student content and revoked membership. The students page and CSV both use each learner's own denominators, so a section-specific assignment cannot reduce completion for an unrelated Section. `tests/unit/chat7-superadmin-progress-roster-security.test.ts` — `SA-academics-people-67 restricts each learner's item denominator to active delivery audience`. PostgreSQL query parity and >500-row performance still require CI harness. |

## SA-academics-people-62 full ancestry visibility correction

| ID | Status | Evidence |
|---|---|---|
| SA-academics-people-62 | PARTIAL: effective visibility DONE in source; private binary preview BLOCKED | `src/modules/courses/super-admin-content-directory-service.ts` now retrieves the learning-path and owning Course statuses; `src/modules/courses/super-admin-content-directory-model.ts` enforces `PUBLISHED` path + content, ACTIVE lesson/offering/Course and content visibility before displaying "Students Visible". `src/components/courses/super-admin-content-directory-page.tsx` uses it; `tests/unit/chat7-superadmin-effective-content-visibility.test.ts` — `SA-academics-people-62 effective student content visibility`. This prevents a draft/archived learning path from misleading staff. Binary/private material previews remain gated on signed, scanned storage. Test authored, CI not executed in this lane. |
