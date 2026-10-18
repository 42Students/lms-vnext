# chat-13 — Placements Admin service coverage ledger

**Owner:** chat-13. **Snapshot:** 2026-10-18, compared with `main` and lane branch. The master queue requires exhaustive Super Admin coverage of placement management, analytics and exports. This is an explicit work ledger, not a claim of comprehensive passing tests. Added a separate model/source audit suite `tests/unit/chat13-placements-admin-mutations.test.ts`. Vitest, TypeScript, browser and PostgreSQL tests have **not run** in this session.

| File / exported entrypoint | Primary boundary | New test / evidence | Coverage status |
|---|---|---|---|
| `src/modules/placements/admin-company-directory-service.ts` — `listSuperAdminCompanyDirectory` | Super Admin role, selected org/college, college ID mismatch, SQL query, pagination | `SA-COMPANY-SCOPE-01`, `SA-COMPANY-QUERY-01`; scoped linked-college count fix | Unit source contract + query runtime; real DB tenancy pending |
| `src/modules/placements/admin-company-directory-model.ts` — `adminCompaniesQuerySchema`, `projectAdminCompanies` | Invalid/wildcard filters, distinction of company vs relationship totals | `SA-COMPANY-QUERY-01`, `SA-COMPANY-DIRECTORY-01` | Runtime unit |
| `src/modules/placements/admin-company-directory-export-model.ts` — `superAdminCompanyCsv` | CSV injection, quote escaping, public-only data projection | `SA-COMPANY-CSV-01` | Runtime unit |
| `src/modules/placements/super-admin-company-edit-model.ts` — `globalCompanyEditSchema`, `isGlobalCompanyScope` | HTTPS URLs, stale timestamp payload shape, global-only operations | `SA-COMPANY-EDIT-01` | Runtime unit; write-service DB pending |
| `src/modules/placements/super-admin-drive-archive-model.ts` — `superAdminArchiveImpactSchema`, `superAdminArchiveCommandSchema`, `canArchiveDriveWithImpact`, `sameArchiveImpact` | Accepted-offer veto, impact drift, malformed request, stale CAS | `SA-DRIVE-ARCHIVE-01`, `SA-DRIVE-ARCHIVE-02` | Runtime unit |
| `src/modules/placements/super-admin-drive-archive-service.ts` — `previewSuperAdminDriveArchive`, `archiveSuperAdminDrive` | Scope, locking, persisted actor, audit, notifications, round cancellations, offer withdrawals | `SA-DRIVE-ARCHIVE-02` source contracts | Needs PostgreSQL concurrent issue/acceptance vs archive |
| `src/modules/placements/super-admin-drive-pipeline-model.ts` — `projectSuperAdminDrivePipeline` | Stage accounting, corrupted totals | `SA-PIPELINE-01` | Runtime unit |
| `src/modules/placements/super-admin-drive-pipeline-service.ts` — `getSuperAdminDrivePipeline` | Scope via `getPlacementJob`, submitted records only | `SA-PIPELINE-01` source contract | Real DB joins/tenant test pending |
| `src/modules/placements/report-service.ts` — `getPlacementReportWorkspace` | Explicit college selection, job membership isolation, selected season | `SA-REPORT-01` | Runtime strict schema + source contract, integration pending |
| `src/modules/placements/report-model.ts` — `summarizePlacementReports`, `summarizePlacementReportDetails` | Deduplication, college placed policy, accepted packages, exports vs counts | Existing cross-role model coverage; no new wide-sample DB fixture here | Follow-up |
| `src/modules/placements/admin-company-merge-service.ts` | Global company canonicalization; deny shared foreign-college relationships; current persisted actor | `SA-COMPANY-MERGE-01` source + persisted actor fix | Model/source contract; DB concurrency pending |
| `src/modules/placements/super-admin-company-restore-service.ts` | Global-only archive reversal, changed-role protection | `SA-COMPANY-RESTORE-01` source + persisted role fix | Source contract; DB pending |
| `src/modules/placements/super-admin-company-verification-service.ts` | Global-only verification and audit | `SA-COMPANY-VERIFY-01` | Runtime strict schema + source contract |
| `src/modules/placements/super-admin-published-drive-edit-service.ts` | No edits to historic eligibility, strict CTC/date and optimistic token | `SA-PUBLISHED-DRIVE-EDIT-01` | Runtime schema + source contract; DB pending |
| `src/modules/placements/super-admin-bulk-drive-service.ts` | Max 25, duplicate rejection, explicit confirmation, persisted actor and failure ledger | `SA-BULK-DRIVE-01` | Source contract; DB pending |
| `src/modules/placements/super-admin-hr-service.ts` | HR accounts/college grant read/write, company identity and query scope | `SA-HR-ACCOUNTS-01/02` validation and status model | Runtime unit on validation; DB pending |
| `src/modules/placements/super-admin-booked-interviews-service.ts` | Booking tenant scope | Not covered in this branch | Follow-up integration |

## Defects

- **SA-COMPANY-SCOPE-01:** `listSuperAdminCompanyDirectory` previously scoped directory rows to the selected organization/college but computed `companyCollegeCount` across the whole database. Scoped this aggregate with the same selected college/organization to prevent leaking relationship counts across tenants.
- **SA-DRIVE-ARCHIVE-RACE-01 (requires PG harness review):** the archive transaction locks the job, then computes offer impact, then separately locks issued offers. A concurrent offer acceptance that does not lock the job can change `ISSUED` to `ACCEPTED` between these steps. Regression requires two real DB transactions; see `docs/audit/defects-chat-13.md`. No unconditional release approval given.

## Additional fixes

- **SA-COMPANY-MERGE-01:** added persisted Super Admin authorization inside the company-merge transaction; previously only the request context was checked. An expired or role-revoked session must fail before mutating company identities.
- **SA-COMPANY-RESTORE-01:** added the same persisted Super Admin authorization to global company archive reversal; restored employer identities must never be written from a stale session.

## Acceptance limitations

The unit test file includes execution-level checks of pure models plus source contract assertions of services. Source assertions do **not** prove runtime database security. Actual coverage percentages, Vitest status, linter and TS typecheck are unknown until orchestrator executes the suite. No numeric coverage claim is made.
