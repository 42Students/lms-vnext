# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat15-calendar-page-85.test.tsx (2 failing)
- HR-CALENDAR-PAGE-85: recruiter role, malformed query and safe empty schedule > duplicate filter keys reject before reading private schedules

  ```
  AssertionError: expected '  Calendar    Invalid calendar filter…' to contain 'Clear filters'
  Expected: "Clear filters"
  Received: "  Calendar    Invalid calendar filters Review the selected date, view and event filters.   "
  ```
- HR-CALENDAR-PAGE-85: recruiter role, malformed query and safe empty schedule > authorized empty week shows zero event counts without inventing an interview or result

  ```
  AssertionError: expected "vi.fn()" to be called with arguments: [ { user: { …(4) }, …(2) }, …(1) ]
  Received:
  1st vi.fn() call:
  @@ -22,10 +22,11 @@
  "identityUid": "uid",
  "platformStatus": "ACTIVE",
  "systemRoles": [],
  },
  ```

## tests/unit/PROJ-BREAK-chat9-template-college-page.test.tsx (1 failing)
- Super Admin Projects template colleges: resilient, scoped and bounded page states > PROJ-BREAK-ux-37 authorized empty catalogue is distinct from a service error

  ```
  AssertionError: expected '← Back to templates /admin/projects/t…' to contain 'No matching colleges'
  Expected: "No matching colleges"
  Received: "← Back to templates /admin/projects/templates IIT Dharwad Select the colleges that can use this template. Scope: active colleges accessible to the selected Super Admin. Existing workspaces retain their pinned template version when availability changes. College name or code Availability AL
  ```

## tests/unit/chat-3-graceful-pages.test.ts (1 failing)
- Chat-3 graceful-operation coverage for touched pages > GR-90 no raw error code in corrected attendance alert and course load error summary

  ```
  AssertionError: expected 'import type { HTMLAttributes, ReactNo…' to contain 'role={role ?? (tone === "error" ? "al…'
  - Expected
  + Received
  - role={role ?? (tone === "error" ? "alert" : "status")}
  + import type { HTMLAttributes, ReactNode } from "react";
  + import { cx } from "@/lib/class-names";
  +
  + export type AlertTone = "info" | "success" | "warning" | "error";
  ```

## tests/unit/chat13-admin-first-third-audit.test.ts (4 failing)
- chat-13 Super Admin /admin first-third route source audit > UX-admin-first--admin-colleges-[collegeId]-subdomain requires authenticated context and no raw unresponsive tables

  ```
  AssertionError: expected 'import { Suspense } from "react";\nim…' not to match /target=(?:\"|')_blank(?:\"|')/
  - Expected:
  /target=(?:\"|')_blank(?:\"|')/
  + Received:
  "import { Suspense } from \"react\";
  import { notFound } from \"next/navigation\";
  import { getCurrentRequestContext } from \"@/auth/request-context\";
  import { PageHeader } from \"@/components/ui/page-header\";
  ```
- chat-13 Super Admin /admin first-third route source audit > UX-admin-first--admin-companies requires authenticated context and no raw unresponsive tables

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' not to match /target=(?:\"|')_blank(?:\"|')/
  - Expected:
  /target=(?:\"|')_blank(?:\"|')/
  + Received:
  "import {Button} from \"@/components/ui/button\";
  import {DataTable,type DataTableColumn} from \"@/components/ui/data-table\";
  import {Banner} from \"@/components/ui/banner\";
  import type {AdminCompanyRow} from \"@/modules/placements/admin-company-directory-model\";
  ```
- chat-13 Super Admin /admin first-third route source audit > SA-ADMIN-FIRST-03 preserves data-safe college resource not-found and archived parent guidance

  ```
  AssertionError: expected 'import Link from "next/link";\n\nimpo…' to contain 'error.code==="COLLEGE_NOT_FOUND") not…'
  - Expected
  + Received
  - error.code==="COLLEGE_NOT_FOUND") notFound()
  + import Link from "next/link";
  +
  + import { collegeIdSchema } from "@/modules/colleges/validation";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  ```
- chat-13 Super Admin /admin first-third route source audit > SA-ADMIN-FIRST-04 fails closed on malformed employer searches and impossible selected-college filters

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'adminCompaniesQuerySchema.safeParse('
  - Expected
  + Received
  - adminCompaniesQuerySchema.safeParse(
  + import {Button} from "@/components/ui/button";
  + import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
  + import {Banner} from "@/components/ui/banner";
  + import type {AdminCompanyRow} from "@/modules/placements/admin-company-directory-model";
  ```
