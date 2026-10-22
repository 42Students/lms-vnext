# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-college-placements-interviews-01.test.ts (1 failing)
- /college/placements/interviews responsive UX > UX-college-placements-interviews-03 preserves the audited responsive and empty-state contract

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' to contain 'No interviews match these filters.'
  - Expected
  + Received
  - No interviews match these filters.
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  ```

## tests/unit/UX-college-slice-manifest-01.test.ts (1 failing)
- College UX second-half source completeness > UX-college-slice-03 responsive DataTable callers supply explicit empty copy

  ```
  AssertionError: /college/projects/templates DataTable: expected 'import Link from "next/link";\nimport…' to contain '<DataTable'
  - Expected
  + Received
  - <DataTable
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```

## tests/unit/UX-hr-data-tables-chat15-01.test.ts (1 failing)
- UX-hr-data-tables-chat15-01 responsive authorized data > UX-hr-company-reports-02 uses one shared table for authorized drives, including responsive collapsed metrics

  ```
  AssertionError: expected 'import { SummaryStrip } from "@/compo…' to contain 'import { DataTable } from "@/componen…'
  - Expected
  + Received
  - import { DataTable } from "@/components/ui/data-table"
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { Tabs } from "@/components/ui/tabs";
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-report-funnel.module.css";
  ```

## tests/unit/UX-mentor-cross-nav-closeout-01.test.ts (3 failing)
- Mentor cross audit delivery discovery and contrast > UX-mentor-cross-N01 approved Delivery section has a discoverable selected tab

  ```
  AssertionError: expected 'import { MentorProjectsUnavailable } …' to contain 'delivery: "Delivery"'
  - Expected
  + Received
  - delivery: "Delivery"
  + import { MentorProjectsUnavailable } from "@/components/projects/mentor-projects-unavailable";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
  + import Link from "next/link";
  ```
- Mentor cross audit delivery discovery and contrast > UX-mentor-cross-N02 ProjectList uses accessible text and keyboard focus on all roles

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'text-[var(--lms-teal-deep)]'
  - Expected
  + Received
  - text-[var(--lms-teal-deep)]
  + import Link from "next/link";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { StatusBadge } from "@/components/ui/status-badge";
  +
  ```
- Mentor cross audit delivery discovery and contrast > UX-mentor-cross-N03 closeout submission is guarded and minimum-sized

  ```
  AssertionError: expected '"use client";\n\nimport {useRef,useSt…' to contain 'if(pending||!checks.every(Boolean)) r…'
  - Expected
  + Received
  - if(pending||!checks.every(Boolean)) return;
  + "use client";
  +
  + import {useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  ```

## tests/unit/UX-superadmin-01.test.ts (1 failing)
- UX-superadmin-01 > preserves original wording, permissions and supported accessible UX

  ```
  AssertionError: expected 'import {redirect} from "next/navigati…' to contain 'redirect("/admin/academics")'
  - Expected
  + Received
  - redirect("/admin/academics")
  + import {redirect} from "next/navigation";
  + /** Legacy GET /superadmin formerly returned HTTP 302 to
  +  * /superadmin/dashboard. This App Router page uses a temporary redirect
  +  * (307), which preserves the method and replaces client-side navigation.
  ```

## tests/unit/UX-teacher-gradebook-strict-query-journey.test.tsx (1 failing)
- FAC-GRADEBOOK-UX-01 Faculty gradebook URL, privacy and recovery > renders a truthful empty learner state for the authorized exact Section

  ```
  AssertionError: expected '<div class="min-w-0 max-w-full space-…' to contain 'Download full Section CSV'
  Expected: "Download full Section CSV"
  Received: "<div class="min-w-0 max-w-full space-y-4"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header-title-size:20px] md:[--l
  ```
