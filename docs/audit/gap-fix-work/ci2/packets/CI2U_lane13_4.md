# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-tpo-audit-actors-01.test.ts (1 failing)
- UX-tpo-audit-actors-01 /tpo/audit/actors > preserves legacy UI while applying signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' not to match /min-h-(?:9|10)\b/
  - Expected:
  /min-h-(?:9|10)\b/
  + Received:
  "import { DateInput } from \"@/components/ui/date-input\";
  import { Pagination } from \"@/components/ui/pagination\";
  import { Disclosure } from \"@/components/ui/disclosure\";
  import { EmptyState } from \"@/components/ui/empty-state\";
  ```

## tests/unit/UX-tpo-companies-companyid-01.test.ts (1 failing)
- UX-tpo-companies-companyid-01 /tpo/companies/[companyId] > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import {DataTable} from "@/components…' not to contain 'text-on-primary'
  - Expected
  + Received
  - text-on-primary
  + import {DataTable} from "@/components/ui/data-table";
  + import {MetricBar} from "@/components/ui/metric-bar";
  + import yearStyles from "@/components/tpo/legacy-company-year-chart.module.css";
  + import Link from "next/link";
  ```

## tests/unit/UX-tpo-placements-jobs-jobid-01.test.ts (1 failing)
- UX-tpo-placements-jobs-jobid-01 /tpo/placements/jobs/[jobId] > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import { notFound, redirect } from "n…' not to match /min-h-(?:9|10)\b/
  - Expected:
  /min-h-(?:9|10)\b/
  + Received:
  "import { notFound, redirect } from \"next/navigation\";
  import Link from \"next/link\";
  import { ZodError } from \"zod\";
  import { getPlacementJob } from \"@/modules/placements/job-service\";
  ```

## tests/unit/audit-findings-detail-link.test.ts (1 failing)
- DB10 independent audit findings detail integration > links to its own persisted finding, distinct from the user bug-report workflow

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain '/tracker/audit-findings/'
  - Expected
  + Received
  - /tracker/audit-findings/
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Banner } from "@/components/ui/banner";
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat11-final-TPO-settings-audit-23.test.ts (1 failing)
- TPO job type persistence final sprint > TPO-settings-audit-23 preserves the canonical college-scoped write and read contract

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain '<TpoJobTypesEditor'
  - Expected
  + Received
  - <TpoJobTypesEditor
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Alert } from "@/components/ui/alert";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/chat11-super-admin-tenant-setup-authority.test.ts (2 failing)
- SA-tenants-modules-SETUP-08 tenant setup role and journey > denies unauthorised roles before revealing malformed-filter guidance or loading tenant counts

  ```
  AssertionError: expected 2970 to be less than -1
  ❯ tests/unit/chat11-super-admin-tenant-setup-authority.test.ts:31:16
  29|   expect(context).toBeGreaterThan(-1);
  30|   expect(context).toBeLessThan(gate);
  31|   expect(gate).toBeLessThan(parse);
  |                ^
  32|   expect(parse).toBeLessThan(read);
  33|   expect(source).toContain('import {can,requirePermission} from "@/mod…
  ```
- SA-tenants-modules-SETUP-08 tenant setup role and journey > links to distinct tenant-specific branding, sign-in, module and readiness checks

  ```
  AssertionError: expected [ 'brand', 'login', 'host', …(5) ] to deeply equal [ 'brand', 'login', 'host', …(4) ]
  - Expected
  + Received
  [
  "brand",
  "login",
  "host",
  +   "preview",
  ```
