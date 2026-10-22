# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat2-tpo-recruiter-stale-refresh.test.ts (2 failing)
- TPO Engage stale snapshot resilience > TPO-recruiters-42 preserves recruiter rows on reload failure and offers Retry

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'onClick={()=>void load()}>Retry</butt…'
  - Expected
  + Received
  - onClick={()=>void load()}>Retry</button>
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Tabs } from "@/components/ui/tabs";
  + import { FilterChip } from "@/components/ui/filter-chip";
  ```
- TPO Engage stale snapshot resilience > TPO-recruiters-42 keeps company snapshot while showing a separate recoverable warning

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain '>Retry companies</button>'
  - Expected
  + Received
  - >Retry companies</button>
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Tabs } from "@/components/ui/tabs";
  + import { FilterChip } from "@/components/ui/filter-chip";
  ```

## tests/unit/chat3-college-round12-parity-contracts.test.ts (4 failing)
- chat-3 college people and attendance source contract audit > COL-people-20 college admin role can be changed only by super admin

  ```
  AssertionError: expected 'import { MEMBERSHIP_ROLE_LABELS, type…' to contain 'if (input.role === "COLLEGE_ADMIN")'
  - Expected
  + Received
  - if (input.role === "COLLEGE_ADMIN")
  + import { MEMBERSHIP_ROLE_LABELS, type MembershipRole } from "@/modules/identity/constants";
  + import type { RequestContext } from "@/modules/identity/context";
  + import { requirePermission } from "@/modules/permissions/policy";
  + import { PeopleServiceError } from "./errors";
  ```
- chat-3 college people and attendance source contract audit > COL-people-26 faculty lifecycle confirms persisted action

  ```
  AssertionError: expected '"use client";\n\nimport { Input } fro…' to contain 'Faculty suspended.'
  - Expected
  + Received
  - Faculty suspended.
  + "use client";
  +
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  ```
- chat-3 college people and attendance source contract audit > COL-attendance-05 successful attendance corrections are announced

  ```
  AssertionError: expected '"use client";\n\nimport { ADMIN_ATTEN…' to contain 'Attendance corrected for '
  - Expected
  + Received
  - Attendance corrected for
  + "use client";
  +
  + import { ADMIN_ATTENDANCE_COPY } from "@/modules/attendance/admin-attendance-copy";
  + import {AdminAttendanceParentContactEditor} from "./admin-attendance-parent-contact-editor";
  ```
- chat-3 college people and attendance source contract audit > COL-attendance-12 day-wise attendance CSV preserves discrete mark codes

  ```
  AssertionError: expected '"use client";\n\nimport { ADMIN_ATTEN…' to contain 'sessionDays.map(row=>row.day)'
  - Expected
  + Received
  - sessionDays.map(row=>row.day)
  + "use client";
  +
  + import { ADMIN_ATTENDANCE_COPY } from "@/modules/attendance/admin-attendance-copy";
  + import {AdminAttendanceParentContactEditor} from "./admin-attendance-parent-contact-editor";
  ```

## tests/unit/chat3-sa-people-directory-strict-url-ssr.test.tsx (2 failing)
- SA-PEOPLE-DIRECTORY-QUERY-02 validated directory links > shows actionable invalid filters without reading a selected college for repeated/unknown keys

  ```
  AssertionError: expected "vi.fn()" to not be called at all, but actually been called 7 times
  Received:
  1st vi.fn() call:
  Array []
  2nd vi.fn() call:
  Array []
  3rd vi.fn() call:
  Array []
  ```
- SA-PEOPLE-DIRECTORY-QUERY-02 validated directory links > honors normal same-college query and masked contact empty state

  ```
  AssertionError: expected '<div class="min-w-0 space-y-[var(--lm…' to contain 'No matching users'
  - Expected
  + Received
  - No matching users
  + <div class="min-w-0 space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-
  ```

## tests/unit/chat4-college-bulk-import-grammar.test.ts (1 failing)
- Super Admin college bulk import adversarial input grammar > SA-colleges-bulk-input-03 rejects duplicate codes independent of case and enforces row cap

  ```
  AssertionError: expected [Function] to throw error including 'Duplicate college code' but got 'Row 3: duplicate college code code (f…'
  Expected: "Duplicate college code"
  Received: "Row 3: duplicate college code code (first used on line 2)."
  ```

## tests/unit/chat4-college-tenant-model-ledger.test.ts (3 failing)
- college/tenant directory module coverage ledger > parseAdminDirectorySearchParams refuses duplicates, unknown keys, malformed pages, recovers default

  ```
  AssertionError: expected { q: '', page: 1, pageSize: 10 } to deeply equal { q: '', page: 1, pageSize: 25 }
  - Expected
  + Received
  {
  "page": 1,
  -   "pageSize": 25,
  +   "pageSize": 10,
  "q": "",
  ```
- college/tenant directory module coverage ledger > tenantLifecyclePaging clamps pages and rejects out-of-range filters

  ```
  AssertionError: expected { total: 45, totalPages: 2, …(2) } to deeply equal { total: 45, totalPages: 3, …(2) }
  - Expected
  + Received
  {
  -   "offset": 40,
  -   "page": 3,
  +   "offset": 25,
  +   "page": 2,
  ```
- college/tenant directory module coverage ledger > admin colleges/organizations pages render guarded scopes, mobile actions and friendly malformed-query recovery

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'parseAdminDirectorySearchParams(await…'
  - Expected
  + Received
  - parseAdminDirectorySearchParams(await searchParams)
  + import {Button} from "@/components/ui/button";
  + import {inArray,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {collegeMemberships} from "@/db/schema";
  ```

## tests/unit/chat4-people-contacts-ledger.test.ts (1 failing)
- chat-4 college people/contact privacy and directory coverage > collegeContactsQuerySchema and parser reject duplicated, unknown, tenant forged, malformed page and alphabet

  ```
  AssertionError: expected { tab: 'ALL', q: '', …(15) } to match object { tab: 'ALL', page: 1, …(2) }
  (13 matching properties omitted from actual)
  - Expected
  + Received
  {
  "page": 1,
  -   "pageSize": 20,
  +   "pageSize": 10,
  ```
