# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-19-029-062 [P1] GAP facet F22 DTO shape
- Files: (none, new feature)
- Legacy: LB:249-265 returns readyForDomainLogin, blockers[], warnings[], recommendedActions[], meta domain stats/flag
- Expected fix: Publish explicit legacy→vNext domain DTO crosswalk, including requirement policy and coded warnings; keep both views separately typed

## G2-13-004-005 [P1] GAP facet F02
- Files: src/app/(authenticated)/hr/conversations/page.tsx
- Legacy: Header subtitle displays all unread across all threads (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:162-165`)
- Expected fix: Compute header summary from all authorized threads; label current-page figures separately.

## G2-18-029-002 [P1] GAP facet F02
- Files: (none, new feature)
- Legacy: Row gutter24: Create Card lg10, Semesters Card lg14 (legacy:408-465)
- Expected fix: Restore 10/14 side-by-side card layout at lg, stack below breakpoint

## G2-14-005-032 [P1] GAP facet F05
- Files: src/components/placements/learner-jobs-browse.tsx
- Legacy: Legacy filtered Reset clears q,type,loc,eligible,soon but retains tab/sort; vNext Clear filters navigates pathname and loses saved tab and sort — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:707-716`
- Expected fix: Keep current tab+sort when clearing filter facets

## G2-14-005-040 [P1] GAP facet F07
- Files: src/components/placements/learner-jobs-browse.tsx, src/app/(authenticated)/learn/my-placements/jobs/page.tsx
- Legacy: Legacy saved support failure explicit Your saved jobs could not be fully loaded ... Retry saved jobs; vNext treats no saved as empty — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:934-940`
- Expected fix: Distinguish bookmark API failure from zero saved records with Retry

## G2-14-005-078 [P1] GAP facet F19
- Files: src/components/placements/learner-jobs-browse.tsx
- Legacy: Legacy pageSize20 open jobs only, nonopen and expired outside paging; vNext pageSize20 includes all matches before splitting into sections — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:684-690,824-905`
- Expected fix: Paginate each top-level partition consistently with legacy

## G2-14-002-056 [P1] MISSING facet F10
- Files: src/app/(authenticated)/admin/students/page.tsx
- Legacy: Legacy OTP reset /api/v1/users/admin/clear-otp-lockout clears rate keys; vNext no equivalent row — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:173-200`
- Expected fix: Add privileged audited OTP reset API and button

## G2-14-011-014 [P1] GAP facet F05
- Files: src/modules/placements/college-drive-applications-service.ts, src/modules/placements/tpo-applicant-pipeline-service.ts
- Legacy: Default ordering score DESC appliedAt DESC `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:709-739` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:839-889`
- Expected fix: Add score sort with stable date tie break

## G2-14-011-047 [P1] GAP facet F11
- Files: src/modules/placements/tpo-applicant-pipeline-service.ts
- Legacy: Legacy deleted job still permits application reads through includeDeleted `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:225-231` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:762-789`
- Expected fix: Permit authorized historical archive report reads

## G2-14-011-058 [P1] GAP facet F14
- Files: src/modules/placements/college-drive-applications-service.ts
- Legacy: Legacy CSV columns include applicationId jobId jobTitle companyName learnerId names email status screening score partialScore appliedAt source notes reason `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:1484-1508`
- Expected fix: Offer backward compatible CSV template with all legacy columns

## G2-15-015-021 [P1] GAP facet F06
- Files: src/modules/placements/eligibility-service.ts
- Legacy: Any override supersedes ordinary scoring rules. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:100-108`)
- Expected fix: Document non-overridable cohort/verified-evidence restrictions to TPO before include.

## G2-15-015-039 [P1] GAP facet F12
- Files: src/modules/placements/eligibility-service.ts
- Legacy: Old INCLUDE may override all eligibility rules. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:100-108`)
- Expected fix: Display explicit nonoverrideable gates and prevent TPO confusion.

## G2-15-015-054 [P1] GAP facet F19
- Files: src/modules/placements/eligibility-service.ts
- Legacy: Bulk job override read in one query to prevent N+1. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:111-129`)
- Expected fix: Batch preload for Drive preview at college scale.

## G2-15-015-059 [P1] GAP facet F20
- Files: src/modules/placements/eligibility-service.ts
- Legacy: Per-student INCLUDE/EXCLUDE enforced before default rules. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:100-108`)
- Expected fix: State precedence clearly in UI; record as intentional safety policy.

## G2-15-015-065 [P1] GAP facet F23
- Files: src/modules/placements/eligibility-service.ts
- Legacy: Old all-criteria overrides always win. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:100-108`)
- Expected fix: Document intentional stricter policy in owner-decision matrix.

## G2-15-004-014 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: Legacy normalizer supplies course, mentor, phase, nextDue, progress and status variants (projectService.js:578-627; ProjectsContent.jsx:205-214)
- Expected fix: Document DTO-to-schema mapping for all fields and missing values

## G2-15-005-076 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: Legacy `APPLIED` can withdraw directly and maybe reapply; stage based on old job application state (JobDetailContent.jsx:1000-1010,1060-1063)
- Expected fix: Define old↔new status machine and reapply policy per stage with concrete owner decision

## G2-15-008-026 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: Legacy incomplete completion state `Lesson completion state could not be fully verified` with Retry state (syllabusDetail.js:338-347)
- Expected fix: Fail closed on unread progress/submissions and show explicit retry state before completion-dependent actions

## G2-16-004-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/tracker/issues/page.tsx
- Legacy: `issues/index.js:225-236`: public `/tracker/issues`, TrackerShell active Issues, Report issue primary link.
- Expected fix: Restore safe public issue discovery with privacy policy and Report issue link or get explicit authenticated-only sign-off.

## G2-16-013-004 [P1] GAP facet F02
- Files: src/components/placements/learner-jobs-browse.tsx
- Legacy: JobSearchDTO.java:54-65 concatenates searchable text from eight fields.
- Expected fix: Restore multi-field full-text search covering responsibilities, dept/program and type.

## G2-16-013-010 [P1] GAP facet F05
- Files: src/components/placements/learner-jobs-browse.tsx
- Legacy: JobSearchDTO.java:54-65 search title, company, desc, responsibilities, type, location, department, program.
- Expected fix: Test all eight search fields, especially targetDepartmentName and targetProgramName.

## G2-16-013-011 [P1] GAP facet F05
- Files: src/components/placements/learner-jobs-browse.tsx
- Legacy: JobSearchCache.java:79-107 synonym expansion configured for SDE, WFH, hybrid, etc.
- Expected fix: Restore job synonym matching if owner requires search v2 parity.

## G2-16-013-021 [P1] GAP facet F10
- Files: src/components/placements/learner-jobs-browse.tsx
- Legacy: JobSearchController.java:121-213 search returns Response<List<JobSearchDTO>>.
- Expected fix: Implement server-side scoped search for large data and legacy response compatibility.

## G2-16-013-029 [P1] GAP facet F13
- Files: src/components/placements/learner-jobs-browse.tsx
- Legacy: JobSearchCache.java:140-142 load failure logs error, cache may remain empty.
- Expected fix: Differentiate service load outage from genuinely zero open jobs.

## G2-16-015-002 [P1] GAP facet F01
- Files: src/modules/placements/eligibility-service.ts
- Legacy: JobEligibility.java:10-12 targeting columns act as visibility gate separately from eligibility.
- Expected fix: Preserve strict visibility vs application eligibility distinction and verify all four original target levels.
