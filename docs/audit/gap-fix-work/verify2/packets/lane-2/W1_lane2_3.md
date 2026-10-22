# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-12-020-048 [P1] GAP facet F20
- Files: src/modules/placements/company-curation-domain-model.ts
- Legacy: Old raw domain input uses PSL registrable (mail.company.co.in→company.co.in) `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:128-138`
- Expected fix: Canonicalize PSL-aware domain before uniqueness/ownership transaction.

## G2-12-019-006 [P1] GAP facet F03
- Files: src/modules/placements/learner-application-detail-service.ts
- Legacy: Old company/publicRef as stable applicant identifier `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:143-149,177-188`
- Expected fix: Provide stable nonsequential company-facing ID, preserve legacy public refs.

## G2-12-019-039 [P1] GAP facet F11
- Files: src/modules/placements/learner-application-detail-service.ts
- Legacy: Legacy external/public identifiers stable without exposing int id `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:143-149,177-188`
- Expected fix: Use publicRef to avoid disclosing internal key as candidate ID.

## G2-12-004-030 [P1] GAP facet F23
- Files: src/app/(authenticated)/mentor/courses/page.tsx
- Legacy: Legacy redirects from a defunct mentor Courses area to Projects `docs/legacy-source/frontend/src/pages/mentor/courses/[courseId]/index.js:1-7`
- Expected fix: Retain both index and dynamic bookmark aliases

## G2-12-005-032 [P1] GAP facet F07
- Files: src/modules/placements/tpo-general-request-model.ts
- Legacy: Optional zero CTC min0 accepted in UI `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:256-257`
- Expected fix: Align CTC optionality/range with TPO verification rules

## G2-17-23-037 [P1] GAP facet F07 Already HIRED
- Files: (none, new feature)
- Legacy: JS:1210–1218 returns explicit "You already have an accepted offer (HIRED)..." conflict as IllegalArgumentException, LC:49–51 maps to 404
- Expected fix: Use 409 business conflict (not legacy erroneous 404) and display appropriate "already accepted another offer" remediation

## G2-17-028-011 [P1] GAP facet F04 Releases
- Files: (none, new feature)
- Legacy: LD:14-19 counts shipped/total informational only in legacy DTO
- Expected fix: Product decision: keep legacy readiness independent of release shipping or explicitly document change and update visible rule/warning; don't silently reinterpret gate

## G2-18-019-017 [P1] GAP facet F06 Verify input
- Files: (none, new feature)
- Legacy: LC:449-476 phoneNumber and otp query arguments, trims both
- Expected fix: Keep POST body and attemptId contract; don't add insecure GET verification endpoint

## G2-18-030-036 [P1] GAP facet F10 List API
- Files: (none, new feature)
- Legacy: L:60-80 getDepartmentsByCollege(collegeId) OR getDepartments() if unscoped
- Expected fix: Document intentionally removed unscoped listing; if global directory required, add new server-authorized paged cross-college view

## G2-19-029-044 [P1] GAP facet F12 Unknown vs warning
- Files: (none, new feature)
- Legacy: LG:158-165 warnings permit readiness if domain login true
- Expected fix: Keep legitimate advisory warnings separate from unknown required evidence, while ensuring unknown NEVER produces a ready verdict

## G2-13-005-070 [P1] GAP facet F20
- Files: src/components/placements/learner-placement-offers.tsx
- Legacy: Old accepts status RELEASED, vNext ISSUED and tracks expired date (`docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:27-30`)
- Expected fix: Document RELEASED→ISSUED mapping and exact expired/withdrawn transitions.

## G2-13-005-074 [P1] GAP facet F22
- Files: src/components/placements/learner-placement-offers.tsx
- Legacy: Old offer API fields ctcLpa, respondBy, respondedAt, logo, roleOption, RELEASED (`docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:10-29`)
- Expected fix: Create field/status migration crosswalk; ensure historical responses, logo and timestamps not lost.

## G2-13-002-020 [P1] GAP facet F04
- Files: src/modules/placements/recruiter-portfolio-counts-service.ts
- Legacy: Old live count includes all non-withdrawn applications (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:195-209`)
- Expected fix: Label changed metric as shared applicant count; decide approved privacy divergence.

## G2-13-002-075 [P1] GAP facet F21
- Files: src/app/(authenticated)/hr/home/page.tsx
- Legacy: Legacy Depends on TpoMessagesService and optional TpoSettingsHub direct visibility (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:29-34`)
- Expected fix: Map direct-applicant setting to grant/shortlist policy; document deliberate removal.

## G2-13-002-079 [P1] GAP facet F22
- Files: src/modules/placements/recruiter-portfolio-counts-service.ts
- Legacy: Old live job count on job_application excludes WITHDRAWN (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:194-209`)
- Expected fix: Document changed cohort and reconcile migrations/tests.

## G2-18-021-044 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: Old `Job.importantDates` JSON list containing `{label,date,type/dateType}` (Job.java:92-100; JobServiceImpl:1548-1567)
- Expected fix: Schema add optional `type`, `dateType` and preserve during write and read; include existing legacy payloads

## G2-14-005-015 [P1] GAP facet F04
- Files: src/app/(authenticated)/learn/my-placements/jobs/page.tsx, src/components/placements/learner-placement-jobs.tsx
- Legacy: Legacy card title job.jobTitle, companyName, raw jobType chip; vNext job+role option may produce multiple role cards per drive — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:165-193`
- Expected fix: Retain role-option data but present legacy job-level grouping with role subchoices

## G2-14-005-026 [P1] GAP facet F05
- Files: src/modules/placements/learner-jobs-browse-model.ts, src/components/placements/learner-jobs-browse.tsx
- Legacy: Legacy Eligible only based on visibleFlag; vNext canApply and deadline checks also used, changing matching population — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:584-592,615-629`
- Expected fix: Define equivalent eligibility filter with visibility plus college policy and closure

## G2-14-005-034 [P1] GAP facet F05
- Files: src/modules/placements/saved-job-service.ts
- Legacy: Legacy expired saved lists all closed previously saved jobs, vNext bookmarks only if published and still in authorized job feed — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:519-539,658-678`
- Expected fix: Preserve previously saved expired jobs with privacy-safe historical read permission

## G2-14-005-039 [P1] GAP facet F06
- Files: src/components/placements/learner-save-drive-button.tsx, src/app/(authenticated)/learn/my-placements/jobs/page.tsx
- Legacy: Legacy save button disabled if saved-ID fetch unavailable or already in-flight; vNext own button enabled on initial source failure because savedIds prop empty — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:249-259,485-486`
- Expected fix: Propagate bookmark loading-error status and disable action until state known

## G2-14-005-059 [P1] GAP facet F12
- Files: src/components/placements/learner-placement-jobs.tsx
- Legacy: Legacy application badges use applicationStatus and map statuses; vNext typed channel/status, but display Applied · channel instead of stage — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:425-430,165-173`
- Expected fix: Display actual screening/interview/offer status chip where available

## G2-14-005-080 [P1] GAP facet F19
- Files: src/modules/placements/saved-job-service.ts
- Legacy: Legacy separate saved jobs endpoint preserves expired saves outside active job list; vNext saved service filters to current visible feed, drops archived — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:519-539`
- Expected fix: Persist and display permitted historic saves even if closed after bookmarking

## G2-14-002-049 [P1] MISSING facet F09
- Files: src/app/(authenticated)/admin/students/page.tsx
- Legacy: Legacy Audit trail — Name width800 and fixed college entity filter; vNext no row audit popup — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1719-1729`
- Expected fix: Add source-scoped 800px audit viewer modal

## G2-14-015-020 [P1] GAP facet F10
- Files: src/modules/placements/tpo-drive-lifecycle-service.ts
- Legacy: Legacy transition updates lifecycleStatus plus isDraft/isActive synchronously `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:38-55`
- Expected fix: Define compatibility flags and preserve timestamp meaning

## G2-14-016-002 [P1] GAP facet F01
- Files: src/modules/placements/recruiter-grant-expiry-policy.ts
- Legacy: Legacy recruiter enters college only with current grant capability `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAccessService.java:66-90`
- Expected fix: Document and migrate verification/expiry fields before enabling access
