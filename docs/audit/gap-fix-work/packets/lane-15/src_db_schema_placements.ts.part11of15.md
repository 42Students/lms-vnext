# Work packet: edit src/db/schema/placements.ts (part 11 of 15)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/l12-u015-job-role-option.md, docs/audit/gap2/lane-4/l13-u020-company-model.md, docs/audit/gap2/lane-4/l13-u030-interview-feedback-form.md, docs/audit/gap2/lane-4/tpo-company-controller.md, docs/audit/gap2/lane-5/l13-u021-application-screening-entity.md

## G2-12-015-039  [P1] GAP  facet F22  effort M
- Legacy: job.role_options_json array, no individual FK `docs/legacy-source/backend/src/main/resources/db/migration/V161__tpo_v1_drives.sql:59-60`
- vNext now: Role rows have job FK, UUID ID, active statuses, primary and unique constraints `src/db/schema/placements.ts:625-735`
- Fix: Write typed 1-to-N historical data migration with deterministic IDs and order.

## G2-12-015-040  [P1] MISSING  facet F22  effort M
- Legacy: Legacy stipend and months both pay properties `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobRoleOption.java:21-23`
- vNext now: Role table lacks both properties `src/db/schema/placements.ts:643-665`
- Fix: Add stipend and duration columns plus constraints.

## G2-13-020-007  [P1] GAP  facet F04  effort M
- Legacy: Legacy logoUrl max500 HTTPS `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Company.java:38-40`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:480-490`
- vNext now: New logoObjectPath and logoPublicUrl text, no 500 max in schema `src/db/schema/placements.ts:31-33`
- Fix: Validate secure logo origins and old 500 max or explicit new storage policy.

## G2-13-020-012  [P1] MISSING  facet F04  effort M
- Legacy: Internal notes max2000, transient on global company `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Company.java:66-68`
- vNext now: New core relationships omit internal notes `src/db/schema/placements.ts:75-116`
- Fix: Add college-scoped notes with max2000, never global.

## G2-13-020-015  [P1] MISSING  facet F04  effort M
- Legacy: Merged-into-company ID records deduped source row `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Company.java:95-97`
- vNext now: New global company no mergedInto column `src/db/schema/placements.ts:23-56`
- Fix: Keep merger lineage, redirects and audit integrity for historical job links.

## G2-13-020-033  [P1] MISSING  facet F11  effort M
- Legacy: College-private fields isolated in college_company `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:15-17`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:35-45`
- vNext now: Relationship holds owner/trust but no private contact/notes `src/db/schema/placements.ts:75-115`
- Fix: Add tenant-isolated fields with no cross-college read access.

## G2-13-020-034  [P1] GAP  facet F12  effort M
- Legacy: One domain belongs to one company globally `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:14-32`
- vNext now: New unique primaryDomain lowercased only `src/db/schema/placements.ts:59-64`
- Fix: Support 1-to-many domains with global uniqueness and registrar canonicalization.

## G2-13-020-047  [P1] GAP  facet F22  effort M
- Legacy: Legacy company identity table and separate company_domain + college_company `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Company.java:26-31`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:18-32`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:19-45`
- vNext now: New global companies and relationships, domains separate by query `src/db/schema/placements.ts:23-75`; `src/modules/placements/company-service.ts:124-127`
- Fix: Map all legacy columns incl privacy, verification, domains and merger lineage.

## G2-13-020-049  [P1] GAP  facet F23  effort M
- Legacy: Legacy mergedInto ID tracks duplicate records `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Company.java:95-97`
- vNext now: New uses global unique lower(name) and domain and lacks merge pointer `src/db/schema/placements.ts:59-64`
- Fix: Preserve historical merges/id redirects and avoid accidental name collapse.

## G2-13-030-004  [P1] MISSING  facet F02  effort M
- Legacy: Already-submitted view replaces form with summary and Close `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:69-97`
- vNext now: New staged round results have version/status but no legacy feedback summary view `src/db/schema/placements.ts:1390-1437`
- Fix: Add read-only previous feedback summary and resubmission action as authorized.

## G2-13-030-028  [P1] GAP  facet F10  effort M
- Legacy: Backend saves interview feedback+submittedBy+time and audits INTERVIEW_FEEDBACK_SUBMITTED `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:1550-1577`
- vNext now: New round results stores version/source/submittedBy/appliedAt `src/db/schema/placements.ts:1390-1437`
- Fix: Audit action separately and map interview-level feedback provenance.

## G2-13-030-031  [P1] GAP  facet F12  effort M
- Legacy: UI sees any feedbackRating or feedbackSubmittedAt as already submitted `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:69-71`
- vNext now: New stage results versions may supersede, no simple interview flag `src/db/schema/placements.ts:1390-1437`
- Fix: Define submitted/finalized state accurately and resubmit protections.

## G2-13-030-032  [P1] GAP  facet F12  effort M
- Legacy: Legacy server intentionally allows overwrite-on-resubmit `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:1554-1574`
- vNext now: New round result versioning/supersession `src/db/schema/placements.ts:1403-1431`
- Fix: Preserve audit trail for corrections; disallow old round altering terminal status.

## G2-13-030-042  [P1] GAP  facet F20  effort M
- Legacy: submitRef guards duplicate clicks even before setLoading redraw `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:18-23`; `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:42-45`
- vNext now: New result version and row checks; frontend feedback UI absent `src/db/schema/placements.ts:1403-1431`
- Fix: Implement immediate synchronous submission lock and idempotency.

## G2-13-030-045  [P1] GAP  facet F22  effort M
- Legacy: Legacy interview feedback_rating int, feedback_comments text, action varchar30, submittedAt/by `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:108-158`
- vNext now: New placement_round_results outcome, scorePercent, messages, source and version `src/db/schema/placements.ts:1390-1437`
- Fix: Migrate feedback to round/app stage model without losing 1-5 rating and action.

## G2-4-023-072  [P1] GAP  facet F22  effort M
- Legacy: Legacy verifiedBy42/nameLocked and mergedTo semantics enforce immutable names (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDirectoryService.java:15-18,285-288`)
- vNext now: New verifiedAt/by, ACTIVE/ARCHIVED and domain uniqueness constrain canonical companies (`src/db/schema/placements.ts:23-72`)
- Fix: Preserve legacy verified naming and merge redirects through canonical company identity mapping.

## G2-13-021-009  [P1] GAP  facet F04  effort M
- Legacy: Legacy screeningStatus string PENDING/COMPLETED/FAILED, score columns double. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:37-58`
- vNext now: vNext manual status with decision timestamp/actor/notes, no numeric scores. `src/db/schema/placements.ts:1122-1149`
- Fix: Store separate automated score snapshot or retain legacy read archive.

## G2-13-021-010  [P1] MISSING  facet F04  effort M
- Legacy: Legacy matched/missing skills JSON lists. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:63-72`
- vNext now: vNext manual screening row no JSON skills. `src/db/schema/placements.ts:1114-1166`
- Fix: Design privacy-filtered matched/missing skill fields if parity approved.

## G2-13-021-011  [P1] GAP  facet F04  effort M
- Legacy: Legacy explanation/excludedAttributes JSON/isPartialScore. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:78-102`
- vNext now: vNext internalReason/candidateMessage, no exclusions metadata. `src/db/schema/placements.ts:1114-1166`
- Fix: Separate algorithm explanation from manual notes.

## G2-13-021-012  [P1] GAP  facet F04  effort M
- Legacy: Legacy screeningVersion,screenedAt,screenedBy,screeningMethod,screeningMetadata. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:108-146`
- vNext now: vNext decidedAt/decidedByUserId and screening decision history, no model version. `src/db/schema/placements.ts:1114-1166`
- Fix: Persist version/method/provenance if scoring retained.
