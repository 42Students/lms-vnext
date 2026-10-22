# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-SA-admin-pages-and-scope.test.ts (1 failing)
- Super Admin Projects and Placements page routes — independent security and UX audit > PROJ-BREAK-SA-15 audits every live /admin placement/project page for auth or scope-enforcing delegate

  ```
  AssertionError: src/app/(authenticated)/admin/placements/calendar/appointments/page.tsx: expected 'import Link from "next/link";\nimport…' not to match /<table(?:\s|>)/
  - Expected:
  /<table(?:\s|>)/
  + Received:
  "import Link from \"next/link\";
  import { getCurrentRequestContext } from \"@/auth/request-context\";
  import { listSuperAdminCalendarAppointments } from \"@/modules/placements/super-admin-calendar-appointment-directory\";
  import { PageHeader } from \"@/components/ui/page-header\";
  ```

## tests/unit/UX-chat15-shell-activity-components-01.test.ts (1 failing)
- UX-chat15-shell-activity-components-01 > UX-shell-mobile-navigation-01 opens a true accessible navigation overlay with Escape and focus trap

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'h-11 w-11'
  - Expected
  + Received
  - h-11 w-11
  + "use client";
  +
  + import { useEffect, useState } from "react";
  + import { usePathname } from "next/navigation";
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

## tests/unit/chat13-super-admin-history-modal-ux.test.ts (2 failing)
- SA-ADMIN-HISTORY-MODAL-10 accessible college import history > restores focus after Close or native Escape, and maintains modal focus trapping

  ```
  AssertionError: expected '"use client";\n\nimport { useState } …' to contain 'bodyClassName="min-w-0"'
  - Expected
  + Received
  - bodyClassName="min-w-0"
  + "use client";
  +
  + import { useState } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- SA-ADMIN-HISTORY-MODAL-10 accessible college import history > uses one vertical modal scroller and leaves horizontal table scrolling to the shared DataTable

  ```
  AssertionError: expected '"use client";\n\nimport { useState } …' to contain 'className="max-w-[640px]" bodyClassNa…'
  - Expected
  + Received
  - className="max-w-[640px]" bodyClassName="min-w-0"
  + "use client";
  +
  + import { useState } from "react";
  + import { Button } from "@/components/ui/button";
  ```
