# Work packet (wave 3): edit src/modules/colleges/service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-search-controller.md

## G2-4-014-082  [P1] MISSING  facet F23  effort L
- Legacy: Legacy fuzzy, synonyms and popularity explicitly core to search; absent in new. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchCache.java:14-21`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:118-188`)
- vNext now: New substring-only and alphabetic sorting. (`src/app/(authenticated)/admin/colleges/page.tsx:111-119`; `src/modules/colleges/service.ts:220-249`)
- Fix: Do not mark search unit complete until matching quality/ordering is implemented or approved removed.
