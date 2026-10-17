# Super Admin / Courses and Content gap acceptance

Test authored, **not run**; orchestrator executes it.

| ID | Status | Evidence and test name |
|---|---|---|
| SA-academics-people-69 | DONE | `src/modules/admin-ui/super-admin-learning-csv-service.ts`, four `src/app/api/admin/{lessons,course-progress,assignments,quizzes}/export/route.ts`; `tests/unit/chat6-superadmin-content-verified-exports.test.ts` → `SA-academics-people-69 exposes four selected-college bounded CSV endpoints` |

Remaining: course field/policy parity, lesson-level operations, class-by-course progress, rich content and assignment/quiz actions. `SA-academics-people-58/59/60` binary files and URL import remain storage/scanner-dependent; content editing without files is partial. `SA-academics-people-57/68` bulk controls and course/batch selectors exist, but legacy lesson-level and exact class filtering must be verified before closure.
