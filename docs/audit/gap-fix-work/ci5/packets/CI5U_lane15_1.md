# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-SA-40-planned-submission-risk.test.ts (1 failing)
- PROJ-BREAK-SA-40 Project Admin risk badges must reflect actionable review state > preserves a valid pending-review signal and independent planned-workspace staleness

  ```
  AssertionError: expected [] to deeply equal [ 'No activity in 7 days' ]
  - Expected
  + Received
  - [
  -   "No activity in 7 days",
  - ]
  + []
  ```

## tests/unit/PROJ-BREAK-chat9-sa-tenant-setup-page.test.tsx (1 failing)
- Super Admin Tenant Setup: unauthorized and incomplete readiness must fail closed > SA-tenants-setup-14 incomplete selected-college readiness cannot show launch actions

  ```
  AssertionError: expected 2 to be 1 // Object.is equality
  - Expected
  + Received
  - 1
  + 2
  ```

## tests/unit/UX-college-college-batches-cohort-id-students-01.test.ts (1 failing)
- UX-college-college-batches-cohort-id-students-01 provides keyboard-scrolling wide roster with fixed identity

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'focus-visible:outline-[var(--lms-teal…'
  - Expected
  + Received
  - focus-visible:outline-[var(--lms-teal-deep)]
  + "use client";
  +
  + import { useEffect, useRef, useState, type ReactNode } from "react";
  + import { cx } from "@/lib/class-names";
  ```

## tests/unit/UX-hr-page-states-chat15-01.test.ts (4 failing)
- UX-hr-page-states-chat15-01 recruiter route coverage > HR-page /hr/activity has role isolation, safe UX states and exact relevant copy

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'role="status"'
  - Expected
  + Received
  - role="status"
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Tabs } from "@/components/ui/tabs";
  + import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";
  + import Link from "next/link";
  ```
- UX-hr-page-states-chat15-01 recruiter route coverage > HR-page /hr/company/reports has role isolation, safe UX states and exact relevant copy

  ```
  AssertionError: expected 'import { SummaryStrip } from "@/compo…' to contain '<DataTable'
  - Expected
  + Received
  - <DataTable
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { Tabs } from "@/components/ui/tabs";
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-report-funnel.module.css";
  ```
- UX-hr-page-states-chat15-01 recruiter route coverage > HR-page /hr/conversations has role isolation, safe UX states and exact relevant copy

  ```
  AssertionError: expected 'import inboxStyles from "@/components…' to contain 'No matching conversations'
  - Expected
  + Received
  - No matching conversations
  + import inboxStyles from "@/components/hr/recruiter-conversations-legacy.module.css";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import { Tabs } from "@/components/ui/tabs";
  ```
- UX-hr-page-states-chat15-01 recruiter route coverage > HR-page /hr/notifications has role isolation, safe UX states and exact relevant copy

  ```
  AssertionError: expected 'import { Tabs } from "@/components/ui…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + import { Tabs } from "@/components/ui/tabs";
  + import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";
  + import Link from "next/link";
  + import { Input } from "@/components/ui/input";
  ```

## tests/unit/UX-tpo-drive-day-01.test.ts (1 failing)
- UX-tpo-drive-day-01 /tpo/drive-day > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' not to match /min-h-(?:9|10)\b/
  - Expected:
  /min-h-(?:9|10)\b/
  + Received:
  "import {Button} from \"@/components/ui/button\";
  import {Select} from \"@/components/ui/select\";
  import {Input} from \"@/components/ui/input\";
  import Link from \"next/link\";
  ```

## tests/unit/chat11-super-admin-course-progress-tenant-guard.test.ts (1 failing)
- SA-tenants-modules-COURSE-PROGRESS-07 authoritative scope and strict URL state > authenticates Super Admin before offering query fallback and student data retrieval

  ```
  AssertionError: expected 1508 to be less than -1
  ❯ tests/unit/chat11-super-admin-course-progress-tenant-guard.test.ts:55:17
  53|   expect(auth).toBeGreaterThan(-1);
  54|   expect(auth).toBeLessThan(parse);
  55|   expect(parse).toBeLessThan(read);
  |                 ^
  56|   expect(source).toContain("Student Course Progress");
  57|   expect(source).toContain("Not measured");
  ```

## tests/unit/chat12-round37-xlsx-export.test.ts (1 failing)
- TPO-students-36 creates genuine ZIP-based XLSX with sorted scoped columns, mandatory batch/branch and an italic view provenance line

  ```
  AssertionError: expected 'import { legacyGridExportFilename } f…' to contain 'filename="tpo-students.xlsx"'
  - Expected
  + Received
  - filename="tpo-students.xlsx"
  + import { legacyGridExportFilename } from "@/modules/placements/grid-export-filename";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {apiErrorResponse} from "@/lib/api-error";
  + import {hasMembershipRole} from "@/modules/identity/context";
  ```

## tests/unit/chat13-final-sprint-tpo-home-r08.test.ts (1 failing)
- TPO-home-R08 loads independent Home signals concurrently and fails each heavy source independently

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' to contain 'value={operationsResult?operations.su…'
  - Expected
  + Received
  - value={operationsResult?operations.summary.publishedJobs:"—"}
  + import { Badge } from "@/components/ui/badge";
  + import Link from "next/link";
  + import {TpoHomeReturnRefresh} from "@/components/tpo/tpo-home-return-refresh";
  + import {eq} from "drizzle-orm";
  ```
