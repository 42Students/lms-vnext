# Work packet (wave 2): edit src/app/(authenticated)/admin/faculty/page.tsx (part 2 of 2)

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/l15-u027-faculty-controller.md, docs/audit/gap2/lane-19/faculty-search-controller.md

## G2-15-027-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:43-101 single Faculty module has registration, bulk, search, edit and filters
- vNext now: src/app/(authenticated)/admin/faculty/page.tsx:20-44 different ReadPage plus disclosure and row tools
- Fix: Reproduce legacy faculty registration, roster, edit and import panel order while preserving one canvas.

## G2-15-027-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:65-79 department/type/status filters and personalized search
- vNext now: src/app/(authenticated)/admin/faculty/page.tsx:13-35 ALL/ACTIVE/SUSPENDED/ENDED status plus generic people filters
- Fix: Provide same department and FacultyType hierarchy, with accurate scope, order and defaults.

## G2-15-027-011  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:286-314 superadmin getAllFaculty scoped org/college or global array
- vNext now: src/app/(authenticated)/admin/faculty/page.tsx:19-35 adminScope-selected faculty picker and paged scoped people UI
- Fix: Preserve selected college/organization scoping and allowed global superadmin list.

## G2-15-027-015  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:372-382 unpaged branch ignores dept/type/status, paged branch honors all
- vNext now: src/app/(authenticated)/admin/faculty/page.tsx:13-35 status filter passed to admin scoped read page
- Fix: Document old inconsistency and preserve useful filters while specifying intentional correction.

## G2-15-027-016  [P2] MISSING  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:165-216 most recently selected and popular faculty default suggestions
- vNext now: src/app/(authenticated)/admin/faculty/page.tsx:33-36 simple scoped list filters with no evidence of popular/recent suggestion component
- Fix: Restore recent/popular person suggestions if approved, tenant-filtered and privacy safe.

## G2-15-027-017  [P2] MISSING  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:224-275 search suggestions debounce and stale-request sequence guard, max15
- vNext now: src/app/(authenticated)/admin/faculty/page.tsx:33-36 generic people loader controls, no search suggestion route here
- Fix: Implement query suggestions with debounce, cancellation and tenant-side enforcement.

## G2-15-027-049  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:286-314 no assigned college returns empty array
- vNext now: src/app/(authenticated)/admin/faculty/page.tsx:19-33 admin scope suppresses onboarding without college
- Fix: Show contextual No college selected state while keeping navigation.

## G2-15-027-050  [P2] MISSING  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:308-316 stale out-of-college search suggestion warns and retains roster
- vNext now: src/app/(authenticated)/admin/faculty/page.tsx:33-36 general scoped roster row actions
- Fix: Guard stale selection and preserve roster on missing/foreign search suggestion.

## G2-15-027-059  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:387-415 Register faculty and success copy
- vNext now: src/app/(authenticated)/admin/faculty/page.tsx:33-35 Registered Faculty and OTP login description
- Fix: Use exact legacy labels where page clone contract applies; preserve new detailed help where deliberate.

## G2-15-027-062  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:224-275 debounced search takes top15 plus request sequence guard
- vNext now: src/app/(authenticated)/admin/faculty/page.tsx:33-36 generic admin loader
- Fix: Enforce server max15 for suggestions, cancellation and college key.

## G2-19-013-050  [P3] GAP  facet F18  effort S
- Legacy: Legacy literal response `Faculty retrieved`, `Popular faculty retrieved`, `Checked` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:229-230` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:186-188` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:366-368`
- vNext now: vNext page names `Registered Faculty`, `No matching records` `src/app/(authenticated)/admin/faculty/page.tsx:33-35` `src/components/admin/admin-scoped-read-page.tsx:243-259`
- Fix: Map copy to same user task; preserve meaningful labels.
