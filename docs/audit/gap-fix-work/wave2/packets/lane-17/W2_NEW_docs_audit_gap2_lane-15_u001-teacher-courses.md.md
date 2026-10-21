# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-15/u001-teacher-courses.md

17 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-15/u001-teacher-courses.md

## G2-15-001-006  [P2] GAP  facet F03  effort M
- Legacy: Card's full-width course thumbnail is provided per course; image load failure falls back to course illustration (CoursesContent.jsx:22-33,513-517).
- vNext now: Fixed 48px `/assets/images/common/course.svg` icon for every course (faculty-course-list.tsx:139-143).
- Fix: Expose authorized stored course thumbnail URL and deterministic fallback, render legacy 400×140 cover area.

## G2-15-001-007  [P2] GAP  facet F03  effort S
- Legacy: Metrics include `N Teaching assignment(s)` and `N Section(s)` as coloured MetricPill controls (CoursesContent.jsx:389-397).
- vNext now: Disclosures use literal `N Teaching assignment(s)` and `N Section(s)` (faculty-course-list.tsx:67-82).
- Fix: Use singular/plural counts and legacy metric pill look/icons rather than slash-parentheses text.

## G2-15-001-009  [P2] GAP  facet F03  effort M
- Legacy: Course cards show academic semester and academic year badges separately (CoursesContent.jsx:538-542).
- vNext now: Badges are period name and period code, no explicit `Semester N` (faculty-course-list.tsx:168-179).
- Fix: Derive semester number/year from academic period and present legacy `Semester N` and year labels when applicable.

## G2-15-001-010  [P2] GAP  facet F03  effort S
- Legacy: Faculty secondary role tag uses orange `Your role: Co-teacher` or `TA` (CoursesContent.jsx:518-521).
- vNext now: Neutral badge with lowercased `co_teacher` transformed to `co teacher`, or `ta` (faculty-course-list.tsx:178-180).
- Fix: Map exact role display strings and orange tag tone.

## G2-15-001-012  [P2] GAP  facet F03  effort S
- Legacy: Section label is `sectionName (batchName)` (CoursesContent.jsx:523-525).
- vNext now: Section badge is `sectionName (cohortName)` (faculty-course-list.tsx:168-172).
- Fix: Map batch vs cohort labels explicitly and match old formatting when the concepts differ.

## G2-15-001-014  [P2] GAP  facet F04  effort M
- Legacy: Legacy faculty GET payload has `id`, course slug/name/image, class/batch, semester_number, academic_year, role, metadata_incomplete (FacultyTeachingAssignmentResponseDTO.java:8-27).
- vNext now: Uses course code/name/description, section/cohort, period name/code and role from Drizzle joins (faculty-course-service.ts:66-101).
- Fix: Define field mapping including missing academic_year, semester_number, course_image_url and corrupted metadata cases.

## G2-15-001-017  [P2] GAP  facet F05  effort S
- Legacy: Faculty selector appears only when more than one section; default `all` and option `All sections (valid assignment count)` (CoursesContent.jsx:63-67,318-324,399-402).
- vNext now: Section selector always appears when nonempty; default blank `All sections (number of sections)` (faculty-course-list.tsx:99-107).
- Fix: Hide for a single section; use assignment count in all-option, and retain legacy default.

## G2-15-001-019  [P2] GAP  facet F05  effort M
- Legacy: Search covers course name, faculty, section, batch, code, academic year, instructor names (courseListingUtils.js:38-45).
- vNext now: Search covers name, code, section name/code, academic period name only (faculty-course-list-model.ts:25-31).
- Fix: Add equivalent faculty/batch/instructor/year search fields while preserving tenant scope.

## G2-15-001-022  [P2] GAP  facet F05  effort S
- Legacy: Default order by `courseId ASC, classId ASC, id ASC` (FacultyTeachingAssignmentRepository.java:41-47); client preserves list order (CoursesContent.jsx:267-288).
- vNext now: Sorted periodStartDate DESC, course name ASC, section name ASC (faculty-course-service.ts:197-201).
- Fix: Restore source ordering for faculty list or explicitly specify intended new sort.

## G2-15-001-036  [P2] GAP  facet F09  effort M
- Legacy: Assignment and Section metrics have popovers with links, counts, max first 100 entries (CoursesContent.jsx:346-360,373-379,386-397).
- vNext now: Disclosure panels show assignment links and section list, no first-100 cap (faculty-course-list.tsx:67-82).
- Fix: Clone popover trigger/title/content, cap and overflow copy; retain scoped links.

## G2-15-001-040  [P2] GAP  facet F10  effort M
- Legacy: Course click writes selected ID/class to Redux `handleUserData` (CoursesContent.jsx:73-81,551-553).
- vNext now: Navigation is read-only href, no assignment/course state writes (faculty-course-list.tsx:131-136).
- Fix: Validate compatibility routes and stop reliance on stale cross-course state.

## G2-15-001-050  [P2] GAP  facet F13  effort M
- Legacy: Course image fallback on broken/missing URL (CoursesContent.jsx:22-33).
- vNext now: Static icon never requests tenant thumbnail (faculty-course-list.tsx:139-143).
- Fix: Add dynamic thumbnail, on-error fallback, layout stability.

## G2-15-001-055  [P2] GAP  facet F17  effort M
- Legacy: Loading region `aria-busy`, status with polite live loading, search results aria-live, disabled cards title and aria-disabled (CoursesContent.jsx:425-428,467-490,555-560).
- vNext now: Disclosures role=status and result aria-live; card links have focus outline; no disabled orphan card (faculty-course-list.tsx:67-82,119-120,131-137).
- Fix: Add loading live region/disabled-card semantics, preserve focus and status announcements.

## G2-15-001-057  [P2] GAP  facet F18  effort S
- Legacy: `Search courses…` input placeholder (CoursesContent.jsx:417-420).
- vNext now: `Course, code, Section or academic period` (faculty-course-list.tsx:87-90).
- Fix: Replace exact placeholder; search domain may remain broader if approved.

## G2-15-001-058  [P2] GAP  facet F18  effort S
- Legacy: Role names `Co-teacher` / `TA`, counts with `Teaching assignment` / `Sections` grammar (CoursesContent.jsx:389-397,518-521).
- vNext now: Role lowercased raw enum and parenthesis counts (faculty-course-list.tsx:68-80,178-180).
- Fix: Use exact case, hyphen and pluralization.

## G2-15-001-008  [P3] GAP  facet F03  effort S
- Legacy: Metric pills show BookOutlined and TeamOutlined icons, indigo/violet variants (CoursesContent.jsx:389-397).
- vNext now: No icons or indigo/violet differentiation on Disclosure triggers (faculty-course-list.tsx:67-81).
- Fix: Clone legacy icons, pill colours, states and hit areas.

## G2-15-001-056  [P3] GAP  facet F17  effort S
- Legacy: Search is named `Search courses`, selector `Filter by section` (CoursesContent.jsx:399-402,417-420).
- vNext now: Form label `Search courses`, selector label `Section` (faculty-course-list.tsx:87-105).
- Fix: Keep legacy accessible selector name `Filter by section` while retaining visible caption.
