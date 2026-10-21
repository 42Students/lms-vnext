# Work packet: edit src/modules/placements/college-company-directory-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-companies.md

## G2-9-004-014  [P1] MISSING  facet F04  effort M
- Legacy: Contact person and contact email column (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:283-295`)
- vNext now: No contact person/email projected from company directory (`src/modules/placements/college-company-directory-service.ts:41-63`)
- Fix: Add authorized contact metadata display with privacy controls.

## G2-9-004-046  [P1] MISSING  facet F10  effort M
- Legacy: Old company jobs/stats by company ID and college ID (`docs/legacy-source/frontend/src/api/Services/AdminService.js:662-673`)
- vNext now: Only aggregate per-row counts and last active, no job list (`src/modules/placements/college-company-directory-service.ts:17-74`)
- Fix: Add authorized jobs/stats detail endpoint.

## G2-9-004-052  [P1] GAP  facet F12  effort M
- Legacy: Show deleted list includes soft-deleted rows (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:118-137`)
- vNext now: Company vs relationship ARCHIVED and showDeleted status combination (`src/modules/placements/college-company-directory-service.ts:22-29`)
- Fix: Reconcile archived company versus archived college relationship semantics.

## G2-9-004-083  [P1] GAP  facet F21  effort M
- Legacy: Stats API yields per-company job history counts (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:242-268`)
- vNext now: SQL aggregate counts per college but no applications/hired stats (`src/modules/placements/college-company-directory-service.ts:35-70`)
- Fix: Add secure stats projection and job history screen.
