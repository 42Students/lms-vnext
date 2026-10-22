# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-12-002-050 [P1] GAP facet F12
- Files: src/components/academics/college-term-mapping-manager.tsx
- Legacy: Can select historical semesters by program (not active-only) `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:83-97,355-361`
- Expected fix: Allow browsing archived terms read-only

## G2-12-002-054 [P1] GAP facet F13
- Files: src/components/academics/college-term-mapping-manager.tsx
- Legacy: Same-term refresh preserves stale rows with warning/retry `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:99-138,385-390`
- Expected fix: Preserve last successful data on refresh error

## G2-12-002-079 [P1] GAP facet F23
- Files: src/components/academics/college-term-mapping-manager.tsx
- Legacy: Legacy hidden Boolean mandatory field `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:421-423`
- Expected fix: Do not silently lose elective designation

## G2-17-23-052 [P1] GAP facet F10 Audit trail
- Files: (none, new feature)
- Legacy: TS:188–195 audit.bell OFFER_ACCEPTED/DECLINED and audit.log actor STUDENT/learnerId + offerId
- Expected fix: Crosswalk old TPO bell/audit activity to vNext TPO inbox and learner activity, preserving college/actor/job/application/offer IDs

## G2-17-028-029 [P1] GAP facet F12 Readiness predicate
- Files: (none, new feature)
- Legacy: LO:28 displays readyForSubmission calculated by backend (LD:7-9); release count comment LD:14-17 says informational only
- Expected fix: Align readiness gate formula with legacy: verify task/sprint completion and submission conditions, make release policy decision before parity sign-off

## G2-18-019-047 [P1] GAP facet F22 OTP columns
- Files: (none, new feature)
- Legacy: LV:17-32 phone_number, otp, incorrect_attempts, blocked_till_ts, verify_status, is_expired, max_resend_attempts
- Expected fix: Maintain field-by-field disposition in schema ledger, protect raw OTP and phone, never expose hashed MAC via API

## G2-18-030-059 [P1] GAP facet F22 Archive/storage
- Files: (none, new feature)
- Legacy: L:167-176 calls deleteDepartment, whereas M:140-143 sets archivedAt
- Expected fix: Confirm archived data retention and dependency uniqueness; old reports must not assume deleted rows disappear physically

## G2-13-006-031 [P1] GAP facet F08
- Files: src/app/(authenticated)/learn/my-placements/announcements/page.tsx
- Legacy: Opening announcements dispatches placement-announcements-read event (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:31-36`)
- Expected fix: Trigger authorized per-notice read acknowledgment on view and keep unread badge count in sync.

## G2-13-001-021 [P1] GAP facet F05
- Files: src/components/hr/hr-company-reports-grid.tsx
- Legacy: Reports table column order: Drive, Applied, Offered, Accepted, Declined, Joined (`docs/legacy-source/frontend/src/pages/recruiter/company.js:122-132`)
- Expected fix: Default column set/order to six legacy columns; place additional metrics behind Columns preference if retained.

## G2-13-004-061 [P1] GAP facet F19
- Files: src/components/hr/recruiter-conversation-live-refresh.tsx
- Legacy: Old polling hits lightweight version pulse every 4s only on changes reload (`docs/legacy-source/frontend/src/components/tpo/ui/useLivePulse.js:11-43`)
- Expected fix: Use lightweight version endpoint before full RSC refresh to reduce DB/network and stale revalidation.

## G2-14-003-021 [P1] GAP facet F05
- Files: src/app/(authenticated)/admin/course-progress/page.tsx, src/app/(authenticated)/admin/course-progress/students/page.tsx
- Legacy: Legacy class picker first then course restricted to selected class teaching assignments; vNext listing uses cohort/offering selectors and status, no mandatory class — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:97-134,247-282`
- Expected fix: Add required Class and derived taught Course controls on current screen

## G2-18-029-016 [P1] GAP facet F16
- Files: (none, new feature)
- Legacy: XS full cards, LG 10/14, form Number half-width at sm, table max-content scroll (legacy:408-439,538)
- Expected fix: Apply old breakpoints and mobile horizontal table overflow

## G2-14-013-004 [P1] GAP facet F01
- Files: src/app/(authenticated)/admin/lecture-halls/page.tsx, src/modules/academics/lecture-hall-service.ts
- Legacy: Legacy global super-admin may search all colleges without scope `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:41-46` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:54-68`
- Expected fix: Provide safe explicitly authorized global search or document removed capability

## G2-14-013-014 [P1] GAP facet F05
- Files: src/modules/academics/lecture-hall-service.ts
- Legacy: Legacy exact/prefix/score/fuzzy search with typo distance 2 `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:118-188`
- Expected fix: Build scoped fuzzy/name+description search or document deliberate simplification

## G2-14-013-021 [P1] GAP facet F06
- Files: src/modules/academics/lecture-hall-service.ts
- Legacy: Legacy deptId filter overrides collegeId filter when both supplied `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:76-88`
- Expected fix: Document corrected scope precedence and test cross-college dept ID

## G2-14-013-036 [P1] GAP facet F11
- Files: src/app/(authenticated)/admin/lecture-halls/page.tsx, src/modules/academics/lecture-hall-service.ts
- Legacy: Legacy allows global SA unrestricted college search `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:41-46` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:54-68`
- Expected fix: Define explicit global SA search scope with role check or document removal

## G2-14-017-066 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: New hard delete planned sprint with task unlink `src/modules/projects/mentor-sprint-delete-service.ts:42-58`
- Expected fix: Preserve old intentional deletion semantics

## G2-19-025-002 [P1] GAP facet F01
- Files: src/app/page.tsx, src/modules/auth/request-tenant.ts
- Legacy: Legacy _app bootstraps once on page mount and redirects non-canonical alias; frontend/pages/_app.js:121-159
- Expected fix: Restore safe primary-verified canonical host redirect preserving path/search/hash

## G2-19-025-024 [P1] GAP facet F10
- Files: src/app/page.tsx
- Legacy: Legacy GET reads AppSettings/global host then tenant domain, college, canonical candidates, branding; PublicTenantController.java:43-173
- Expected fix: Document split calls and exact response fallback semantics for old clients

## G2-20-031-004 [P1] GAP facet F01
- Files: src/app/privacy-policy/page.tsx
- Legacy: Legacy privacy served in place at `/privacy-policy` `privacy-policy.js:26-49`.
- Expected fix: Serve styled semantic policy at stable public URL without visible URL change; preserve canonical and link hashes.

## G2-15-004-032 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: GET failure shows `Projects could not be loaded`, explanation and Retry (ProjectsContent.jsx:218-255)
- Expected fix: Add matching recoverable route boundary and Retry with scoped URL

## G2-15-006-030 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: Legacy 403 => `You do not have permission to view these courses.`, general failure `Failed to load courses. Please try again.` (CoursesContent.jsx:156-175)
- Expected fix: Add directory recoverable 403/fetch ErrorState with Try again and keep per-course fallback

## G2-15-008-041 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: Legacy completion counts each visible item, isLearnerContentComplete aggregates resource/video/submission state (syllabusDetail.js:182-201)
- Expected fix: Compute per-lesson denominator including quiz attempts and assignments exactly

## G2-16-004-079 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: `BugReportRepository.java:18-32`: case-insensitive exact reporter and search through page/screen/section.
- Expected fix: Update query predicates; add indexes if scale requires for case-folded text.

## G2-16-007-018 [P1] GAP facet F05
- Files: src/components/academics/college-term-mapping-manager.tsx
- Legacy: `SemesterCourseMapping.js:283-285`: available courses all college courses excluding mapped IDs.
- Expected fix: Validate legacy cross-department mapping policy and permit valid college-wide courses where allowed.
