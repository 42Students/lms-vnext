# Work packet: edit src/components/courses/admin-offering-section-preview.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/college-admin-course-detail.md

## G2-19-007-022  [P1] GAP  facet F05  effort M
- Legacy: Legacy section default generic value0, changing class clears open lesson detail `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:29-35` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:393-397`
- vNext now: vNext uses optional deliveryId UUID query and shows metadata preview after submit `src/app/(authenticated)/college/courses/offerings/[offeringId]/page.tsx:22-29` `src/components/courses/admin-offering-section-preview.tsx:30-45`
- Fix: Reset selected lesson when section scope changes, avoid stale lesson detail.

## G2-19-007-023  [P1] GAP  facet F05  effort L
- Legacy: Legacy class-specific syllabus query fetches specific content `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:555-568`
- vNext now: vNext shared Learning Overview shown independently, Section Preview only metadata `src/components/courses/admin-offering-learning-overview.tsx:397-405` `src/components/courses/admin-offering-section-preview.tsx:44-59`
- Fix: Render actual scoped course syllabus including section items when class selected.

## G2-19-007-030  [P1] GAP  facet F07  effort M
- Legacy: Legacy class list failure `Sections couldn't be loaded, so you're seeing shared content only.` with Retry `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:385-389`
- vNext now: vNext error/limit banners only on Section Preview, and promise list read may throw `src/components/courses/admin-offering-learning-page.tsx:49-53` `src/components/courses/admin-offering-section-preview.tsx:42-43`
- Fix: Keep shared syllabus usable when section list fails; show targeted Retry.

## G2-19-007-044  [P1] GAP  facet F12  effort L
- Legacy: Legacy course-level generic syllabus default shows shared and every section's content `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:91-97` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:404-410`
- vNext now: vNext shared learningPath rendered and separate section metadata preview `src/components/courses/admin-offering-learning-overview.tsx:388-405` `src/components/courses/admin-offering-section-preview.tsx:44-59`
- Fix: Reconcile all-section combined view, don't silently hide section items.

## G2-19-007-045  [P1] GAP  facet F12  effort L
- Legacy: Legacy section option says exactly what its students see `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:91-97`
- vNext now: vNext preview warns metadata only, doesn't reveal private links or individualized enrollment `src/components/courses/admin-offering-section-preview.tsx:44-47`
- Fix: Provide learner-perspective preview with scoped access/verified links; retain privacy controls.

## G2-19-007-082  [P1] GAP  facet F23  effort L
- Legacy: Legacy class-specific view allowed exact student-visible content `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:91-97` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:404-410`
- vNext now: vNext section preview metadata only, private links intentionally hidden `src/components/courses/admin-offering-section-preview.tsx:44-59`
- Fix: Provide secure as-learner preview without private link exposure.

## G2-19-007-033  [P2] GAP  facet F08  effort S
- Legacy: Legacy class list failure inline warning and Retry `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:385-389`
- vNext now: vNext metadata-only selection banner invalid/first200, not specific fetch failure `src/components/courses/admin-offering-section-preview.tsx:42-46`
- Fix: Distinguish transport failure from invalid section selection.
