# Work packet: edit src/components/courses/college-assignment-review.tsx

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-admin-assignments.md, docs/audit/gap2/lane-4/superadmin-assignments.md, docs/audit/gap2/lane-4/superadmin-sections-assignments.md

## G2-4-004-054  [P1] GAP  facet F10  effort M
- Legacy: Legacy bulk POST `/api/v1/admin/assignments/{id}/publish-grades` performs server-side partial commits and one bulk audit entry. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:63-132`)
- vNext now: Client loops paginated submissions then sends one POST per grade; batch summary client-side. (`src/components/courses/college-assignment-review.tsx:29-70`)
- Fix: Provide server-side atomic-scope partial publishing endpoint with bulk audit and retry receipt; avoid client interruption.

## G2-4-004-089  [P1] GAP  facet F20  effort M
- Legacy: Legacy bulk publisher limits 1000 recent submissions, skips ungraded/published, independent commits and failed reasons. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:48-50; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:85-132`)
- vNext now: VNext loops all pages client-side, fails partially if tab closes or network breaks, retries failed IDs. (`src/components/courses/college-assignment-review.tsx:29-70`)
- Fix: Move bulk into resumable server operation with idempotency and audit trail; avoid browser-lifetime dependency.

## G2-4-004-093  [P1] GAP  facet F21  effort M
- Legacy: Legacy bulk publisher optional AdminAuditLogService event `ASSIGNMENT_GRADES_PUBLISH_ALL`. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:118-124`)
- vNext now: VNext bulk client orchestrates individual publish operations; no explicit equivalent bulk event in component. (`src/components/courses/college-assignment-review.tsx:29-70`)
- Fix: Record one bulk parent audit event with per-learner publish results.

## G2-4-004-101  [P1] GAP  facet F23  effort M
- Legacy: Legacy publisher can handle graded submissions across entire assignment via single request. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:63-132`)
- vNext now: VNext Publish grades operates one Section at a time, requiring manual repetition for shared offerings. (`src/components/courses/college-assignment-review.tsx:29-50; src/components/courses/college-assignment-review.tsx:77-99`)
- Fix: Add assignment-wide publish-all with aggregated stats and audit while permitting Section-specific controls.

## G2-4-007-033  [P1] GAP  facet F09  effort M
- Legacy: Publish all grades Popconfirm with skip-unmarked wording. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:365-370`)
- vNext now: Native confirmation and client-side section publish. (`src/components/courses/college-assignment-review.tsx:29-70`)
- Fix: Use styled confirmation and server-grade publish-all across all deliveries.

## G2-4-007-037  [P1] GAP  facet F10  effort M
- Legacy: Java bulk POST publish grades scopes whole lesson assignment, server publishes up to1000 with partial failures. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:63-132`)
- vNext now: Browser cycles section submissions and calls per-student publish. (`src/components/courses/college-assignment-review.tsx:29-70`)
- Fix: Provide server bulk publisher and bulk audit receipt.

## G2-4-007-057  [P1] GAP  facet F21  effort M
- Legacy: Bulk publish makes ADMIN_ASSIGNMENT_GRADES audit event with successes/skips. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:118-124`)
- vNext now: No browser-level bulk audit; individual API only. (`src/components/courses/college-assignment-review.tsx:29-70`)
- Fix: Create bulk parent audit entry.

## G2-4-010-054  [P1] GAP  facet F10  effort M
- Legacy: Legacy bulk POST `/api/v1/admin/assignments/{id}/publish-grades` performs server-side partial commits and one bulk audit entry. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:63-132`)
- vNext now: Client loops paginated submissions then sends one POST per grade; batch summary client-side. (`src/components/courses/college-assignment-review.tsx:29-70`)
- Fix: Provide server-side atomic-scope partial publishing endpoint with bulk audit and retry receipt; avoid client interruption.

## G2-4-010-089  [P1] GAP  facet F20  effort M
- Legacy: Legacy bulk publisher limits 1000 recent submissions, skips ungraded/published, independent commits and failed reasons. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:48-50; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:85-132`)
- vNext now: VNext loops all pages client-side, fails partially if tab closes or network breaks, retries failed IDs. (`src/components/courses/college-assignment-review.tsx:29-70`)
- Fix: Move bulk into resumable server operation with idempotency and audit trail; avoid browser-lifetime dependency.

## G2-4-010-093  [P1] GAP  facet F21  effort M
- Legacy: Legacy bulk publisher optional AdminAuditLogService event `ASSIGNMENT_GRADES_PUBLISH_ALL`. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:118-124`)
- vNext now: VNext bulk client orchestrates individual publish operations; no explicit equivalent bulk event in component. (`src/components/courses/college-assignment-review.tsx:29-70`)
- Fix: Record one bulk parent audit event with per-learner publish results.

## G2-4-010-101  [P1] GAP  facet F23  effort M
- Legacy: Legacy publisher can handle graded submissions across entire assignment via single request. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:63-132`)
- vNext now: VNext Publish grades operates one Section at a time, requiring manual repetition for shared offerings. (`src/components/courses/college-assignment-review.tsx:29-50; src/components/courses/college-assignment-review.tsx:77-99`)
- Fix: Add assignment-wide publish-all with aggregated stats and audit while permitting Section-specific controls.

## G2-4-010-119  [P1] GAP  facet F09  effort M
- Legacy: Submissions action opens width760 Modal; publish all uses styled Popconfirm. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:87-156;docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:365-370`)
- vNext now: New SA submissions in item Disclosure and native window.confirm bulk action. (`src/components/courses/admin-assessment-read-directory.tsx:76-83;src/components/courses/college-assignment-review.tsx:29-70`)
- Fix: Restore 760px review modal and accessible Popconfirm, avoid native confirm.

## G2-4-010-120  [P1] GAP  facet F10  effort M
- Legacy: Old bulk publish across entire assignment in one server POST, emits summarized audit event. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:63-132`)
- vNext now: New client loops pages per delivery and individually publishes each submission. (`src/components/courses/college-assignment-review.tsx:29-70`)
- Fix: Add server-side assignment-wide idempotent bulk publish and audit receipt.

## G2-4-004-044  [P2] GAP  facet F08  effort M
- Legacy: Legacy delete success toast `Assignment deleted` and grade publish summary e.g. `N published · M not yet marked`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:295-326`)
- vNext now: Delete notice `Assignment deleted.` and publish summary `N grade(s) published; ...`. (`src/components/courses/college-assignment-actions.tsx:67-69; src/components/courses/college-assignment-review.tsx:62-69`)
- Fix: Match punctuation and human-readable published/skipped/already-published counts.

## G2-4-007-030  [P2] GAP  facet F08  effort M
- Legacy: Grade publish summary N published · M not yet marked · K already published. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:295-314`)
- vNext now: Section-based grade publish summary distinct phrasing. (`src/components/courses/college-assignment-review.tsx:29-70`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-010-044  [P2] GAP  facet F08  effort M
- Legacy: Legacy delete success toast `Assignment deleted` and grade publish summary e.g. `N published · M not yet marked`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:295-326`)
- vNext now: Delete notice `Assignment deleted.` and publish summary `N grade(s) published; ...`. (`src/components/courses/college-assignment-actions.tsx:67-69; src/components/courses/college-assignment-review.tsx:62-69`)
- Fix: Match punctuation and human-readable published/skipped/already-published counts.

## G2-4-010-118  [P2] GAP  facet F08  effort M
- Legacy: Bulk grade publish summary mentions N published / M not yet marked / K already published. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:295-314`)
- vNext now: New review publishes per section, summary uses different count categories. (`src/components/courses/college-assignment-review.tsx:29-70`)
- Fix: Return assignment-wide published/skipped/already-published summary matching old text.
