# Work packet: edit src/modules/placements/company-service.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u020-college-company.md, docs/audit/gap2/lane-4/l13-u020-company-model.md, docs/audit/gap2/lane-4/tpo-company-controller.md

## G2-14-020-004  [P1] GAP  facet F02  effort L
- Legacy: Legacy company link page can preview, OTP, join and see metrics `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:117-198`
- vNext now: New relationship service supports create/update/archive, recruiter access separately `src/modules/placements/company-service.ts:235-377`
- Fix: Build full company join flow parity tied to selected relationship

## G2-14-020-016  [P1] GAP  facet F06  effort L
- Legacy: Legacy link requires company domain first; rotates old link `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:77-89`
- vNext now: New create company requires active relationship, but no link token management in company service `src/modules/placements/company-service.ts:235-377`
- Fix: Provide company-domain verified join link creation and rotation

## G2-14-020-019  [P1] GAP  facet F06  effort L
- Legacy: Legacy join email must match company domain, code verified `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:137-165` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:218-229`
- vNext now: New TPO GRANT requires existing active user and company relationship `src/modules/placements/company-service.ts:235-377`
- Fix: Enable verified self-join with OTP before grant

## G2-14-020-021  [P1] MISSING  facet F07  effort M
- Legacy: Legacy invalid token says This link is no longer valid `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:212-216`
- vNext now: No token preview in new relation service `src/modules/placements/company-service.ts:235-377`
- Fix: Implement invalid/expired token page with safe generic message

## G2-14-020-030  [P1] GAP  facet F10  effort L
- Legacy: Legacy company join reactivates recruiter access in selected college `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:246-276`
- vNext now: New recruiter GRANT through TPO service and relationship scope `src/modules/placements/company-service.ts:235-377`
- Fix: Map public verified join into grant with required expiry and verification

## G2-14-020-034  [P1] GAP  facet F11  effort M
- Legacy: Legacy organization-level listed-company check grants org-wide job linkage `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/CollegeCompanyRepository.java:25-28`
- vNext now: New relationship is strictly college unique, no simple org-any lookup `src/db/schema/placements.ts:78-85` `src/modules/placements/company-service.ts:107-149`
- Fix: Implement approved org-sharing projection without exposing private notes

## G2-14-020-035  [P1] GAP  facet F11  effort L
- Legacy: Legacy company join requires email domain ownership and code `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:137-165`
- vNext now: New service does not provide equivalent join verification `src/modules/placements/company-service.ts:235-377`
- Fix: Require work email OTP verified to domain before grant

## G2-14-020-042  [P1] MISSING  facet F13  effort M
- Legacy: Legacy invalid joining token returns generic LINK_INVALID `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:212-216`
- vNext now: No join-link route in mapped company service `src/modules/placements/company-service.ts:235-377`
- Fix: Add a safe expired/invalid link state

## G2-14-020-045  [P1] GAP  facet F15  effort L
- Legacy: Legacy successful join rings TPO bell and sends recruiter welcome email `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:186-197` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:235-243`
- vNext now: New relationship create records activity but no self-join completion event `src/modules/placements/company-service.ts:359-374`
- Fix: Deliver targeted officer bell and recruiter welcome once

## G2-14-020-057  [P1] GAP  facet F21  effort L
- Legacy: Legacy CompanyJoinService integrates OTP email and bell `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:137-165` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:186-197`
- vNext now: New companyService only audit event, recruiter onboarding separate `src/modules/placements/company-service.ts:235-374`
- Fix: Add secure OTP and transactional event/outbox for joining

## G2-13-020-027  [P1] GAP  facet F10  effort M
- Legacy: Legacy create reuses existing company if owned domain matches, verified name wins `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:137-180`
- vNext now: New identity matches by name OR primaryDomain and throws on conflict `src/modules/placements/company-service.ts:247-285`
- Fix: Use domain as authoritative identity; avoid collapsing different same-name companies.

## G2-13-020-028  [P1] MISSING  facet F10  effort M
- Legacy: Legacy update shared fields when 42 SA or origin college, syncs job name/logo `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:248-310`
- vNext now: New relationship update only trust+owner `src/modules/placements/company-service.ts:382-420`
- Fix: Rebuild global-edit guard and denormalized job resync.

## G2-13-020-029  [P1] GAP  facet F10  effort M
- Legacy: Legacy create/update/delete/restore emits audit action records `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:46-59`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:191-193`
- vNext now: New create records activity; relationship update lacks event in shown path `src/modules/placements/company-service.ts:359-373`; `src/modules/placements/company-service.ts:395-420`
- Fix: Emit create/update/delete/restore comparable audited actions.

## G2-13-020-032  [P1] GAP  facet F11  effort M
- Legacy: Verified companies only editable globally; origin college owns unverified shared details `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:250-258`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:314-323`
- vNext now: New create requires placements.manage scoped college `src/modules/placements/company-service.ts:239-246`
- Fix: Enforce separate platform verified vs origin-college shared edit rules.

## G2-13-020-044  [P1] GAP  facet F20  effort M
- Legacy: Legacy domain concurrent ownership save catches collision `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:226-240`
- vNext now: New onConflictDoNothing + identity refetch `src/modules/placements/company-service.ts:287-309`
- Fix: Re-query by domain, never reuse unrelated name match under races.

## G2-13-020-045  [P1] MISSING  facet F20  effort M
- Legacy: Legacy shared rename lock and linked job resync serialized `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:248-310`
- vNext now: New relationship mutations do not implement shared rename path `src/modules/placements/company-service.ts:382-420`
- Fix: Implement transactional global rename with linked-job updates.

## G2-13-020-047  [P1] GAP  facet F22  effort M
- Legacy: Legacy company identity table and separate company_domain + college_company `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Company.java:26-31`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:18-32`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:19-45`
- vNext now: New global companies and relationships, domains separate by query `src/db/schema/placements.ts:23-75`; `src/modules/placements/company-service.ts:124-127`
- Fix: Map all legacy columns incl privacy, verification, domains and merger lineage.

## G2-4-023-012  [P1] GAP  facet F04  effort M
- Legacy: Legacy search is worldwide/global directory plus relationships filtered by selected college (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:22-24,47-50`)
- vNext now: New `listPlacementCompanies` returns only ACTIVE college/company relationships (`src/modules/placements/company-service.ts:107-151`)
- Fix: Add separate canonical lookup and curated-first results without cross-college contact leakage.

## G2-4-023-018  [P1] GAP  facet F05  effort M
- Legacy: Legacy company resolution performs duplicate confirmation based on identity (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:104-109`)
- vNext now: New creates with case-insensitive identity match; rejects if multiple or domain mismatch (`src/modules/placements/company-service.ts:249-284`)
- Fix: Offer explicit same-company choice rather than generic identity-conflict failure.

## G2-4-023-025  [P1] MISSING  facet F06  effort M
- Legacy: Legacy duplicate name can explicitly be `notTheSame=true` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:39-45,56-58`)
- vNext now: New creation checks case-insensitive name/primary domain and no override field (`src/modules/placements/company-service.ts:249-284`; `src/modules/placements/tpo-company-create-model.ts:4-8`)
- Fix: Provide conflict-safe distinct-company flow with explicit reason and canonical alias policy.
