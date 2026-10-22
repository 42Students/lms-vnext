# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat14-mentor-page-filter-privacy.test.tsx (1 failing)
- PROJ-BREAK-MENTOR-192..194 server-rendered project filters and disabled headings > PROJ-BREAK-MENTOR-194 disabled headings never display stale project names or statuses

  ```
  TypeError: Cannot read properties of undefined (reading 'releaseStatus')
  ❯ Module.MentorProjectTimelinePage src/app/(authenticated)/mentor/projects/[projectId]/timeline/page.tsx:34:29
  32|     await getCurrentRequestContext(),parsed.data,
  33|   );
  34|   const filtered=data.query.releaseStatus!=="ALL"||data.query.sprintSt…
  |                             ^
  35|   return <div className="min-w-0 max-w-full space-y-4">
  36|     <PageHeader title="Release & Sprint timeline"
  ```

## tests/unit/PROJ-BREAK-chat9-template-college-page.test.tsx (1 failing)
- Super Admin Projects template colleges: resilient, scoped and bounded page states > PROJ-BREAK-ux-37 authorized empty catalogue is distinct from a service error

  ```
  AssertionError: expected '← Back to templates /admin/projects/t…' to contain 'No matching colleges'
  Expected: "No matching colleges"
  Received: "← Back to templates /admin/projects/templates IIT Dharwad Select the colleges that can use this template. Scope: active colleges accessible to the selected Super Admin. Existing workspaces retain their pinned template version when availability changes. College name or code Availability AL
  ```

## tests/unit/UX-college-college-companies-01.test.ts (1 failing)
- UX-college-college-companies-01 retains responsive forms, states and legacy copy

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import { FilterBar } from "@/components/ui/filter-bar";
  ```

## tests/unit/UX-learn-attendance-month-01.test.ts (1 failing)
- UX-learn-attendance-month-01 /learn/attendance course-month history > unmarked classes never silently count toward the marked percentage, and missing data is explained

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'Attendance threshold'
  - Expected
  + Received
  - Attendance threshold
  + "use client";
  + import { Input } from "@/components/ui/input";
  +
  + import { learnerCourseAttendanceMonthShortcutVisible } from "@/modules/attendance/learner-course-attendance-month-shortcut-model";
  ```

## tests/unit/UX-tpo-first-cross-audit-chat6.test.ts (1 failing)
- Chat-6 independent TPO first-third cross-audit > UX-tpo-calendar-21 follow-up creation preserves native back and IST

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'sm:text-sm'
  - Expected
  + Received
  - sm:text-sm
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { Input } from "@/components/ui/input";
  ```

## tests/unit/chat11-super-admin-signin-readiness.test.ts (1 failing)
- SA-tenants-modules-READY-01: persisted readiness does not imply launch approval > branding and module access read the selected tenant without a URL-supplied scope override

  ```
  AssertionError: expected 'import { notFound } from "next/naviga…' to contain 'getSuperAdminCollegeBrandingPreview(c…'
  - Expected
  + Received
  - getSuperAdminCollegeBrandingPreview(context, collegeId)
  + import { notFound } from "next/navigation";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {ErrorState} from "@/components/ui/error-state";
  + import {PageBackLink} from "@/components/ui/page-back-link";
  ```

## tests/unit/chat12-tpo-company-share-history-behavior.test.ts (1 failing)
- TPO-companies-11 historical applicant sharing is scoped, bounded and honest > reader joins share college to job college and caps history at 100 rows

  ```
  AssertionError: expected 'import "server-only";\nimport {and,de…' to contain 'orderBy(desc(placementCompanyApplican…'
  - Expected
  + Received
  - orderBy(desc(placementCompanyApplicantShares.createdAt))
  + import "server-only";
  + import {and,desc,eq,inArray,sql} from "drizzle-orm";
  + import {placementCompanyShareSelections} from "@/db/schema/placement-company-share-selection";
  + import {getDb} from "@/db/client";
  ```

## tests/unit/chat13-module-access-history-gap32.test.ts (1 failing)
- SA-tenants-modules-32 bulk history producer > SA-tenants-modules-32 records the actual applied student count and explicitly discloses a summary-audit failure

  ```
  AssertionError: expected 'import "server-only";\n\nimport { and…' to contain 'Review learner history.'
  - Expected
  + Received
  - Review learner history.
  + import "server-only";
  +
  + import { and, asc, eq, inArray, isNull, or } from "drizzle-orm";
  + import { z } from "zod";
  ```
