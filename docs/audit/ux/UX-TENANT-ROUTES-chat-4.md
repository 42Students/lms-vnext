# Chat-4 tenant route and UX cross-audit — 2026-10-18

Routes inspected: `/admin/colleges`, `/admin/organizations`, `/admin/colleges/[collegeId]`, `/admins`, `/admins/[userId]`, `/admins/[userId]/history`, `/branding`, `/readiness`, `/signin`, `/subdomain`, `/verification`.

| Severity | Finding | Fix / test | State |
|---|---|---|---|
| Major | Colleges/organizations silently take first duplicate and ignore unknown tenant controls, risking misleading scope and pagination | Strict `parseAdminDirectorySearchParams`, friendly ErrorState and `chat4-college-tenant-model-ledger.test.ts` | Patched |
| Major | Administrator history silently chose first `page` array item and ignored foreign keys | Strict `parseAdminSessionHistoryPage`, friendly reset before read; `chat4-super-admin-tenant-route-audit.test.ts` | Patched |
| Major | College verification silently picked first of duplicate query values | Reject arrays before `verificationQueueFilters.safeParse`; route audit test | Patched |
| Minor | Sign-in detail sent invalid college ID to its service instead of normal not-found | Added `collegeIdSchema.safeParse` before service | Patched |
| Verification required | Browser acceptance, college membership permissions and PostgreSQL transaction tests need a runnable repo, test DB and multi-tenant fixtures | Shared Dialog/DataTable source contracts and scoped-service observations only | Not run |

Current status: source and behavior audit plus unit cases committed to lane branch; does not certify security authorization across a real database. Existing restricted-data paths still require integration tests.
