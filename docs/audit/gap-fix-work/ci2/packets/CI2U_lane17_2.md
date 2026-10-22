# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-admin-settings-partial-outages.test.tsx (2 failing)
- Super Admin last-third Tenant Settings: safe scope and dependency failures > UX-admin-settings-22 disabled/college-only roles cannot fetch global inventory or editor controls

  ```
  AssertionError: expected 'Tenant Settings Tenant settings acces…' to contain 'Back to dashboard'
  Expected: "Back to dashboard"
  Received: "Tenant Settings Tenant settings access denied Your account cannot access privileged tenant settings. /dashboard"
  ```
- Super Admin last-third Tenant Settings: safe scope and dependency failures > UX-admin-settings-25 editor failure cannot hide effective settings inventory

  ```
  AssertionError: expected 'Tenant Settings Inventory of effectiv…' to contain 'Tenant settings editor is temporarily…'
  Expected: "Tenant settings editor is temporarily unavailable."
  Received: "Tenant Settings Inventory of effective source limits and college policy values. Attendance settings can be edited for the selected college. Runtime configuration One college Settings with explicit execution scope These values are not an inheritance tree: each backend reader asks for one e
  ```

## tests/unit/PROJ-BREAK-chat9-sa-students-page.test.tsx (2 failing)
- Super Admin last-third student registration and bulk import states > SA-students-ux-17 each failed policy/import read hides all registration actions

  ```
  AssertionError: expected 'Students Manage student identity, aca…' to contain 'Student register unavailable'
  Expected: "Student register unavailable"
  Received: "Students Manage student identity, academic placement and account access from one roster. Account access and support The legacy Impersonate action is retired. This membership-based workspace does not exchange Super Admin tokens for a learner session or replace active session credentials. U
  ```
- Super Admin last-third student registration and bulk import states > SA-students-ux-19 complete selected-college reads enable authorized controls

  ```
  AssertionError: expected 'Students Manage student identity, aca…' to contain 'Bulk Register Students'
  Expected: "Bulk Register Students"
  Received: "Students Manage student identity, academic placement and account access from one roster. Account access and support The legacy Impersonate action is retired. This membership-based workspace does not exchange Super Admin tokens for a learner session or replace active session credentials. U
  ```

## tests/unit/UX-activity-event-detail-01.test.ts (1 failing)
- UX-activity-event-detail-01 > uses shared cards, IST machine timestamps and a contained metadata panel

  ```
  AssertionError: expected 'import { notFound, redirect } from "n…' to contain '<Card as="section"'
  - Expected
  + Received
  - <Card as="section"
  + import { notFound, redirect } from "next/navigation";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  ```

## tests/unit/UX-chat7-resource-material-touch-10.test.ts (2 failing)
- UX-LEARN-RESOURCE-10 mobile and keyboard resource material workflow > keeps all interactive material inputs and actions at least 44px high

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'className="inline-flex min-h-11 items…'
  - Expected
  + Received
  - className="inline-flex min-h-11 items-center text-xs font-semibold text-primary-text underline">Open link
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { Textarea } from "@/components/ui/textarea";
  +
  ```
- UX-LEARN-RESOURCE-10 mobile and keyboard resource material workflow > preserves reply-safe authoring confirmation, inline error and cancel states

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { Textarea } from "@/components/ui/textarea";
  +
  ```

## tests/unit/UX-college-college-courses-01.test.ts (1 failing)
- UX-college-college-courses-01 verifies scoped responsive details

  ```
  AssertionError: expected 'import { CollegeCourseMissingScope } …' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import { CollegeCourseMissingScope } from "@/components/courses/college-course-missing-scope";
  + import { CollegeCourseVisibilityRefresh } from "@/components/college/college-course-visibility-refresh";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {CollegeCoursesLastGood} from "@/components/college/college-courses-last-good";
  ```

## tests/unit/UX-college-csv-tables-01.test.ts (4 failing)
- UX-college-csv-tables-01 responsive row reports > college-faculty-csv-import retains all report fields, a named accessible DataTable and real empty copy

  ```
  AssertionError: expected '"use client";\nimport { Textarea } fr…' to contain 'empty={<p'
  - Expected
  + Received
  - empty={<p
  + "use client";
  + import { Textarea } from "@/components/ui/textarea";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  ```
- UX-college-csv-tables-01 responsive row reports > college-student-csv-import retains all report fields, a named accessible DataTable and real empty copy

  ```
  AssertionError: expected '"use client";\nimport { Select } from…' to contain 'empty={<p'
  - Expected
  + Received
  - empty={<p
  + "use client";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  ```
- UX-college-csv-tables-01 responsive row reports > college-student-import-history retains all report fields, a named accessible DataTable and real empty copy

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'empty={<p'
  - Expected
  + Received
  - empty={<p
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {DataTable} from "@/components/ui/data-table";
  + import {Dialog} from "@/components/ui/dialog";
  ```
- UX-college-csv-tables-01 responsive row reports > history handles rejected responses without exposing provider details

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'if(!response.ok||!body?.items)throw E…'
  - Expected
  + Received
  - if(!response.ok||!body?.items)throw Error("Import history unavailable.");
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {DataTable} from "@/components/ui/data-table";
  + import {Dialog} from "@/components/ui/dialog";
  ```
