# Work packet (wave 2): edit src/components/courses/faculty-course-list.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u001-teacher-courses.md

## G2-15-001-004  [P2] GAP  facet F02  effort M
- Legacy: Title, optional metrics row, right-side conditional section selector and search precede course card grid (CoursesContent.jsx:381-422,467-495).
- vNext now: PageHeader then disclosures, four-filter GET form, result count, two-column list (page.tsx:31-37; faculty-course-list.tsx:65-131).
- Fix: Restore legacy order: title with metric pills and right-edge search/filter; keep necessary new filters without disrupting layout.

## G2-15-001-005  [P2] GAP  facet F02  effort M
- Legacy: PageShell wraps one module-card and list grid (CoursesContent.jsx:425-440,467-470; PageShell.jsx:50-89).
- vNext now: Page root space-y-6; grid of unboxed, bordered row-links (page.tsx:31-38; faculty-course-list.tsx:130-199).
- Fix: Align canvas boundaries/spacing/card grid to PageShell's white module canvas and legacy course-card styling.

## G2-15-001-016  [P2] GAP  facet F04  effort M
- Legacy: Section fallback `Unknown section` and empty batch accepted on legacy card (CoursesContent.jsx:310-315,523-525).
- vNext now: Section/cohort are required successful joins (faculty-course-service.ts:158-167; faculty-course-list.tsx:168-172).
- Fix: Represent incomplete legacy data explicitly for admins; do not silently omit.

## G2-15-001-020  [P2] GAP  facet F05  effort M
- Legacy: Search empty string default, with immediate client-side results and clear affordance (CoursesContent.jsx:61-67,283-285,417-420).
- vNext now: GET search uses 350ms debounce router.replace plus Apply/Clear filters (faculty-course-filter-auto-submit.tsx:15-30; faculty-course-list.tsx:83-118).
- Fix: Match instant in-list client filtering/clear UX or explicitly test and document justified server-side difference.

## G2-15-001-021  [P2] GAP  facet F05  effort M
- Legacy: Results render first 48 and Show more extends by 48, preserving prior cards (CoursesContent.jsx:20,285-288,566-569).
- vNext now: Page number sliced into 48 with Pagination and URL `page` (faculty-course-list-model.ts:17,33-47; faculty-course-list.tsx:201-202).
- Fix: Replace numbered paging with progressive reveal or obtain owner-approved non-parity exemption.
