# College service/model coverage ledger — chat-4 initial slice (2026-10-18)

**Status: PARTIAL; not exhaustive.** This first batch covers selected tenant-directory and safety models with executable Vitest cases; it is not a claim that all `src/modules/colleges`, `src/modules/academics`, `src/modules/groups` and `src/modules/people` services have permission-matrix/DB transition coverage. Those remain open in master queue chat-4.

| Exported function or schema | Source | Test and cases |
|---|---|---|
| `adminDirectoryQuerySchema` | `src/modules/colleges/admin-directory-query-model.ts` | `chat4-college-tenant-model-ledger.test.ts`: allowed/default, invalid length, page, size, foreign params |
| `parseAdminDirectorySearchParams` | same | duplicate/array/unknown/recovery |
| `tenantLifecyclePaging` | `admin-tenant-lifecycle-model.ts` | clamp, empty, negative error |
| `tenantLifecycleHref` | same | defaults, encoding, foreign params |
| `tenantSetupLinksAvailable` | same | all status combinations |
| `hasCollegeDependencies` | `archive-policy.ts` | every usage field |
| `assertCollegeCanArchive` | same | zero dependencies, positive dependency and typed reason |
| `signInCapabilities` | `signin-methods-model.ts` | all four methods |
| `updateCollegeSignInSchema` | same | bad ID, bad method, optimistic version |
| `collegeNameSchema` / `collegeCodeSchema` / `updateCollegeInputSchema` | `validation.ts` | required, trim/normalize, malformed code, non-empty update |
| `parseSuperAdminReadinessParams` | `admin-readiness-filter.ts` | defaults, duplicate, foreign and unsupported |
| `visibleReadinessChecks` | same | NEEDS_ATTENTION including UNKNOWN; exact area/status |
| `readinessRemediationLink` | `readiness-remediation-links.ts` | college-scoped URL encoding, stable target |
| `/admin/colleges` and `/admin/organizations` page reads | page routes | source-level scope, permissions, DataTable, malformed-query recovery |

**Outstanding:** enumerate and test the remaining exported functions in each of 40 `colleges`, 97 `academics`, 17 `groups`, and 117 `people` files (numbers include types/models and are not a function count); add PostgreSQL route/service permission, rollback, notification and concurrency tests. No claim of completion until these rows are added and executed.
