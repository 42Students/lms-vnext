# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat6-college-placements-round2-verified.test.ts (1 failing)
- College placement verified operational parity > COL-placements-11 retention report and college student placement lookup are accessible

  ```
  AssertionError: expected 'import "server-only";\nimport {and,co…' to contain '.limit(200)'
  - Expected
  + Received
  - .limit(200)
  + import "server-only";
  + import {and,count,desc,eq,inArray,lt,notExists,or,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {collegeMemberships,placementApplications,placementApplicationScreenings,
  ```

## tests/unit/chat6-tracker-parity-round4.test.ts (2 failing)
- chat-6 tracker report and manager navigation parity > SA-placements-projects-104 supports shortcut submit, source-linked success and permission-scoped similar reports

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain '"/api/tracker/issues?"+query.toString…'
  - Expected
  + Received
  - "/api/tracker/issues?"+query.toString()
  + "use client";
  +
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  ```
- chat-6 tracker report and manager navigation parity > SA-placements-projects-112 exposes the legacy manager nav destinations with an accessible skip target

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'href="/tracker/issues"'
  - Expected
  + Received
  - href="/tracker/issues"
  + "use client";
  +
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  ```

## tests/unit/chat7-superadmin-courses-content-page-gates.test.ts (1 failing)
- Super Admin courses and content page-level scope, recovery and mobile access gates > SA-academics-people-67 progress directory and per-student details keep scoped recovery and export parity

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Unable to read course progress'
  - Expected
  + Received
  - Unable to read course progress
  + import Link from "next/link";
  + import {DataTable} from "@/components/ui/data-table";
  + import {EmptyState} from "@/components/ui/empty-state";
  + import {redirect} from "next/navigation";
  ```

## tests/unit/chat9-round9-public-audit.test.ts (1 failing)
- chat9 public page, signature and audit evidence > TPO-settings-audit-97 escapes formula-leading clipboard cells and exposes explicit copy selection

  ```
  AssertionError: expected '"use client";\nimport { Checkbox } fr…' to contain 'Select all visible rows'
  - Expected
  + Received
  - Select all visible rows
  + "use client";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  ```
