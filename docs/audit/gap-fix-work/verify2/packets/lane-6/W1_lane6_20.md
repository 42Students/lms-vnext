# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-9-010-049 [P1] GAP facet F10
- Files: src/modules/placements/college-application-stage-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:637-705` — PUT application status transitions, updates status-history and messages
- Expected fix: Maintain legacy status/history and notify semantics with documented separate stage model

## G2-9-010-068 [P1] GAP facet F15
- Files: src/modules/placements/college-application-stage-service.ts
- Legacy: `docs/legacy-source/frontend/src/utils/placementApplicationTransitions.js:73-83` — Bulk transitions explicitly promise students told; Hired withdraws other applications and cancels interviews
- Expected fix: Match downstream student notifications and cascade on confirmed hiring via real offer flow

## G2-9-012-006 [P1] GAP facet F02
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:779-815` — Error/loading/empty is followed by toolbar and desktop/mobile interview list
- Expected fix: Place candidate interviews first in same legacy toolbar/table hierarchy; keep round registry as secondary extra

## G2-9-013-017 [P1] GAP facet F04
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:236-258` — Prefills jobTitle, companyName, jobDescription, responsibilities, type, location, ctcRange, visibility and assessment fields.
- Expected fix: Map all legacy drive metadata to editing UI or explicitly mark migrated fields read-only.

## G2-9-014-042 [P1] MISSING facet F08
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1100-1124` — Assessment bulk success n application(s) moved to Assessment; failure Failed to move to Assessment.
- Expected fix: Restore stage-specific success/failure notices.

## G2-9-014-061 [P1] GAP facet F12
- Files: src/modules/placements/college-application-stage-service.ts
- Legacy: `docs/legacy-source/frontend/src/utils/placementApplicationTransitions.js:4-13` — Legacy status transition map includes Assessment->Interview, Interview->Offered, Offered->Hired and Reject.
- Expected fix: Review transition matrix row-by-row; explain intended changed safeguards.

## G2-9-014-071 [P1] GAP facet F15
- Files: src/modules/placements/college-application-stage-service.ts
- Legacy: `docs/legacy-source/frontend/src/utils/placementApplicationTransitions.js:77-91` — Bulk preview says each student is told on shortlist/interview/waitlist/offer/hire; hire cancels other applications/interviews.
- Expected fix: Document exact recipient and notification type for each transition.

## G2-9-036-010 [P1] GAP facet F03
- Files: src/app/(authenticated)/admin/features/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:309-313` three scope-wide metric numbers
- Expected fix: Compute scoped total metrics or label denominator precisely

## G2-17-023-030 [P1] GAP facet F10
- Files: src/modules/placements/offer-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:172-193 JobServiceImpl.respondToOffer then offer ACCEPTED/DECLINED and bell/audit
- Expected fix: Verify cascade/app status mapping and preserve learner/company/TPO notification semantics.

## G2-17-023-046 [P1] GAP facet F15
- Files: src/modules/placements/offer-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:190-193 bell to TPO on accept/decline
- Expected fix: Check TPO + company notification recipients/content on real acceptance and decline.

## G2-18-023-061 [P1] GAP facet F19
- Files: src/modules/placements/learner-job-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:112-164 bulk evaluateAll one marks/batch read, no per-student N+1
- Expected fix: Implement batched eligibility SQL across all displayed jobs and one candidate read.

## G2-18-023-066 [P1] GAP facet F21
- Files: src/modules/placements/learner-job-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerEligibilityController.java:38-39,69-77 Spring ApplyGate reused for list and apply
- Expected fix: Synchronize write-path checks with read model and revalidate under locks.

## G2-9-022-028 [P1] GAP facet F07
- Files: src/app/(authenticated)/admin/batch-promotion/page.tsx
- Legacy: Preview fetch failure explains couldn't verify; disables promotion `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:191-205,527-548`
- Expected fix: Catch unexpected preview errors with fail-closed local Retry

## G2-9-033-047 [P1] GAP facet F19
- Files: src/modules/placements/admin-company-directory-service.ts
- Legacy: Legacy global query page 50 distinct companies and college query page 10 from full client list `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:34-41` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:55-56`
- Expected fix: Decouple pagination units by tab: company vs relationship; restore 10 college page size

## G2-9-033-061 [P1] MISSING facet F04
- Files: src/modules/placements/admin-company-directory-service.ts
- Legacy: Company contact person name shown on first line `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:263-269`
- Expected fix: Expose scoped contact person in college-only list query and column.

## G2-9-033-062 [P1] MISSING facet F04
- Files: src/modules/placements/admin-company-directory-service.ts
- Legacy: Company contact email muted on second line `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:263-269`
- Expected fix: Expose and mask email only in authorized college CRM.

## G2-9-033-077 [P1] GAP facet F07
- Files: src/modules/placements/validation.ts
- Legacy: Missing website/email identity error 'Add the company’s website or a company email...' `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:138-147`
- Expected fix: Validate that a canonical domain or company email identifies every company.

## G2-9-033-079 [P1] GAP facet F07
- Files: src/modules/placements/validation.ts
- Legacy: Website/logo must be https with URL error labels `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:484-489`
- Expected fix: Reject HTTP for company public website/logo fields and preserve wording.

## G2-9-034-010 [P1] GAP facet F04
- Files: src/modules/placements/admin-company-directory-service.ts, src/app/(authenticated)/admin/companies/page.tsx
- Legacy: Old global item summarizes number of colleges and drives across platform `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:66-70` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:44-50`
- Expected fix: Build distinct global company view with global counts for unscoped admin and scoped counts when restricted

## G2-9-034-015 [P1] GAP facet F05
- Files: src/modules/placements/admin-company-directory-service.ts
- Legacy: Old global page 50 and fixed no size chooser `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:34-41` `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:93-95`
- Expected fix: Page distinct global companies before joining college relationships to match 50 unique employers

## G2-9-034-026 [P1] GAP facet F10
- Files: src/modules/placements/admin-company-directory-service.ts
- Legacy: Legacy global GET returns distinct companies with domains aliases colleges drives `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminCompanyController.java:45-51` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:35-65`
- Expected fix: Add distinct global-company list endpoint/service projection before relationship joins

## G2-9-034-030 [P1] GAP facet F11
- Files: src/app/(authenticated)/admin/companies/page.tsx, src/modules/placements/admin-company-directory-service.ts
- Legacy: Legacy curator sees global master regardless selected college, while college tab restricted `docs/legacy-source/frontend/src/pages/superadmin/companies/index.js:8-21` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:35-65`
- Expected fix: Restore genuine global curated list independent of selected college, or clearly require clearing scope before selecting global tab

## G2-9-034-046 [P1] GAP facet F19
- Files: src/modules/placements/admin-company-directory-service.ts
- Legacy: Legacy global query page 50 distinct companies and college query page 10 from full client list `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:34-41` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:55-56`
- Expected fix: Decouple pagination units by tab: company vs relationship; restore 10 college page size

## G2-9-034-047 [P1] GAP facet F19
- Files: src/modules/placements/admin-company-directory-service.ts, src/db/schema/placements.ts
- Legacy: Old global companies with same name but different domain both listed distinct IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:35-65` `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:14-15`
- Expected fix: Redesign distinct identity listing independent of relationship rows

## G2-9-034-068 [P1] GAP facet F05
- Files: src/modules/placements/admin-company-directory-service.ts
- Legacy: Default list is 50 distinct company IDs with page0 and 50 rows fixed `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:34-43,94-95`
- Expected fix: Page companies before relationship enrichment; never count multiple colleges as rows.

## Results
- FIXED G2-9-033-077 — `src/modules/placements/validation.ts:69-78`; commit `3e9a14bd69580d46fefbacdc7a65676ab04dd074`; legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:138-147`.
- OK G2-9-033-079 — `src/modules/placements/validation.ts:40-59` enforces HTTPS website and logo; legacy `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:484-489`.
- OK G2-9-034-015 — `src/modules/placements/admin-company-directory-service.ts:151-266` pages canonical company IDs at 50 rows, independently of college relationships; `src/modules/placements/admin-company-directory-model.ts:3-5`; legacy `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:34-41,93-95`.
- OK G2-9-034-068 — `src/modules/placements/admin-company-directory-service.ts:198-266` counts and pages distinct `placementCompanies` rows; `src/modules/placements/admin-company-directory-model.ts:4`; legacy `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:34-43,94-95`.
- OK G2-9-033-047 — `src/modules/placements/admin-company-directory-model.ts:4-5` defines separate 50-global/10-college pagination; `src/modules/placements/admin-company-directory-service.ts:116-122,255-266` applies the 10-relationship and 50-company units; legacy `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:34-41` and `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:55-56`.
- OK G2-9-034-046 — `src/modules/placements/admin-company-directory-service.ts:116-122,255-266` pages college relationships separately from distinct platform company rows; legacy `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:34-41` and `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:55-56`.
- OK G2-9-034-026 — `src/modules/placements/admin-company-directory-service.ts:151-266` queries canonical company identities directly and projects domains, aliases, distinct college and drive counts; legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminCompanyController.java:45-51` and `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:35-65`.
- OK G2-9-034-010 — `src/modules/placements/admin-company-directory-service.ts:198-249` computes distinct active linked-college and drive counts per canonical company; `src/app/(authenticated)/admin/companies/page.tsx:49-65` selects the global catalogue or explicitly scoped college presentation; legacy `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:66-70` and `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:44-50`.
- OK G2-9-034-030 — `src/app/(authenticated)/admin/companies/page.tsx:49-65` requires explicit clearing of selected scope before displaying the global catalogue, with an alert and college fallback; `src/modules/placements/admin-company-directory-service.ts:151-165` rejects scoped global reads; legacy `docs/legacy-source/frontend/src/pages/superadmin/companies/index.js:8-21`.
- OK G2-9-034-047 — `src/modules/placements/admin-company-directory-service.ts:198-266` selects, counts and pages `placementCompanies.id` directly, retaining separate same-name identities rather than collapsing by name or multiplying relationship rows; legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:35-65` and `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:14-15`.
