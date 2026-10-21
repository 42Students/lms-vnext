# Work packet: edit src/modules/placements/company-service.ts (part 2 of 2)

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/tpo-company-controller.md, docs/audit/gap2/lane-9/college-admin-companies.md, docs/audit/gap2/lane-14/u020-college-company.md

## G2-4-023-037  [P1] GAP  facet F10  effort M
- Legacy: GET /search calls global CompanyDirectoryService.search with college context (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:47-50`)
- vNext now: New listPlacementCompanies scoped to ACTIVE relationships only (`src/modules/placements/company-service.ts:107-151`)
- Fix: Map search to new read service returning global curated results without leaking other college data.

## G2-4-023-047  [P1] GAP  facet F12  effort M
- Legacy: Legacy company identity matches website or recruiter-email domain, not name alone (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:52-58`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDirectoryService.java:43-57`)
- vNext now: New create compares name OR primaryDomain and rejects mismatch (`src/modules/placements/company-service.ts:249-284`)
- Fix: Implement domain-first lookup and controlled company alias handling.

## G2-4-023-073  [P1] MISSING  facet F23  effort M
- Legacy: Legacy `/resolve` allows TPO to explicitly create distinct company despite same-name duplicate (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:39-45,52-58`)
- vNext now: New rejects identity conflict and cannot distinguish same-name separate employer (`src/modules/placements/company-service.ts:249-284`; `src/modules/placements/tpo-company-create-model.ts:4-8`)
- Fix: Build controlled distinct-name override with domains and duplicate review, not blanket creation.

## G2-9-004-045  [P1] GAP  facet F10  effort M
- Legacy: GET/POST/PUT/DELETE/restore admin companies, GET jobs and stats (`docs/legacy-source/frontend/src/api/Services/AdminService.js:659-710`)
- vNext now: New company + relationship service CRUD, no old global identity edit for colleges (`src/modules/placements/company-service.ts:180-398`)
- Fix: Document API contract changes and preserve approved scoped edit/history features.

## G2-9-004-047  [P1] GAP  facet F10  effort M
- Legacy: Legacy Create/Edit sends full company fields (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:171-193`)
- vNext now: Canonical create reuses matching company, college edits relationship only (`src/modules/placements/company-service.ts:180-320`)
- Fix: Decide and implement safe college-specific editable metadata without modifying cross-college identity.

## G2-9-004-053  [P1] GAP  facet F12  effort M
- Legacy: Cannot delete company when linked drives >0 (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:305-334`)
- vNext now: Archives relationship while canonical company/drives remain (`src/modules/placements/company-service.ts:320-470`)
- Fix: Decide whether action should be blocked/relabeled based on active drives.

## G2-9-004-082  [P1] GAP  facet F21  effort M
- Legacy: Old REST service owns global company and soft-delete lifecycle (`docs/legacy-source/frontend/src/api/Services/AdminService.js:659-711`)
- vNext now: Canonical identity service with tenant-owned relationships (`src/modules/placements/company-service.ts:200-320`)
- Fix: Plan explicit migration/ownership of contact, note, industry and logo fields.

## G2-14-020-020  [P2] GAP  facet F07  effort S
- Legacy: Legacy no company domain blocks link creation with explicit Add the company email domain first `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:79-82`
- vNext now: New company creation validates primaryDomain, not join-link readiness `src/modules/placements/company-service.ts:235-275`
- Fix: Use exact domain prerequisite warning in join-link UI

## G2-14-020-022  [P2] MISSING  facet F07  effort M
- Legacy: Legacy wrong domain says Use your company email address for this link `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:218-229`
- vNext now: New recruiter grant uses existing user email, not join-domain self-service `src/modules/placements/company-service.ts:235-377`
- Fix: Validate domain then show exact error

## G2-14-020-023  [P2] GAP  facet F07  effort S
- Legacy: Legacy missing email Enter your work email `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:219-225`
- vNext now: New grant service requires existing email and typed validation `src/modules/placements/company-service.ts:235-377`
- Fix: Map self-service email field and validation message

## G2-14-020-024  [P2] GAP  facet F08  effort M
- Legacy: Legacy link preview returns collegeName/companyName and increments opens `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:126-135`
- vNext now: New company service read does not increment link counters `src/modules/placements/company-service.ts:107-149`
- Fix: Track unique opens with bounded dedup and no token leakage

## G2-14-020-025  [P2] GAP  facet F08  effort M
- Legacy: Legacy join success returns signInEmail/collegeName and sends TPO bell `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:186-197`
- vNext now: New relationship create logs activity but no recruiter join code here `src/modules/placements/company-service.ts:359-374`
- Fix: Reinstate join completion feedback and officer notice

## G2-14-020-026  [P2] GAP  facet F08  effort M
- Legacy: Legacy already-in user returns same success without counter/duplicate alert `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:200-206`
- vNext now: New create onConflictDoUpdate can return existing relation `src/modules/placements/company-service.ts:339-357`
- Fix: Make recruiter self-join idempotent without counters/events on duplicate

## G2-4-023-026  [P2] GAP  facet F07  effort M
- Legacy: Legacy 409 duplicate-company response code SAME_COMPANY, companyId/name/message/error (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:104-109`)
- vNext now: New API maps identity conflict to generic placement error response and dialog generic save error (`src/modules/placements/company-service.ts:265-284`; `src/components/tpo/tpo-company-create-form.tsx:50-60`)
- Fix: Map conflict to dedicated dialog with Use existing / It's different buttons and detail.
