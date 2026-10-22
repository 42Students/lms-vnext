# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-tracker-pages-01.test.ts (3 failing)
- HR-BREAK-tracker-pages-01: reporter-owned routes and recovery > failed data fetch renders retry and does not masquerade as an empty list

  ```
  AssertionError: expected [] to include '/tracker/mine'
  ❯ tests/unit/HR-BREAK-tracker-pages-01.test.ts:65:23
  63|   const page=await MyTrackerReportsPage();
  64|   expect(text(page)).toContain("We could not load your reports.");
  65|   expect(hrefs(page)).toContain("/tracker/mine");
  |                       ^
  66|   expect(text(page)).not.toContain("You have not reported any issues y…
  67|  });
  ```
- HR-BREAK-tracker-pages-01: reporter-owned routes and recovery > empty list has an actionable report route; persisted rows use encoded detail link

  ```
  AssertionError: expected [] to include '/tracker'
  ❯ tests/unit/HR-BREAK-tracker-pages-01.test.ts:71:24
  69|   const empty=await MyTrackerReportsPage();
  70|   expect(text(empty)).toContain("You have not reported any issues yet.…
  71|   expect(hrefs(empty)).toContain("/tracker");
  |                        ^
  72|   mock.list.mockResolvedValue([report]);
  73|   const populated=await MyTrackerReportsPage();
  ```
- HR-BREAK-tracker-pages-01: reporter-owned routes and recovery > detail view shows own report, non-secret severity and return path

  ```
  AssertionError: expected [] to include '/tracker/mine'
  ❯ tests/unit/HR-BREAK-tracker-pages-01.test.ts:88:23
  86|   expect(text(page)).toMatch(/Status:\s+OPEN/);
  87|   expect(text(page)).toMatch(/Severity:\s+HIGH/);
  88|   expect(hrefs(page)).toContain("/tracker/mine");
  |                       ^
  89|   expect(mock.get).toHaveBeenCalledWith({user:{platformStatus:"ACTIVE"…
  90|  });
  ```

## tests/unit/PROJ-BREAK-chat9-sa-tenant-directory-page.test.tsx (2 failing)
- Super Admin last-third tenants directory: failures, denial and invalid GET > SA-tenants-idor-58 disabled Super Admin is denied before tenant PII read

  ```
  AssertionError: expected 'Tenant Setup Tenant directory access …' to contain 'Back to dashboard'
  Expected: "Back to dashboard"
  Received: "Tenant Setup Tenant directory access denied Your account cannot view platform tenant records. /dashboard"
  ```
- Super Admin last-third tenants directory: failures, denial and invalid GET > SA-tenants-ux-11 genuine zero matches are distinct from an unavailable directory

  ```
  AssertionError: expected 'Tenant Setup Read-only active and arc…' to contain 'No matching tenants'
  Expected: "No matching tenants"
  Received: "Tenant Setup Read-only active and archived colleges with explicit lifecycle state. The selected Super Admin safety scope always applies. Tenant Setup has one connected workflow: create an organization, add a college, then configure its launch readiness. The directory below is for returnin
  ```

## tests/unit/UX-college-bounded-loading-01.test.ts (1 failing)
- College UX bounded directory loader > UX-college-bounded-loading-02 delegates every nine College directory fallbacks to the shared bounded loader

  ```
  AssertionError: semester-courses: expected 'import { PageHeader } from "@/compone…' to contain 'GracefulPageLoading'
  - Expected
  + Received
  - GracefulPageLoading
  + import { PageHeader } from "@/components/ui/page-header";
  +
  + /** Matches legacy SemesterCourseMapping TableSkeleton (six columns/rows). */
  + export default function SemesterCoursesLoading() {
  ```

## tests/unit/UX-group-import-preview-table-chat17.test.ts (1 failing)
- UX-UNOWNED-TABLE-09 college group bulk import preview > retains validation statuses, row/email fields and safe download after migrating to mobile table

  ```
  AssertionError: expected '"use client";\nimport { FileUpload } …' to contain 'Preview only. No memberships'
  - Expected
  + Received
  - Preview only. No memberships
  + "use client";
  + import { FileUpload } from "@/components/ui/file-upload";
  + import { Textarea } from "@/components/ui/textarea";
  + import { Select } from "@/components/ui/select";
  ```

## tests/unit/UX-tpo-companies-companyid-01.test.ts (1 failing)
- UX-tpo-companies-companyid-01 /tpo/companies/[companyId] > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import {DataTable} from "@/components…' not to match /min-h-(?:9|10)\b/
  - Expected:
  /min-h-(?:9|10)\b/
  + Received:
  "import {DataTable} from \"@/components/ui/data-table\";
  import {MetricBar} from \"@/components/ui/metric-bar\";
  import yearStyles from \"@/components/tpo/legacy-company-year-chart.module.css\";
  import Link from \"next/link\";
  ```

## tests/unit/chat11-super-admin-bulk-module-safety.test.ts (2 failing)
- SA-tenants-modules-MOD-BULK-07 atomic student bulk module outcomes > checks stale optimistic tokens and ancestor locks before writes

  ```
  AssertionError: expected 'Could not update the selected learner…' to be 'The rule changed. Refresh and try aga…' // Object.is equality
  Expected: "The rule changed. Refresh and try again."
  Received: "Could not update the selected learners. No changes were saved."
  ```
- SA-tenants-modules-MOD-BULK-07 atomic student bulk module outcomes > writes per-learner evidence and the summary in the same transaction

  ```
  AssertionError: expected { requested: 1, applied: +0, …(3) } to match object { requested: 1, applied: 1, …(2) }
  (1 matching property omitted from actual)
  - Expected
  + Received
  {
  -   "applied": 1,
  -   "auditRecorded": true,
  -   "failures": [],
  ```

## tests/unit/chat12-round36-legacy-f-filters.test.ts (1 failing)
- TPO Students historical grid filters > TPO-students-24 retains active filter chips and Clear all with live server match counts

  ```
  AssertionError: expected '"use client";\nimport {Select} from "…' to contain '>Clear all</button>'
  - Expected
  + Received
  - >Clear all</button>
  + "use client";
  + import {Select} from "@/components/ui/select";
  + import {Button} from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  ```

## tests/unit/chat13-final-sprint-public-share.test.ts (1 failing)
- chat-13 final sprint public company share > PUB-auth-public-53 filters every selected column and never exports an unselected phone or URL

  ```
  AssertionError: expected 'import authStyles from "@/components/…' to contain 'cell: row=>row.cells[key]'
  - Expected
  + Received
  - cell: row=>row.cells[key]
  + import authStyles from "@/components/public/public-auth-skin.module.css";
  + import Link from "next/link";
  + import { Button } from "@/components/ui/button";
  + import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
  ```
