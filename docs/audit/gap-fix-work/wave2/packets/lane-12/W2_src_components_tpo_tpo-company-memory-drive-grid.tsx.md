# Work packet (wave 2): edit src/components/tpo/tpo-company-memory-drive-grid.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-companies.md

## G2-11-007-027  [P2] GAP  facet F04  effort S
- Legacy: Legacy Year column is `job.year` using `YEAR(j.created_at)` from MySQL. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadsHubService.java:401`
- vNext now: vNext derives year in browser Intl Asia/Kolkata from createdAt ISO. `src/components/tpo/tpo-company-memory-drive-grid.tsx:11`
- Fix: Use consistent calendar year and expose missing date placeholder.

## G2-11-007-031  [P2] GAP  facet F05  effort S
- Legacy: Legacy Drive table columns order `Role`, `Year`, `Applied`, `Status`. `docs/legacy-source/frontend/src/pages/tpo/companies.js:164`
- vNext now: vNext grid order `Role`, `Status`, `Year`, `Applied`, `Created`. `src/components/tpo/tpo-company-memory-drive-grid.tsx:19`
- Fix: Restore order; make new Created column optional/hidden.

## G2-11-007-032  [P2] GAP  facet F05  effort M
- Legacy: Legacy Applied cell `N · M offers` only when offers>0, otherwise N; error displays `Unavailable`, loading skeleton. `docs/legacy-source/frontend/src/pages/tpo/companies.js:170`
- vNext now: vNext always shows `N · M offers`, including 0; counts fallback zero, no cell loading skeleton. `src/components/tpo/tpo-company-memory-drive-grid.tsx:23`
- Fix: Conditionally show offers, skeleton/unavailable states.

## G2-11-007-033  [P2] GAP  facet F05  effort S
- Legacy: Legacy year column has width90; Applied right align width150; Status width120. `docs/legacy-source/frontend/src/pages/tpo/companies.js:169`
- vNext now: vNext TpoGridColumn definitions have no explicit per-column widths in file. `src/components/tpo/tpo-company-memory-drive-grid.tsx:18`
- Fix: Set matching pinned widths, alignment, header density.

## G2-11-007-035  [P2] GAP  facet F05  effort S
- Legacy: Legacy per-company compact grid `searchOf` role + year; search placeholder shared `Search`. `docs/legacy-source/frontend/src/pages/tpo/companies.js:162`
- vNext now: vNext searches role/status/year with placeholder `Search role, status or year` and maxLength120. `src/components/tpo/tpo-company-memory-drive-grid.tsx:42`
- Fix: Match search domain, placeholder and row filtering.

## G2-11-007-036  [P2] GAP  facet F05  effort M
- Legacy: Legacy grid exports named `${company.name}-drives`, data columns Year/Applied/Status. `docs/legacy-source/frontend/src/pages/tpo/companies.js:161`
- vNext now: vNext csv is custom companyDriveCsv, exported to lowercased slug file; grid exportName company-drives. `src/components/tpo/tpo-company-memory-drive-grid.tsx:31`
- Fix: Match export filename, columns and handling of filtered/selected items.

## G2-11-007-076  [P2] GAP  facet F14  effort M
- Legacy: Legacy drive table exports via TpoDataTable CSV/XLSX using `${company.name}-drives`. `docs/legacy-source/frontend/src/pages/tpo/companies.js:160`
- vNext now: vNext local grid exposes CSV only, `company-drives` export. `src/components/tpo/tpo-company-memory-drive-grid.tsx:39`
- Fix: Restore both export formats, basename and current rows.
