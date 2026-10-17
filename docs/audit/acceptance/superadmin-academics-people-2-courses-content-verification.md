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
