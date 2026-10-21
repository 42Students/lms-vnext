# Work packet (wave 3): edit src/app/(authenticated)/admin/colleges/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-search-controller.md

## G2-4-014-001  [P1] MISSING  facet F01  effort L
- Legacy: Legacy base route /api/v2/colleges provides search, popular, states, state, city, categories, category, select, stats, exists, refresh. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:22-27`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:72-84`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:166-187`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:211-229`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:247-289`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:305-355`)
- vNext now: New has GET/POST /api/colleges and admin college directory; no /api/v2/colleges search route. (`src/app/api/colleges/route.ts:12-25`; `src/app/(authenticated)/admin/colleges/page.tsx:91-101`)
- Fix: Implement compatible endpoints or migration aliases for each old route.

## G2-4-014-082  [P1] MISSING  facet F23  effort L
- Legacy: Legacy fuzzy, synonyms and popularity explicitly core to search; absent in new. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchCache.java:14-21`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:118-188`)
- vNext now: New substring-only and alphabetic sorting. (`src/app/(authenticated)/admin/colleges/page.tsx:111-119`; `src/modules/colleges/service.ts:220-249`)
- Fix: Do not mark search unit complete until matching quality/ordering is implemented or approved removed.
