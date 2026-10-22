# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat6-cross-page-verification-round4.test.ts (1 failing)
- chat-6 cross-page gap source verification > COL-placements-20 provides drive-scoped interview scheduling, statuses and calendar download

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'href={"data:text/calendar;charset=utf…'
  - Expected
  + Received
  - href={"data:text/calendar;charset=utf-8,"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import Link from "next/link";
  + import {useToast} from "@/components/ui/toast";
  ```

## tests/unit/chat7-college-content-authoring-weak.test.ts (3 failing)
- COURSES-WEAK-CONTENT-AUTHORING-01 tenant, stage and private link boundaries > Super Admin resolves acting college scope instead of trusting membership's stale college

  ```
  TypeError: db.select(...).from(...).innerJoin(...).innerJoin(...).innerJoin(...).innerJoin(...).innerJoin(...).where(...).orderBy(...).limit(...).offset is not a function
  ❯ Module.getCollegeContentAuthoringOptions src/modules/courses/college-content-authoring-service.ts:128:21
  126|  .where(and(...where))
  127|  .orderBy(asc(courseLessons.name),asc(lessonContents.sequence),asc(les…
  128|  .limit(pageSize+1).offset((page-1)*pageSize);
  |                     ^
  129|  const positions=lessons.length?await db.select({lessonId:lessonConten…
  130|   .from(lessonContents).where(inArray(lessonContents.lessonId,lessons.…
  ```
- COURSES-WEAK-CONTENT-AUTHORING-01 tenant, stage and private link boundaries > never exposes published external playback URL in metadata editor while retaining editable drafts

  ```
  TypeError: db.select(...).from(...).innerJoin(...).innerJoin(...).innerJoin(...).innerJoin(...).innerJoin(...).where(...).orderBy(...).limit(...).offset is not a function
  ❯ Module.getCollegeContentAuthoringOptions src/modules/courses/college-content-authoring-service.ts:128:21
  126|  .where(and(...where))
  127|  .orderBy(asc(courseLessons.name),asc(lessonContents.sequence),asc(les…
  128|  .limit(pageSize+1).offset((page-1)*pageSize);
  |                     ^
  129|  const positions=lessons.length?await db.select({lessonId:lessonConten…
  130|   .from(lessonContents).where(inArray(lessonContents.lessonId,lessons.…
  ```
- COURSES-WEAK-CONTENT-AUTHORING-01 tenant, stage and private link boundaries > honestly flags truncated content list at 250 and never includes >250 records

  ```
  TypeError: db.select(...).from(...).innerJoin(...).innerJoin(...).innerJoin(...).innerJoin(...).innerJoin(...).where(...).orderBy(...).limit(...).offset is not a function
  ❯ Module.getCollegeContentAuthoringOptions src/modules/courses/college-content-authoring-service.ts:128:21
  126|  .where(and(...where))
  127|  .orderBy(asc(courseLessons.name),asc(lessonContents.sequence),asc(les…
  128|  .limit(pageSize+1).offset((page-1)*pageSize);
  |                     ^
  129|  const positions=lessons.length?await db.select({lessonId:lessonConten…
  130|   .from(lessonContents).where(inArray(lessonContents.lessonId,lessons.…
  ```

## tests/unit/chat7-superadmin-student-progress-export-boundary.test.ts (1 failing)
- SA-academics-people-67 course-progress students export boundary > passes only one requested offering ID with the live Super Admin scope, and escapes formula-like learner names

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/chat9-super-admin-placement-source-reconciliation.test.ts (7 failing)
- Super Admin Placements documented parity and owner-accepted navigation > SA-placements-projects-04 restores the legacy Drives landing and no-college wording

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Drives is college-scoped.'
  - Expected
  + Received
  - Drives is college-scoped.
  + import Link from "next/link";
  + import { listPlatformPlacementPolicy } from "@/modules/placements/platform-placement-policy-service";
  + import { SuperAdminPlatformPlacementPolicy } from "@/components/placements/super-admin-platform-placement-policy";
  + import { SuperAdminPlacementOversightNav } from "@/components/admin/super-admin-placement-oversight-nav";
  ```
- Super Admin Placements documented parity and owner-accepted navigation > SA-placements-projects-16 links a missing active season to the manager instead of crashing

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useState…' to contain 'disabled={pending || !activeSeason ||…'
  - Expected
  + Received
  - disabled={pending || !activeSeason || uncertainCreate}
  + "use client";
  +
  + import {
  +   useState,
  ```
- Super Admin Placements documented parity and owner-accepted navigation > SA-placements-projects-24 implements global Verified by 42 with a not-verified filter

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain '<SuperAdminCompanyVerification'
  - Expected
  + Received
  - <SuperAdminCompanyVerification
  + import {Button} from "@/components/ui/button";
  + import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
  + import {Banner} from "@/components/ui/banner";
  + import type {AdminCompanyRow} from "@/modules/placements/admin-company-directory-model";
  ```
- Super Admin Placements documented parity and owner-accepted navigation > SA-placements-projects-26 implements globally scoped Edit company with a confirmed API write

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain '<SuperAdminCompanyEdit'
  - Expected
  + Received
  - <SuperAdminCompanyEdit
  + import {Button} from "@/components/ui/button";
  + import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
  + import {Banner} from "@/components/ui/banner";
  + import type {AdminCompanyRow} from "@/modules/placements/admin-company-directory-model";
  ```
- Super Admin Placements documented parity and owner-accepted navigation > SA-placements-projects-27 maintains company domains with removal guard and provider-side authorization

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain '<SuperAdminCompanyIdentities'
  - Expected
  + Received
  - <SuperAdminCompanyIdentities
  + import {Button} from "@/components/ui/button";
  + import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
  + import {Banner} from "@/components/ui/banner";
  + import type {AdminCompanyRow} from "@/modules/placements/admin-company-directory-model";
  ```
- Super Admin Placements documented parity and owner-accepted navigation > SA-placements-projects-36 uses recruiter accounts and readable Active or Suspended status labels

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useRef,\…' to contain '"Active":"Disabled"'
  - Expected
  + Received
  - "Active":"Disabled"
  + "use client";
  +
  + import {
  +   useRef,
  ```
- Super Admin Placements documented parity and owner-accepted navigation > SA-placements-projects-50 provides one canonical Interviews link and collapses additional reports

  ```
  AssertionError: expected '"use client";\n\nimport { usePathname…' to contain '<details'
  - Expected
  + Received
  - <details
  + "use client";
  +
  + import { usePathname } from "next/navigation";
  + import Link from "next/link";
  ```
