# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-teacher-report-assignment-contentid-submissions-coverage-01.test.ts (1 failing)
- UX-teacher-report-assignment-contentid-submissions-01 /teacher/report/assignment/[contentId]/submissions keeps access and honest feedback

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain 'aria-label="Submission grading filter…'
  - Expected
  + Received
  - aria-label="Submission grading filters"
  + import { Pagination } from "@/components/ui/pagination";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Input } from "@/components/ui/input";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/UX-tpo-batches-batchid-registrations-membershipid-history-01.test.ts (1 failing)
- UX-tpo-batches-batchid-registrations-membershipid-history-01 /tpo/batches/[batchId]/registrations/[membershipId]/history > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' not to match /min-h-(?:9|10)\b/
  - Expected:
  /min-h-(?:9|10)\b/
  + Received:
  "import {Button} from \"@/components/ui/button\";
  import {Select} from \"@/components/ui/select\";
  import {PageHeader} from \"@/components/ui/page-header\";
  import {Alert} from \"@/components/ui/alert\";
  ```

## tests/unit/UX-tpo-find-01.test.ts (1 failing)
- UX-tpo-find-01 /tpo/find > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' not to match /min-h-(?:9|10)\b/
  - Expected:
  /min-h-(?:9|10)\b/
  + Received:
  "import {Button} from \"@/components/ui/button\";
  import {Input} from \"@/components/ui/input\";
  import Link from \"next/link\";
  import {redirect} from \"next/navigation\";
  ```

## tests/unit/UX-tracker-shared-nav-02.test.ts (1 failing)
- UX-tracker-shared-nav-02 > announces the active page and supports focus/touch navigation without changing tracker wording

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

## tests/unit/chat11-college-project-summary-state.test.ts (1 failing)
- PROJ-BREAK-COL-SUMMARY-01 College Admin project editing > locks and rechecks the persisted college before CAS, writes audit and sends after transaction event

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' to contain 'requireProjectManageAccess(context,pr…'
  - Expected
  + Received
  - requireProjectManageAccess(context,projectId)
  + import "server-only";
  + import {and,eq,isNotNull,isNull,ne,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
  ```

## tests/unit/chat11-super-admin-module-impact-revocation.test.ts (3 failing)
- SA-tenants-modules-MOD-IMPACT-06 module disabling cannot leak or fabricate risk counts > explains valid Projects impact with nonnegative exact mentor count

  ```
  AssertionError: expected 'No active primary mentors were found.…' to contain '0 active primary-mentor assignments'
  Expected: "0 active primary-mentor assignments"
  Received: "No active primary mentors were found. This is not a safety check: review workspaces, learners, submissions and upcoming meetings before disabling Projects."
  ```
- SA-tenants-modules-MOD-IMPACT-06 module disabling cannot leak or fabricate risk counts > explains all three separate placement dimensions without merging populations

  ```
  AssertionError: expected 'Impact counts unavailable. Recheck th…' to contain '3 active drives'
  Expected: "3 active drives"
  Received: "Impact counts unavailable. Recheck this college before changing module access; this is not proof that disabling it is safe."
  ```
- SA-tenants-modules-MOD-IMPACT-06 module disabling cannot leak or fabricate risk counts > fails closed on missing, negative, fractional, nonfinite or unsafe counts

  ```
  AssertionError: expected 'Mentor-impact data is unavailable. Th…' to be 'Impact counts unavailable. Recheck th…' // Object.is equality
  Expected: "Impact counts unavailable. Recheck this college before changing module access."
  Received: "Mentor-impact data is unavailable. This does not mean disabling Projects is safe: check active workspaces, learner submissions and upcoming meetings before proceeding."
  ```
