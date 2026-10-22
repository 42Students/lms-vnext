# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat14-sprint-task-routes.test.ts (1 failing)
- Sprint and task mutating routes under Mentor account > PROJ-BREAK-MENTOR-344 malformed Sprint/task editor JSON cannot invoke a write

  ```
  AssertionError: expected 403 to be 400 // Object.is equality
  - Expected
  + Received
  - 400
  + 403
  ```

## tests/unit/PROJ-BREAK-chat9-template-detail-pages.test.tsx (1 failing)
- Super Admin last-third global template detail and version history security > PROJ-BREAK-ux-41 DB outage is not mistaken for absent template/version and never leaks exception content

  ```
  AssertionError: expected 'Template version comparison Template …' to contain 'Back to version history'
  Expected: "Back to version history"
  Received: "Template version comparison Template history unavailable The version comparison could not be loaded. No private version content is shown and rollback is disabled. /admin/projects/templates/11111111-1111-4111-8111-111111111111/versions#version-22222222-2222-4222-8222-222222222222"
  ```

## tests/unit/UX-college-college-contacts-01.test.ts (1 failing)
- UX-college-college-contacts-01 retains responsive forms, states and legacy copy

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { DateInput } from "@/components/ui/date-input";
  + import { Input } from "@/components/ui/input";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/UX-login-01.test.ts (1 failing)
- UX-login-01 secure OTP entry > provides phone-first bounded skeleton and public rather than dashboard-only error recovery

  ```
  AssertionError: expected '"use client";\n\nimport { GracefulErr…' to contain 'homeHref="/"'
  - Expected
  + Received
  - homeHref="/"
  + "use client";
  +
  + import { GracefulErrorBoundary } from "@/components/public/graceful-error-boundary";
  +
  ```

## tests/unit/UX-tpo-follow-ups-01.test.ts (1 failing)
- UX-tpo-follow-ups-01 /tpo/follow-ups > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' not to match /(?<![a-z-])min-h-(?:9|10)\b/
  - Expected:
  /(?<![a-z-])min-h-(?:9|10)\b/
  + Received:
  "import { Pagination } from \"@/components/ui/pagination\";
  import {Button} from \"@/components/ui/button\";
  import {Input} from \"@/components/ui/input\";
  import { tpoCrmTablesReady } from \"@/modules/placements/tpo-crm-storage-readiness\";
  ```

## tests/unit/chat11-super-admin-student-progress-revocation.test.ts (1 failing)
- SA-tenants-modules-COURSE-STUDENTS-10 private learner names survive revocation > reconstructs persisted Super Admin system role and locks active college after slow roster queries

  ```
  AssertionError: expected -1 to be greater than 10437
  ❯ tests/unit/chat11-super-admin-student-progress-revocation.test.ts:21:20
  19|   expect(sqlRead).toBeGreaterThan(-1);
  20|   expect(checked).toBeGreaterThan(sqlRead);
  21|   expect(response).toBeGreaterThan(checked);
  |                    ^
  22|   expect(source).toContain("if(!college||college.status!==\"ACTIVE\")"…
  23|   expect(source).toContain('if(!isSuperAdmin(live))throw new Authoriza…
  ```

## tests/unit/chat12-tpo-prep-assignment-persisted-role.test.ts (2 failing)
- TPO-students-10 preparation assignment current TPO permission boundary > preserves a second persisted actor lock inside the write transaction, before creating any notice

  ```
  AssertionError: expected -1 to be greater than -1
  ❯ tests/unit/chat12-tpo-prep-assignment-persisted-role.test.ts:59:17
  57|   const lock=src.indexOf('for("update").limit(1)',guard);
  58|   const notification=src.indexOf("await tx.insert(inAppNotifications)"…
  59|   expect(guard).toBeGreaterThan(tx);
  |                 ^
  60|   expect(lock).toBeGreaterThan(guard);
  61|   expect(notification).toBeGreaterThan(lock);
  ```
- TPO-students-10 preparation assignment current TPO permission boundary > TPO-students-10 optional deadline requires registered nullable storage and preserves the no-deadline state

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' to contain 'dueAt:z.iso.datetime({offset:true}).n…'
  - Expected
  + Received
  - dueAt:z.iso.datetime({offset:true}).nullable().optional()
  + import "server-only";
  + import {and,eq,inArray,isNull,sql} from "drizzle-orm";
  + import {tpoPrepAssignmentInputSchema} from "./tpo-prep-assignment-model";
  + import {summarizeTpoPrepAssignment} from "./tpo-prep-assignment-result-model";
  ```

## tests/unit/chat13-placement-admin-uncovered-services.test.ts (2 failing)
- Super Admin placements remaining service entrypoint checks > SA-COMPANY-EDIT-02 denies selected-college global mutations, stale versions and active duplicates

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' to contain 'lower('
  - Expected
  + Received
  - lower(
  + import "server-only";
  + import {and,eq,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {placementCompanies} from "@/db/schema";
  ```
- Super Admin placements remaining service entrypoint checks > SA-COMPANY-IDENTITIES-03 requires actual current global role and domain/alias uniqueness before writes

  ```
  AssertionError: expected 3 to be 2 // Object.is equality
  - Expected
  + Received
  - 2
  + 3
  ```
