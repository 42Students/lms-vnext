# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-3/l12-u014-job-application-search-controller.md

2 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-3/l12-u014-job-application-search-controller.md

## G2-12-014-033  [P2] MISSING  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:106-115`
- vNext now: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:93-96`
- Fix: Legacy cache.refresh reloads repository and repopulates partition maps; vNext SQL read has no job and no manual rebuild process.

## G2-12-014-062  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:48-55`
- vNext now: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:22-35`
- Fix: Legacy Spring cache bean, startup @PostConstruct and refresh maintenance; vNext uses direct Drizzle SQL with no indexed in-process cache.
