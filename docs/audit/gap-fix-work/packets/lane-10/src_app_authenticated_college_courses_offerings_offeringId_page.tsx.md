# Work packet: edit src/app/(authenticated)/college/courses/offerings/[offeringId]/page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/college-admin-course-detail.md

## G2-19-007-001  [P1] GAP  facet F01  effort L
- Legacy: Legacy route `/college-admin/courses/[id]` accepts `crs-` slug and numeric ID `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:60-69` `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:93-116`
- vNext now: vNext route `/college/courses/offerings/[offeringId]` uses UUID offeringId `src/app/(authenticated)/college/courses/offerings/[offeringId]/page.tsx:5-13` `src/app/(authenticated)/college/courses/offerings/[offeringId]/page.tsx:21-31`
- Fix: Add compatibility redirects resolving authorized numeric course IDs/slugs to the correct offering.

## G2-19-007-002  [P1] MISSING  facet F01  effort M
- Legacy: Legacy numeric ID automatically router.replace to same URL with course.slug `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:94-113`
- vNext now: vNext no legacy course ID/slug redirect at offering detail page `src/app/(authenticated)/college/courses/offerings/[offeringId]/page.tsx:21-33`
- Fix: Implement exact safe old-link rewrite preserving Back history.

## G2-19-007-022  [P1] GAP  facet F05  effort M
- Legacy: Legacy section default generic value0, changing class clears open lesson detail `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:29-35` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:393-397`
- vNext now: vNext uses optional deliveryId UUID query and shows metadata preview after submit `src/app/(authenticated)/college/courses/offerings/[offeringId]/page.tsx:22-29` `src/components/courses/admin-offering-section-preview.tsx:30-45`
- Fix: Reset selected lesson when section scope changes, avoid stale lesson detail.

## G2-19-007-024  [P1] GAP  facet F06  effort M
- Legacy: Legacy numeric route detection `!isNaN(id)` and parseInt `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:93-95`
- vNext now: vNext `offeringId` UUID from URL, no numeric support `src/app/(authenticated)/college/courses/offerings/[offeringId]/page.tsx:21-28`
- Fix: Validate and map numeric IDs without accepting unsupported tenant IDs.

## G2-19-007-073  [P1] MISSING  facet F20  effort M
- Legacy: Legacy numeric redirect uses router.replace preserving no extra history entry `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:103-113`
- vNext now: vNext no legacy compatibility route `src/app/(authenticated)/college/courses/offerings/[offeringId]/page.tsx:21-33`
- Fix: Add server redirect/rewrite preserving URL history and old links.

## G2-19-007-076  [P1] GAP  facet F22  effort L
- Legacy: Legacy course uses numeric id and `crs-` slug, lessonId, classId `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:60-95` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:555-596`
- vNext now: vNext UUID course/offerings/learningPaths/lessons/deliveries `src/app/(authenticated)/college/courses/offerings/[offeringId]/page.tsx:9-29` `src/components/courses/admin-offering-learning-overview.tsx:298-345`
- Fix: Map legacy ids, slugs and class-specific content to UUID schema and redirects.
