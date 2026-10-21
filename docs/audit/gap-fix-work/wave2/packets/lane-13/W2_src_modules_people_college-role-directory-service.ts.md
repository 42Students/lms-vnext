# Work packet (wave 2): edit src/modules/people/college-role-directory-service.ts

25 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/learner-search-controller.md, docs/audit/gap2/lane-5/u027-learner-controller.md, docs/audit/gap2/lane-6/college-admin-teachers.md

## G2-15-013-002  [P2] GAP  facet F01  effort M
- Legacy: Search endpoint query/collegeId/programId/classId. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:114-138`)
- vNext now: New college role directory service kind LEARNER with model q and UUID filters. (`src/modules/people/college-role-directory-service.ts:40-47`)
- Fix: Expose equivalent search resource with multi-field filters and scoped UUID translation.

## G2-15-013-013  [P2] GAP  facet F04  effort M
- Legacy: Searchable fields include email, mobile, department, college/program/class and name IDs. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchDTO.java:58-70`)
- vNext now: New search matches name/email/roll/registration/program/cohort, not mobile and class/college labels. (`src/modules/people/college-role-directory-service.ts:272-278`)
- Fix: Ensure feature parity of needed searchable fields subject to privacy decisions.

## G2-15-013-018  [P2] GAP  facet F05  effort M
- Legacy: Search uses trimmed lowercased substring of entire searchableText, returns cache iteration order. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:129-136`)
- vNext now: New ilike filters and name sort, membershipId tie-break. (`src/modules/people/college-role-directory-service.ts:272-293`)
- Fix: Preserve substring semantics, tie order and case handling for picker.

## G2-15-013-020  [P2] GAP  facet F05  effort M
- Legacy: Class route limit50, filters classId. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:235-249`)
- vNext now: New sectionId filter via enrollment EXISTS, allows cohort/program intersections. (`src/modules/people/college-role-directory-service.ts:150-163`)
- Fix: Map old class ID to section scope; include historic assigned section rules.

## G2-15-013-021  [P2] GAP  facet F05  effort M
- Legacy: Department categories exact case-insensitive selector. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:251-275`)
- vNext now: New program/cohort code text search; not a department category facet. (`src/modules/people/college-role-directory-service.ts:181-191`)
- Fix: Restore department distinct categories and exact match filter.

## G2-15-013-023  [P2] MISSING  facet F05  effort S
- Legacy: Exists checks case-insensitive full displayName equality. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:349-358`)
- vNext now: New q uses ilike substring, no exact exists endpoint. (`src/modules/people/college-role-directory-service.ts:272-278`)
- Fix: Add exact scoped name existence action if used by legacy picker.

## G2-15-013-043  [P2] MISSING  facet F10  effort M
- Legacy: POST /{learnerId}/select calls recordUsage. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:277-289`)
- vNext now: New directory select only DB query/paginate, no usage writes. (`src/modules/people/college-role-directory-service.ts:281-293`)
- Fix: Add opt-in selection metric if legacy popularity must be retained.

## G2-15-013-045  [P2] MISSING  facet F10  effort S
- Legacy: GET /exists/{name} checks displayName exact. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:349-358`)
- vNext now: New fuzzy search only. (`src/modules/people/college-role-directory-service.ts:272-278`)
- Fix: Implement exact exists query under authenticated tenant.

## G2-15-013-051  [P2] GAP  facet F11  effort S
- Legacy: Popular also requires admin classId null. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:145-155`)
- vNext now: New college admin only; no popular route. (`src/modules/people/college-role-directory-service.ts:49-60`)
- Fix: Keep popular lookup restricted to administrators.

## G2-15-013-054  [P2] GAP  facet F12  effort M
- Legacy: Query trim lowercase substring, full searchableText. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:129-135`)
- vNext now: SQL ILIKE user name/email plus learner identity/program only. (`src/modules/people/college-role-directory-service.ts:272-278`)
- Fix: Add safe indexed field coverage or document privacy-driven removal.

## G2-15-013-056  [P2] GAP  facet F12  effort S
- Legacy: Category list distinct trim nonempty in cache order. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:254-259`)
- vNext now: New uses name sorting for directory, no category group. (`src/modules/people/college-role-directory-service.ts:281-293`)
- Fix: Add stable department category sort and exact-match case handling.

## G2-15-013-057  [P2] GAP  facet F12  effort S
- Legacy: Name equality case-insensitive on resolved displayName. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:355-357`)
- vNext now: Substring ILIKE. (`src/modules/people/college-role-directory-service.ts:272-278`)
- Fix: Use equalsIgnoreCase equivalent for exists, not contains.

## G2-15-013-074  [P2] GAP  facet F20  effort S
- Legacy: Malformed cache row individually omitted, old data may persist on reload failure. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchCache.java:116-135`)
- vNext now: New DB transaction can fail whole query. (`src/modules/people/college-role-directory-service.ts:101-110`)
- Fix: Return explicit error without partial stale results, preserving retry.

## G2-15-013-082  [P2] MISSING  facet F22  effort M
- Legacy: Usage/selection count maintained by GenericSearchCache recordUsage. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:277-288`)
- vNext now: New directory does not persist selection counts. (`src/modules/people/college-role-directory-service.ts:281-293`)
- Fix: If popular behavior retained, introduce scoped anonymous selection aggregate.

## G2-5-027-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy supports college/global roster reads, learner detail/program/class roster, and mixed paged/unpaged contracts. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:469-655`
- vNext now: vNext college/admin pages use scoped directory services and membership UUIDs. `src/app/(authenticated)/college/students/page.tsx:1-10`, `src/modules/people/college-role-directory-service.ts:39-47`, `src/app/(authenticated)/admin/students/page.tsx:61-92`
- Fix: Publish every read endpoint equivalent and payload-level compatibility matrix.

## G2-5-027-013  [P2] GAP  facet F03  effort M
- Legacy: Legacy lookup by college+roll returns single learner or 404. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:908-921`
- vNext now: vNext directory supports free-text identity search; no roll-only exact lookup contract. `src/modules/people/college-role-directory-service.ts:176-188,233-281`
- Fix: Provide exact roll lookup for admin actions/import reconciliation.

## G2-5-027-015  [P2] GAP  facet F04  effort M
- Legacy: Legacy paged GET outputs `content,totalElements,totalPages,page,size`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:469-533`
- vNext now: vNext list data returns `items,total,pageSize,totalPages` and typed filters. `src/modules/people/college-role-directory-service.ts:420-435`
- Fix: Bridge response shape, preserve zero-based vs one-based page numbering.

## G2-5-027-016  [P2] GAP  facet F04  effort M
- Legacy: Legacy optional pagination returns unpaged array; paged query filtered by program/batch/class/status. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:535-586`
- vNext now: vNext always uses bounded typed directory, filter placement across active enrollments. `src/modules/people/college-role-directory-service.ts:141-166,281-293`
- Fix: Preserve old picker full-list contract or migrate every consuming picker.

## G2-5-027-020  [P2] GAP  facet F05  effort M
- Legacy: Legacy getAllLearners defaults 0-based page=0, size=50 capped 200; unscoped superadmin may fetch all. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:469-532`
- vNext now: vNext college roster always typed page/pageSize and offset; superadmin scope required for edited lists. `src/modules/people/college-role-directory-service.ts:281-293,420-435`
- Fix: Align defaults and handle unscoped superadmin bulk query without leaking cross-tenant data.

## G2-5-027-053  [P2] GAP  facet F12  effort M
- Legacy: Legacy roster unpaged mode bypasses program/batch/class/status filters except search. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:535-586`
- vNext now: vNext filters typed scoped academic placement with pagination always. `src/modules/people/college-role-directory-service.ts:141-166`
- Fix: Define backward compatibility for pickers that expected unfiltered arrays.

## G2-5-027-058  [P2] GAP  facet F13  effort M
- Legacy: Legacy unscoped college admin fails 403 Cannot determine college scope. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:469-533`
- vNext now: vNext directory error/redirect may not use exact legacy message. `src/app/(authenticated)/college/students/page.tsx:1-10`, `src/modules/people/college-role-directory-service.ts:39-47`
- Fix: Render scope-selection state and reset stale filters.

## G2-5-027-073  [P2] GAP  facet F19  effort M
- Legacy: Legacy roster paged at 25/50 default, cap200, optional array mode. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:469-586`
- vNext now: vNext bounded DB query with total separate count and capped options choices. `src/modules/people/college-role-directory-service.ts:281-293`
- Fix: Tune page size and large-directory selection fallback above 200 filter options.

## G2-5-027-084  [P2] GAP  facet F22  effort M
- Legacy: Legacy roster via learner table with optional page shape, contact_mobile/roll/class foreign keys. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:469-587`
- vNext now: vNext joins membership,user,learner program enrollment and sections, not one Learner row. `src/modules/people/college-role-directory-service.ts:233-281,369-382`
- Fix: Document projected computed fields, null labels, uniqueness and indexes.

## G2-6-001-019  [P2] GAP  facet F05  effort M
- Legacy: Old autocomplete selection narrows rows to one selected faculty and Clear Search resets `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:291-330`
- vNext now: New search submits URL text filter across roster `src/components/college/college-role-directory-workspace.tsx:142-152` `src/modules/people/college-role-directory-service.ts:262-280`
- Fix: Support scoped selected-member search behavior and clear affordance

## G2-15-013-070  [P3] MISSING  facet F18  effort S
- Legacy: Checked for exists. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:355-358`)
- vNext now: No exact exists response. (`src/modules/people/college-role-directory-service.ts:272-278`)
- Fix: Return Checked only from actual name equality lookup.
