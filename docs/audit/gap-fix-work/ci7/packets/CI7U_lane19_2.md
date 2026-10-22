# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat2-final-sprint-conversations-b.test.ts (1 failing)
- Final sprint recruiter conversation parity — group B > REC-calendar-messages-profile-11 exposes in-place general conversation with history and reply

  ```
  AssertionError: expected 'import inboxStyles from "@/components…' to contain 'Open general conversation'
  - Expected
  + Received
  - Open general conversation
  + import inboxStyles from "@/components/hr/recruiter-conversations-legacy.module.css";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import { Tabs } from "@/components/ui/tabs";
  ```

## tests/unit/chat3-sa-faculty-assignments-tenant-pages.test.ts (3 failing)
- SA3-FAC-ASSIGNMENTS-01 scoped assignment directory and facets > limits assignment joins to one college and a Section matching the course offering cohort and term

  ```
  TypeError: db.select(...).from(...).orderBy is not a function
  ❯ Module.listAdminFacultyAssignments src/modules/admin-ui/super-admin-faculty-assignments-service.ts:139:4
  137|    deliveryId:sql<string>`"admin_faculty_assignment_directory"."admin_…
  138|  }).from(source)
  139|   .orderBy(desc(sql<string>`"admin_faculty_assignment_directory"."admi…
  |    ^
  140|   .limit(query.pageSize).offset((page-1)*query.pageSize);
  141|  const format=(value:Date)=>new Intl.DateTimeFormat("en-IN",{dateStyle…
  ```
- SA3-FAC-ASSIGNMENTS-01 scoped assignment directory and facets > clamps stale deep links to the current final page after a Faculty assignment was removed

  ```
  TypeError: db.select(...).from(...).orderBy is not a function
  ❯ Module.listAdminFacultyAssignments src/modules/admin-ui/super-admin-faculty-assignments-service.ts:139:4
  137|    deliveryId:sql<string>`"admin_faculty_assignment_directory"."admin_…
  138|  }).from(source)
  139|   .orderBy(desc(sql<string>`"admin_faculty_assignment_directory"."admi…
  |    ^
  140|   .limit(query.pageSize).offset((page-1)*query.pageSize);
  141|  const format=(value:Date)=>new Intl.DateTimeFormat("en-IN",{dateStyle…
  ```
- SA3-FAC-ASSIGNMENTS-01 scoped assignment directory and facets > does not invent a page or incorrectly fetch off-page data from an empty college

  ```
  TypeError: db.select(...).from(...).orderBy is not a function
  ❯ Module.listAdminFacultyAssignments src/modules/admin-ui/super-admin-faculty-assignments-service.ts:139:4
  137|    deliveryId:sql<string>`"admin_faculty_assignment_directory"."admin_…
  138|  }).from(source)
  139|   .orderBy(desc(sql<string>`"admin_faculty_assignment_directory"."admi…
  |    ^
  140|   .limit(query.pageSize).offset((page-1)*query.pageSize);
  141|  const format=(value:Date)=>new Intl.DateTimeFormat("en-IN",{dateStyle…
  ```

## tests/unit/chat4-super-admin-tenants-modules-gap-closure.test.ts (2 failing)
- chat-4 Super Admin Tenants and Modules verified source contracts > SA-tenants-modules-61 preserves the audited admin workflow

  ```
  AssertionError: expected 'import {z} from "zod";\nexport const …' to contain '.max(8000)'
  - Expected
  + Received
  - .max(8000)
  + import {z} from "zod";
  + export const superAdminCollegeBroadcastSchema=z.strictObject({
  +  audienceMode:z.enum(["ALL_COLLEGES","SELECTED_COLLEGES"]),
  +  collegeIds:z.array(z.uuid()).max(500),
  ```
- chat-4 Super Admin Tenants and Modules verified source contracts > SA-tenants-modules-43 shows actor sentences and sanitized event details

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Object.entries(item.event.metadata)'
  - Expected
  + Received
  - Object.entries(item.event.metadata)
  + import Link from "next/link";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Fragment,type ReactNode} from "react";
  + import { StatusBadge } from "@/components/ui/status-badge";
  ```

## tests/unit/chat6-admin-second-third-people-inbound.test.ts (1 failing)
- /admin second third: inbound mail and People directory behavioral boundaries > CHAT6-ADMIN-INBOUND-01 validates inbox filters, refuses duplicate/privileged input and caps search

  ```
  AssertionError: {"status":"DELETED"}: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
