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
