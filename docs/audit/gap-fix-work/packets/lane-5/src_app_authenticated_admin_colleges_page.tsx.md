# Work packet: edit src/app/(authenticated)/admin/colleges/page.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-search-controller.md, docs/audit/gap2/lane-9/superadmin-colleges.md

## G2-4-014-014  [P1] GAP  facet F04  effort M
- Legacy: Searchable text includes name, uniqueId, city, state, country, address1, address2 and landmark. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchDTO.java:45-59`)
- vNext now: New admin search only name, code, city, organizationName. (`src/app/(authenticated)/admin/colleges/page.tsx:111-115`)
- Fix: Restore state/country/address/landmark search predicates.

## G2-4-014-017  [P1] GAP  facet F05  effort M
- Legacy: /search default limit15, accepts query,state,city,orgId. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:72-84`)
- vNext now: New admin page q,page,pageSize only, pageSize defaults25. (`src/app/(authenticated)/admin/colleges/page.tsx:91-99`; `src/modules/colleges/admin-directory-query-model.ts:17-28`)
- Fix: Support default15 top-N search plus all legacy filters.

## G2-4-014-022  [P1] GAP  facet F05  effort M
- Legacy: Search org view getByOrganization(orgId, limit) then query filter. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:140-151`)
- vNext now: New filters full list first then slices page. (`src/app/(authenticated)/admin/colleges/page.tsx:111-119`)
- Fix: Preserve intended matches; do not pre-limit before filtering when implementing adapter.

## G2-4-014-038  [P1] MISSING  facet F10  effort M
- Legacy: POST /:collegeId/select increments in-memory usageCounts. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:289-303`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:255-262`)
- vNext now: New read-only selection from admin list does not write usage. (`src/app/(authenticated)/admin/colleges/page.tsx:61-65`)
- Fix: Record selection in durable or explicitly ephemeral counter.

## G2-4-014-043  [P1] GAP  facet F11  effort M
- Legacy: Non-superadmin with organization may search its org, not other tenants. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:86-98`)
- vNext now: New /admin/colleges UI requires admin-scope.select, while API listColleges can support college admin only. (`src/app/(authenticated)/admin/colleges/page.tsx:91-94`; `src/modules/colleges/service.ts:252-255`)
- Fix: Check faculty/recruiter org-scoped read access, provide safe API without admin page.

## G2-4-014-048  [P1] GAP  facet F12  effort L
- Legacy: Ranking exact100, starts80, word-starts60, contains40, usage bonus up to10. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:310-352`)
- vNext now: New admin q filter only includes over four text fields, then preserves list name order. (`src/app/(authenticated)/admin/colleges/page.tsx:111-119`)
- Fix: Implement rank score per field and usage bonus for autocomplete parity.

## G2-4-014-049  [P1] MISSING  facet F12  effort M
- Legacy: Fuzzy fallback Levenshtein max distance2 when fewer than5 matches, query len>=3. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:163-177`)
- vNext now: New substring-only filter. (`src/app/(authenticated)/admin/colleges/page.tsx:111-115`)
- Fix: Implement typo-tolerant fallback.

## G2-4-014-050  [P1] MISSING  facet F12  effort M
- Legacy: Synonyms include IIT,NIT,IIIT,BITS,VIT,SRM,Amrita, etc. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchCache.java:57-94`)
- vNext now: New search has no synonym expansion. (`src/app/(authenticated)/admin/colleges/page.tsx:111-115`)
- Fix: Add synonym dictionary matching legacy entries.

## G2-9-032-032  [P1] GAP  facet F07  effort M
- Legacy: If organizations unavailable, disable mutations; alert Retry organizations `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:66-74,584-590`
- vNext now: Promise.all page load and filtered creatable organizations, no inline Retry organizations `src/app/(authenticated)/admin/colleges/page.tsx:101-104,136-152`
- Fix: Fail closed with org-specific error and Retry rather than generic route failure

## G2-9-032-058  [P1] GAP  facet F13  effort M
- Legacy: Organizations could not be loaded error and Retry organizations `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:66-75,588-590`
- vNext now: One Promise.all fetch, no distinct org failure state `src/app/(authenticated)/admin/colleges/page.tsx:101-105`
- Fix: Separate org recovery and block mutation until valid

## G2-4-014-033  [P2] GAP  facet F08  effort S
- Legacy: Admin refresh replies Cache refreshed. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:355-365`)
- vNext now: Page refresh link reloads query without toast. (`src/app/(authenticated)/admin/colleges/page.tsx:162-165`)
- Fix: If user-visible refresh remains, distinguish cache reload vs page refresh in wording.
