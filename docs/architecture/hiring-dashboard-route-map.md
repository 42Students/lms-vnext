# Hiring dashboard compatibility and scope map

The old LMS Super Admin `/superadmin/hiring-dashboard` corresponds to the vNext **Placements → Analytics** surface, `/admin/placements/analytics`. The compatibility tab path `/admin/placements/hiring` redirects to Analytics while retaining supported date, job, academic and search query parameters. The College Admin equivalent is `/college/hiring-dashboard`.

## Legacy API → vNext report boundaries

| Old LMS endpoint | vNext consumer/service | Notes |
| --- | --- | --- |
| `GET /api/v1/admin/jobs/metrics` | `getSuperAdminCompanyHiringReport`, `src/app/(authenticated)/admin/placements/analytics/page.tsx` | Summary aggregated from the chosen college's persisted placement applications, with an application-status snapshot |
| `GET /api/v1/admin/jobs/funnel` | `getSuperAdminCompanyHiringReport(...).funnelRows` and `hiringFunnel` | **Ever reached** historical steps, distinct from mutually exclusive current status; confirmed joining is required for `Hired` |
| `GET /api/v1/admin/jobs/company-report` | `getSuperAdminCompanyHiringReport(...).rows`, `hiringCompanyRollups` | Per-job rows plus company totals; do not add the company totals back into summary counts |
| Legacy client-generated hiring CSV | `GET /api/admin/placements/hiring-report/export` | Scoped server-side CSV with summary, historical funnel, company/job rows, company totals and truncation disclosure |

Do not reintroduce the old three-report API routes as parallel authorization paths. VNext renders the three legacy panels from one authorized selected-college report request; the new route requires Super Admin scope and `placements.read`. The College Admin workspace uses `getPlacementReportWorkspace` and `getCollegeHiringFunnel` in its own membership college.

## Query, identity and migration rules

- Old numeric `jobId`/department/program/batch IDs are **not** interchangeable with vNext UUIDs. A legacy deep link needs an explicit persisted ID mapping before conversion; never cast or guess an identifier.
- `batchId` becomes `cohortId` only after resolving the selected college's cohort; each academic selector is scoped to that same college. A new Department selection resets Program and Batch; Program resets Batch.
- `appliedAfter` and `appliedBefore` legacy instant bounds become `appliedFrom` and `appliedTo` as ISO calendar dates, using Asia/Kolkata start-of-day inclusive and the following midnight exclusive. A through-date covers the complete IST day.
- The report is selected-college-only, even for Super Admin. No organization-wide aggregate is fabricated without a separate authorized scope design.
- Stage counts in the headline tiles are a current snapshot. Funnel counts use persisted stage history, and `Hired` requires a joined outcome after offer acceptance. First-shortlist timing uses recorded transitions only; an unavailable timestamp must not appear as zero.
- A vNext account may have memberships in multiple colleges. Keep the college-by-role switcher and tenant-scoped canonical identity rather than recreating old role-specific accounts.
- Empty legacy deployment data do not require migration of old integer identifiers. Historical links should be rejected or resolved explicitly, not silently redirected to a different tenant.

## Interface contract

Keep the old inline order: **Applied from**, **Applied to**, **Job**, **Department**, **Program**, **Batch**, followed by Refresh and Export report; additional search may be available beside these. Show clearable filter chips only for active filters. The metric cards precede a 500px maximum-width vertical funnel with 24px bars; Company-wise Hiring Report displays job rows and labelled company subtotal rows with accessible horizontal scroll. The analytics page title remains **Placement Analytics** and its missing-college warning remains **Select a college to continue** with the exact Organization + College instruction.
