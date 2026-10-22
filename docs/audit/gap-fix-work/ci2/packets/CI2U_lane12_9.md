# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat5-final-faculty-discussion.test.ts (1 failing)
- chat-5 final sprint: Faculty course discussions > FAC-courses-R06 preserves latest successfully fetched discussion messages and exposes retry on refresh failure even when posting permission is revoked

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'Discussion refresh failed. Could not …'
  - Expected
  + Received
  - Discussion refresh failed. Could not refresh the discussion. Showing the last messages we loaded.
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  +
  +
  ```

## tests/unit/chat6-admin-second-third-page-contracts.test.ts (3 failing)
- Super Admin second-third page entrypoints and ownership guards > CHAT6-ADMIN-PAGE placements/hiring keeps its server authorization or secured delegate

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'AdminScopedReadPage'
  - Expected
  + Received
  - AdminScopedReadPage
  + import { redirect } from "next/navigation";
  + /** Legacy Hiring Dashboard address. The scoped report with KPI, funnel and
  +  * company sections is the Analytics page; do not treat job-count list as the
  +  * original dashboard or synthesize three incompatible legacy API responses. */
  ```
- Super Admin second-third page entrypoints and ownership guards > CHAT6-ADMIN-PAGE placements/interviews keeps its server authorization or secured delegate

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'AdminScopedReadPage'
  - Expected
  + Received
  - AdminScopedReadPage
  + import Link from "next/link";
  + import {and,eq,inArray,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {
  ```
- Super Admin second-third page entrypoints and ownership guards > CHAT6-ADMIN-PAGES-01 keeps authorization in the common paged renderer itself

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'Directory unavailable'
  - Expected
  + Received
  - Directory unavailable
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
  ```

## tests/unit/chat6-faculty-assessments-create-legacy.test.ts (1 failing)
- faculty assessment create legacy two-step entry > FAC-assessments-12 requires course and lesson before Continue and exposes exact selection copy

  ```
  AssertionError: expected '"use client";\n\nimport {useId,useMem…' to contain 'Select a course and lesson first.'
  - Expected
  + Received
  - Select a course and lesson first.
  + "use client";
  +
  + import {useId,useMemo,useState} from "react";
  + import {useRouter} from "next/navigation";
  ```

## tests/unit/chat6-learner-calendar-round3.test.ts (2 failing)
- Learner calendar legacy copy > LEARNER-profile-misc-24 restores the today next and all courses schedule labels

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'value={todayEvents.length+" today"}'
  - Expected
  + Received
  - value={todayEvents.length+" today"}
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { CalendarGrid } from "@/components/ui/calendar-grid";
  + import calendarStyles from "@/components/placements/legacy-calendar-theme.module.css";
  ```
- Learner calendar legacy copy > LEARNER-profile-misc-25 renders the legacy partial calendar failure with Retry

  ```
  AssertionError: expected '"use client";\n\nimport { PageHeader …' to contain 'Calendar events may be incomplete. Pl…'
  - Expected
  + Received
  - Calendar events may be incomplete. Please try refreshing the page.
  + "use client";
  +
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Alert } from "@/components/ui/alert";
  ```

## tests/unit/chat6-superadmin-middle-drives-27.test.tsx (3 failing)
- SA-middle-drives-27 platform administrator drive route isolation > missing college scope displays a recovery state without fetching private jobs

  ```
  AssertionError: expected '<div class="min-w-0 space-y-4"><heade…' to contain 'Choose a college'
  Expected: "Choose a college"
  Received: "<div class="min-w-0 space-y-4"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header-title-size:20px] md:[--lms-page-hea
  ```
- SA-middle-drives-27 platform administrator drive route isolation > authorized zero-row drive list renders truthful empty state with same-college loader

  ```
  Error: [vitest] No "listPlacementOperationsJobPage" export is defined on the "@/modules/placements/tpo-operations-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/placements/tpo-operations-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- SA-middle-drives-27 platform administrator drive route isolation > authorized job overview passes the route ID into a scoped detail workspace

  ```
  AssertionError: expected '<div class="min-w-0 space-y-4"><heade…' to contain 'Authorized drive overview'
  Expected: "Authorized drive overview"
  Received: "<div class="min-w-0 space-y-4"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header-title-size:20px] md:[--lms-page-hea
  ```

## tests/unit/chat7-admin-courses-content-hardening.test.ts (1 failing)
- SA-COURSES-CONTENT-AUDIT-02 course and resource list boundaries > does not replace an authorized content result with an empty view when optional pickers fail

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' to contain 'Existing content remains visible'
  - Expected
  + Received
  - Existing content remains visible
  + import { Banner } from "@/components/ui/banner";
  + import Link from "next/link";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  ```
