# Work packet: NEW / MISSING items from docs/audit/gap2/lane-15/u006-learner-courses.md

12 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-15/u006-learner-courses.md

## G2-15-006-002  [P1] GAP  facet F01  effort M
- Legacy: Legacy links `/learn/courses/{slug\|\|id}/home`, teacher cls only (courseListingUtils.js:7-30)
- vNext now: VNext links `/learn/courses/{deliveryUUID}/home` (learner-course-list.tsx:377-380)
- Fix: Map legacy slug/id bookmarks to scoped delivery UUID with tenant-safe redirects

## G2-15-006-013  [P1] GAP  facet F04  effort L
- Legacy: Legacy learner course normalization handles id/slug/name/image, isElective/slotName, active/enabled/locked, academic setup (courseListingUtils.js:75-123)
- vNext now: VNext joins delivery/offering/status and maps name, thumbnail, status, access but no legacy slug/slotName/lock reason (learn/courses/page.tsx:41-70,85-113)
- Fix: Provide complete course DTO crosswalk for lock status, elective slot, legacy slug and unavailable text

## G2-15-006-014  [P1] GAP  facet F04  effort M
- Legacy: Legacy course title fallback `Course name unavailable` yet still can open valid id (courseListingUtils.js:97-106; courseHref:7-15)
- vNext now: VNext fallback name sets `Course name unavailable`, but malformed name check disables (learn/courses/page.tsx:44-45,72-76)
- Fix: Preserve fallback-title but valid-ID navigability where authorized, mark corrupt record separately

## G2-15-006-030  [P1] GAP  facet F07  effort M
- Legacy: Legacy 403 => `You do not have permission to view these courses.`, general failure `Failed to load courses. Please try again.` (CoursesContent.jsx:156-175)
- vNext now: VNext route lacks error catch, per-course failures mapped unavailable card (learn/courses/page.tsx:77-118)
- Fix: Add directory recoverable 403/fetch ErrorState with Try again and keep per-course fallback

## G2-15-006-044  [P1] GAP  facet F12  effort M
- Legacy: Legacy off-current-semester records visible but NOT clickable, label `Not your current semester: shown for reference` (CoursesContent.jsx:240-246,554-560)
- vNext now: VNext Past semester cards still Link to workspace, StatusBadge Past semester (learner-course-list.tsx:377-390)
- Fix: Disable link for off-current term where old workspace forbade access, or prove vNext intentional read-only route and mark exception

## G2-15-006-045  [P1] GAP  facet F12  effort M
- Legacy: Legacy inactive/unpublished/locked cards use disabled div aria-disabled and reason (courseListingUtils.js:7-15; CoursesContent.jsx:549-560)
- vNext now: VNext only marks `row.unavailable` disabled; readOnly links still navigable (learner-course-list.tsx:361-390)
- Fix: Preserve distinct disabled locked/prerequisite reasons and explicit disabled card semantics

## G2-15-006-057  [P1] GAP  facet F17  effort M
- Legacy: Legacy locked course aria-disabled with readable tooltip reason (CoursesContent.jsx:549-560)
- vNext now: VNext readOnly navigable with Past semester badge; unavailable branch aria-disabled (learner-course-list.tsx:361-390)
- Fix: Make disabled reason announced, avoid focusable broken navigation

## G2-15-006-061  [P1] GAP  facet F19  effort L
- Legacy: Legacy course GET for one selected semester, 48 cards and client search (CoursesContent.jsx:117-126,283-288)
- vNext now: VNext fetches all historic deliveries and per-delivery workspace/instructor, concurrency4 (learn/courses/page.tsx:21-38,77-119)
- Fix: Bound listing DB calls to selected period/page; avoid O(all historic courses) expensive workspace expansion

## G2-15-006-071  [P1] GAP  facet F23  effort M
- Legacy: Legacy off-current and locked courses are visible but nonnavigable with exact reasons (CoursesContent.jsx:240-246,549-560)
- vNext now: VNext past semester links navigable and no legacy lock text (learner-course-list.tsx:377-390)
- Fix: Resolve policy conflict with owner; prevent broken/private lesson fetches from clickable cards

## G2-15-006-031  [P2] GAP  facet F07  effort M
- Legacy: Legacy semester get failures `Could not load semesters.` and retry (CoursesContent.jsx:197-207,411-416)
- vNext now: VNext listLearnerProgramSemesters server awaited, no retry in page (learn/courses/page.tsx:121-131)
- Fix: Add semester-source failure banner and Retry semesters

## G2-15-006-033  [P2] GAP  facet F08  effort S
- Legacy: Legacy fallback semester displays `The requested semester was unavailable; showing your current semester instead.` (CoursesContent.jsx:480-482)
- vNext now: VNext `resolveLearnerCoursePeriod` silently chooses fallback when invalid ID (learner-course-list.tsx:112-114)
- Fix: Announce fallback; keep exact copy if invalid saved selection

## G2-15-006-034  [P2] GAP  facet F08  effort S
- Legacy: Legacy invalid records alert `Some course records have incomplete or duplicate information. Unavailable cards cannot be opened. Please contact your administrator.` (CoursesContent.jsx:483-485)
- vNext now: VNext warning omits `Please contact your administrator.` and adds Retry (learner-course-list.tsx:335-339)
- Fix: Restore final exact sentence; retain Retry only if recovery may help
