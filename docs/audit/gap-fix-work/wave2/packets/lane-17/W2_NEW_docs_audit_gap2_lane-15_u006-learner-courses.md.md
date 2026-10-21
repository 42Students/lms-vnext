# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-15/u006-learner-courses.md

25 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-15/u006-learner-courses.md

## G2-15-006-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy click invokes activateCourse Redux courseId/classId and navigates (CoursesContent.jsx:73-81,551-553)
- vNext now: VNext only Next Link by delivery ID (learner-course-list.tsx:377-382)
- Fix: Verify descendant workspace derives all selection state from authorized delivery rather than legacy Redux

## G2-15-006-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy metric pills Semester/Courses/Credits next to title (CoursesContent.jsx:383-397)
- vNext now: VNext info badges Program/Semester/Courses/Credits below filters (learner-course-list.tsx:279-302)
- Fix: Move to header metric pill row and match icons/teal-indigo-emerald visual states

## G2-15-006-006  [P2] GAP  facet F02  effort L
- Legacy: Legacy grid includes image then card body/title/instructor/credits, no other KPI rows (CoursesContent.jsx:513-545)
- vNext now: VNext large card with code, desc, batch, progress, last activity, due, next item/action (learner-course-list.tsx:378-488)
- Fix: Rebuild compact legacy card silhouette, reveal progress enhancements in secondary affordance

## G2-15-006-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy cover image 400x140 with fallback learn-ability.svg (CoursesContent.jsx:20-33,513-515; courseListingUtils.js:3-5)
- vNext now: VNext relative min-h-24 header with LearnerCourseCardImage and code overlay (learner-course-list.tsx:382-397)
- Fix: Match image 400x140 aspect/object-fit and overlay-free cover; preserve broken image fallback

## G2-15-006-010  [P2] GAP  facet F03  effort S
- Legacy: Legacy credits in card footer `N Credits` even 0, invalid shows `Credits unavailable` (CoursesContent.jsx:533-537)
- vNext now: VNext only when truthy credits, hides zero; invalid credits constrained typed (learner-course-list.tsx:420-424)
- Fix: Render explicitly recorded 0 credits and invalid-value badge, no truthiness filtering

## G2-15-006-016  [P2] GAP  facet F04  effort M
- Legacy: Legacy credits safeCredits excludes NaN and negative, warning on invalid source (courseListingUtils.js:54-58; CoursesContent.jsx:294-307,483-488)
- vNext now: VNext learnerCourseCreditSummary tracks nullable credits but invalid DB numeric may not reach UI (learner-course-list.tsx:167-169,293-302)
- Fix: Validate negativity/NaN on service boundary, keep exact invalid credit warning

## G2-15-006-017  [P2] GAP  facet F05  effort M
- Legacy: Legacy semester picker in click-triggered Filters Popover, minWidth180 (`Select semester`), retries on failed list (CoursesContent.jsx:335-343,411-416)
- vNext now: VNext permanent Semester native Select on first row (learner-course-list.tsx:175-200)
- Fix: Restore popover button and semester selector state (or owner-approved visible UX)

## G2-15-006-019  [P2] GAP  facet F05  effort S
- Legacy: Legacy on semester change clears search/visibleLimit, preserves prior cards during fetch (CoursesContent.jsx:248-255)
- vNext now: VNext clears all advanced filters including sort and type, instant client select (learner-course-list.tsx:180-190)
- Fix: Only clear legacy search/show-more fields on semester switch unless advanced filter policy approved

## G2-15-006-021  [P2] GAP  facet F05  effort S
- Legacy: Legacy search name, faculty, section, batch, code, academic year, instructors (courseListingUtils.js:38-45)
- vNext now: VNext adds program/semester/period dates, but not legacy arbitrary faculty label (learner-course-card-search-model.ts:4-16)
- Fix: Add mapped faculty fallback and test year matching

## G2-15-006-024  [P2] GAP  facet F05  effort M
- Legacy: Legacy cards preserve backend order regular then electives, each group intact (CoursesContent.jsx:283-291)
- vNext now: VNext explicitly sorts NAME then electives, changes within-group order (learner-course-sort-model.ts:15-44)
- Fix: Restore authorized backend course offering displayOrder, or document intentional alphabetical sorting

## G2-15-006-026  [P2] GAP  facet F06  effort S
- Legacy: Legacy search placeholder `Search courses…` and icon prefix, allowClear (CoursesContent.jsx:417-420)
- vNext now: VNext exact placeholder but no search icon/prefix or clear button, maxLength100 (learner-course-list.tsx:202-214)
- Fix: Restore search icon and clear affordance in header

## G2-15-006-027  [P2] GAP  facet F06  effort M
- Legacy: Legacy semester Select accepts no semester found/async loading, showRetry (CoursesContent.jsx:335-343,411-416)
- vNext now: VNext native Select with options, no pending/retry interaction (learner-course-list.tsx:175-200)
- Fix: Render loading, empty option and Retry semesters state

## G2-15-006-036  [P2] GAP  facet F09  effort M
- Legacy: Legacy Semester Filters popup on button label selected period (CoursesContent.jsx:411-414)
- vNext now: VNext fixed Semester Select, no Filters popup (learner-course-list.tsx:175-200)
- Fix: Restore anchored Filters popover and keyboard focus handling

## G2-15-006-049  [P2] GAP  facet F13  effort S
- Legacy: Legacy search miss `No courses match “{search}”`, type filter empty custom sentence (CoursesContent.jsx:496-503)
- vNext now: VNext EmptyState title from learnerCourseFilteredEmptyTitle, extra descriptive text (learner-course-list.tsx:342-345)
- Fix: Match filter-specific exact text and quoted search query, retain guidance as extra paragraph only

## G2-15-006-050  [P2] GAP  facet F13  effort M
- Legacy: Legacy broken credit values show warning and `Credits unavailable` per card (CoursesContent.jsx:483-488,534-537)
- vNext now: VNext summary missing count/credits not recorded, no source-invalid distinction (learner-course-list.tsx:293-302,420-424)
- Fix: Expose invalid vs missing credit warning, exclude invalid totals

## G2-15-006-054  [P2] GAP  facet F16  effort L
- Legacy: Legacy `.learn-courses-grid` with 400x140 image, PageShell responsive cards (CoursesContent.jsx:425-440,489-495,513-544)
- vNext now: VNext grid md2 xl3, card min-h72, image min-h24, long copy (learner-course-list.tsx:348-384,399-488)
- Fix: Rebuild legacy column count, heights and cover aspect at 375,768,1280

## G2-15-006-055  [P2] GAP  facet F16  effort M
- Legacy: Legacy course type toggle right-aligned with Search and Filters in header (CoursesContent.jsx:399-420)
- vNext now: VNext type toggle below/aside fixed Semester and Search, expandable More filters (learner-course-list.tsx:174-235)
- Fix: Reposition controls to legacy header row with responsive wrapping

## G2-15-006-056  [P2] GAP  facet F17  effort S
- Legacy: Legacy list aria-label Course list and aria-live announcements, search label/allowClear (CoursesContent.jsx:417-420,425-430,489-495)
- vNext now: VNext result role=status aria-live and Input label but not same Course list section landmark (learner-course-list.tsx:171-173,341-348)
- Fix: Restore Course list aria landmark and assistive loading/focus semantics

## G2-15-006-059  [P2] GAP  facet F18  effort M
- Legacy: Legacy elective slot name, status reason and off-current `Not your current semester: shown for reference` (CoursesContent.jsx:240-246,526-528,554-560)
- vNext now: VNext generic Elective and Past semester badge only (learner-course-list.tsx:389-395)
- Fix: Restore exact actionable vs reference-only wording and slot name

## G2-15-006-060  [P2] GAP  facet F18  effort S
- Legacy: Legacy header metric `N Credits` with invalid excluded and program pill (CoursesContent.jsx:383-395)
- vNext now: VNext `N recorded credits`, `Credits not recorded` badges (learner-course-list.tsx:280-302)
- Fix: Match legacy Credits grammar/metric pill subtitle

## G2-15-006-062  [P2] GAP  facet F19  effort S
- Legacy: Legacy popover first100 course names and first100 credit rows (CoursesContent.jsx:346-370)
- vNext now: VNext Scrollable All Courses first100 but credits breakdown `periodRows.map` unbounded (learner-course-list.tsx:314-329)
- Fix: Cap credits breakdown to100 with overflow guidance; preserve accessible scroll

## G2-15-006-064  [P2] GAP  facet F20  effort M
- Legacy: Legacy malformed duplicate detection by course identifier, invalid displayed (courseListingUtils.js:74-92)
- vNext now: VNext duplicate detection by deliveryId, mapping invalid shown (learn/courses/page.tsx:36-75)
- Fix: Detect duplicated source course mapping IDs too, while allowing distinct section/term deliveries

## G2-15-006-065  [P2] GAP  facet F20  effort S
- Legacy: Legacy selection fallback on missing semester explicitly announced (CoursesContent.jsx:233-255,480-482)
- vNext now: VNext resolveLearnerCoursePeriod silently selects existing option (learner-course-list.tsx:112-114)
- Fix: Announce fallback with exact message and preserve selected period

## G2-15-006-070  [P2] GAP  facet F23  effort L
- Legacy: Legacy compact card-only listing with popover metrics and type/search controls (CoursesContent.jsx:381-423,467-573)
- vNext now: VNext adds progress/recent/due/continue/term filters, changes surface hierarchy (learner-course-list.tsx:171-509)
- Fix: Clone legacy shell/card/filter geometry before approving extra data

## G2-15-006-022  [P3] GAP  facet F05  effort S
- Legacy: Legacy search immediately local on keystroke, no maxLength (CoursesContent.jsx:417-420)
- vNext now: VNext immediate local, maxLength100 (learner-course-list.tsx:202-214)
- Fix: Decide 100-char hard cap; show user-facing feedback on paste
