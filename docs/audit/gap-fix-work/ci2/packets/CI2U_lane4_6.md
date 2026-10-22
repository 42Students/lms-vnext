# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-published-drive-edit.test.ts (3 failing)
- Super Admin published drive editing > SA-placements-projects-13 validates published edits and rejects invalid compensation

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
- Super Admin published drive editing > SA-placements-projects-13 enforces selected-college and optimistic version locks

  ```
  AssertionError: expected 'import "server-only";\nimport {and,co…' to contain 'job.status!=="PUBLISHED"'
  - Expected
  + Received
  - job.status!=="PUBLISHED"
  + import "server-only";
  + import {and,count,eq,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {placementApplications,placementJobs,placementJobRoleOptions,placementSeasons,placementCompanyRelationships} from "@/db/schema";
  ```
- Super Admin published drive editing > SA-placements-projects-13 uses guarded form and IST-aware deadline

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'Existing applications and offer decis…'
  - Expected
  + Received
  - Existing applications and offer decisions remain unchanged.
  + "use client";
  + import {useEffect,useRef,useState,type FormEvent} from "react";
  + import {useRouter} from "next/navigation";
  + import {Input} from "@/components/ui/input";
  ```

## tests/unit/chat13-superadmin-gap-register-reconcile-a.test.ts (4 failing)
- chat-13 Super Admin source reconciliation — placements and academic legacy > SA-academics-people-R03 preserves the verified source behavior

  ```
  AssertionError: expected 'import {superAdminItems} from "@/comp…' to contain 'return null; // Never forge nested IDs'
  - Expected
  + Received
  - return null; // Never forge nested IDs
  + import {superAdminItems} from "@/components/shell/shell-model";
  + import {SUPER_ADMIN_LEGACY_GROUPS} from "@/modules/people/super-admin-legacy-tabs-model";
  +
  + const projectsGroup=SUPER_ADMIN_LEGACY_GROUPS.find(group=>group.title==="Projects");
  ```
- chat-13 Super Admin source reconciliation — placements and academic legacy > SA-academics-people-R05 preserves the verified source behavior

  ```
  AssertionError: expected '"use client";\n\nimport { ADMIN_ATTEN…' to contain '<Drawer'
  - Expected
  + Received
  - <Drawer
  + "use client";
  +
  + import { ADMIN_ATTENDANCE_COPY } from "@/modules/attendance/admin-attendance-copy";
  + import {AdminAttendanceParentContactEditor} from "./admin-attendance-parent-contact-editor";
  ```
- chat-13 Super Admin source reconciliation — placements and academic legacy > SA-placements-projects-27 preserves the verified source behavior

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'Domain belongs to another company.'
  - Expected
  + Received
  - Domain belongs to another company.
  + import "server-only";
  + import {and,asc,eq,ilike,inArray,ne} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```
- SA-placements-projects-30 deliberate global/college boundary > SA-placements-projects-30 keeps global employer edits global but supports authorized college relationship creation and lifecycle

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' to contain 'isGlobalCompanyScope(context.adminSco…'
  - Expected
  + Received
  - isGlobalCompanyScope(context.adminScope)
  + import "server-only";
  + import {and,eq,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {placementCompanies} from "@/db/schema";
  ```

## tests/unit/chat15-assessment-server-course-filter.test.ts (2 failing)
- LEARNER-learning-misc-15 authenticated server-side course filtering > LEARNER-learning-misc-15 narrows SQL to authorized delivery IDs before assignment and quiz scans

  ```
  AssertionError: expected 'import {z} from "zod";\nimport type {…' to contain 'deliveries.filter(row=>row.courseId==…'
  - Expected
  + Received
  - deliveries.filter(row=>row.courseId===selectedCourseId)
  + import {z} from "zod";
  + import type { RequestContext } from "@/modules/identity/context";
  + import {and,eq,inArray} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  ```
- LEARNER-learning-misc-15 authenticated server-side course filtering > LEARNER-learning-misc-15 retains URL-backed course filter for both assessment pages

  ```
  AssertionError: expected 'import { Suspense } from "react";\nim…' to contain 'courseId:query.course'
  - Expected
  + Received
  - courseId:query.course
  + import { Suspense } from "react";
  + import Link from "next/link";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  + import { CoursesServiceError } from "@/modules/courses/errors";
  ```

## tests/unit/chat15-unconfirmed-decisions.test.ts (3 failing)
- chat-15 evidence-based UNCONFIRMED decisions > LEARNER-home-courses-01 deliberately preserves a multi-role dashboard and a dedicated learner courses link

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Workspace dashboard'
  - Expected
  + Received
  - Workspace dashboard
  + import Link from "next/link";
  + import {getSuperAdminCollegeAtGlance} from "@/modules/colleges/admin-college-at-glance-service";
  + import {CollegeAtGlancePanel} from "@/components/admin/college-at-glance-panel";
  + import {getSuperAdminTodayBoard} from "@/modules/colleges/admin-today-attention-service";
  ```
- chat-15 evidence-based UNCONFIRMED decisions > LEARNER-placements-16 renders true disclosure placeholders, posted date and application status

  ```
  AssertionError: expected '"use client";\n\nimport { useRef, use…' to contain 'Not specified'
  - Expected
  + Received
  - Not specified
  + "use client";
  +
  + import { useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```
- chat-15 evidence-based UNCONFIRMED decisions > LEARNER-placements-39 does not synthesize blocked exam dates when only round data exists

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'careerCalendarEvents(rounds)'
  - Expected
  + Received
  - careerCalendarEvents(rounds)
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { CalendarGrid } from "@/components/ui/calendar-grid";
  + import calendarStyles from "./legacy-calendar-theme.module.css";
  ```

## tests/unit/chat16-inbound-mail-route-11.test.ts (1 failing)
- chat-16 private inbound-mail mutation route break-it tests > HR-BREAK-INBOUND-ROUTE-03 maps stale tab without pretending the write succeeded

  ```
  AssertionError: expected 403 to be 409 // Object.is equality
  - Expected
  + Received
  - 409
  + 403
  ```

## tests/unit/chat16-provider-channel-boundaries-07.test.ts (1 failing)
- chat-16 generic campaign and recruiter email channel fail-closed behavior > MSG-CHANNEL-FAIL-04 a failed email does not throw, a successful acknowledgement uses a single POST

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
