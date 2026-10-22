# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-tpo-audit-01.test.ts (1 failing)
- UX-tpo-audit-01 /tpo/audit > preserves legacy UI while applying signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' not to contain 'text-on-primary'
  - Expected
  + Received
  - text-on-primary
  + import { DateInput } from "@/components/ui/date-input";
  + import { StatTile } from "@/components/ui/stat-tile";
  + import tpoTileStyles from "@/components/placements/legacy-tpo-report-stats.module.css";
  + import { Tabs } from "@/components/ui/tabs";
  ```

## tests/unit/UX-tpo-companies-archived-01.test.ts (1 failing)
- UX-tpo-companies-archived-01 /tpo/companies/archived > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to match /min-h-(?:9|10)\b/
  - Expected:
  /min-h-(?:9|10)\b/
  + Received:
  "import Link from \"next/link\";
  import { redirect } from \"next/navigation\";
  import { getCurrentRequestContext } from \"@/auth/request-context\";
  import { requireTpoBatchActor } from \"@/modules/placements/tpo-batch-workspace-read-service\";
  ```

## tests/unit/UX-tpo-notifications-01.test.ts (1 failing)
- UX-tpo-notifications-01 /tpo/notifications > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import {TpoNotificationRefresh} from "@/components/tpo/tpo-notification-refresh";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/api-origin-guard.test.ts (2 failing)
- state-changing API routes > every POST/PUT/PATCH/DELETE handler checks the request origin

  ```
  AssertionError: Handlers that change state without a same-origin check:
  src/app/api/admin/colleges/[collegeId]/subdomain/route.ts POST
  src/app/api/admin/colleges/[collegeId]/subdomain/route.ts PUT
  src/app/api/admin/colleges/[collegeId]/subdomain/route.ts DELETE
  src/app/api/attendance/faculty/sessions/[scheduleEventId]/route.ts POST
  src/app/api/auth/legacy/otp/start/route.ts POST
  src/app/api/auth/session/route.ts POST
  src/app/api/college/batches/[cohortId]/route.ts PUT
  ```
- state-changing API routes > GET handlers never write (no insert/update/delete service call by name)

  ```
  AssertionError: GET handlers that appear to call a mutating service:
  src/app/api/courses/deliveries/[deliveryId]/assignments/[assignmentId]/resources/[resourceId]/url/route.ts GET
  src/app/api/notifications/stream/route.ts GET
  src/app/api/placements/jobs/[jobId]/eligibility/[membershipId]/route.ts GET
  src/app/api/placements/learner/jobs/[jobId]/job-description/route.ts GET: expected [ …(4) ] to deeply equal []
  - Expected
  + Received
  - []
  ```

## tests/unit/chat11-final-TPO-settings-audit-07.test.ts (1 failing)
- TPO final sprint settings navigation > TPO-settings-audit-07 preserves distinct legacy sections without losing active-page navigation

  ```
  AssertionError: expected [ 'Placement policy', 'People' ] to deeply equal [ 'Placement policy', 'People', …(1) ]
  - Expected
  + Received
  [
  "Placement policy",
  "People",
  -   "Students and companies",
  ]
  ```

## tests/unit/chat11-super-admin-tenant-route-guard.test.ts (1 failing)
- SA-tenants-modules-SEC-01: never render admin filter recovery before authorization > authenticates every route before handling hostile and repeated query parameters

  ```
  AssertionError: src/app/(authenticated)/admin/tenants/page.tsx: expected -1 to be greater than -1
  ❯ tests/unit/chat11-super-admin-tenant-route-guard.test.ts:57:22
  55|    const whitespace=source.indexOf("if (!parsed");
  56|    const recovery=[invalid,invalidNoSpace,whitespace].filter(index=>in…
  57|    expect(auth,file).toBeGreaterThan(-1);
  |                      ^
  58|    expect(recovery.length,file).toBeGreaterThan(0);
  59|    expect(auth,file).toBeLessThan(Math.min(...recovery));
  ```
