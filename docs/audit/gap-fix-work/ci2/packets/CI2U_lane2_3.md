# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-college-page-tables-01.test.ts (1 failing)
- UX-college-page-tables-01 mobile action parity > /college/activity preserves accessible event details and scoped empty/partial state

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain '<DataTable rows={data.items} getRowKe…'
  - Expected
  + Received
  - <DataTable rows={data.items} getRowKey={item=>item.event.id}
  + import { DateInput } from "@/components/ui/date-input";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import Link from "next/link";
  ```

## tests/unit/UX-college-roster-data-tables-01.test.ts (2 failing)
- UX-college-roster-data-tables-01 responsive roster and faculty detail > /college/batches/[cohortId]/students keeps enrollment move actions on mobile

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'No matching students.'
  - Expected
  + Received
  - No matching students.
  + import Link from "next/link";
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { notFound, redirect } from "next/navigation";
  + import { and, eq, ilike, or } from "drizzle-orm";
  ```
- UX-college-roster-data-tables-01 responsive roster and faculty detail > /college/electives/[slotId]/allocate retains checked learner IDs inside real form submission

  ```
  AssertionError: expected '"use server";\nimport Link from "next…' to contain 'type="checkbox"'
  - Expected
  + Received
  - type="checkbox"
  + "use server";
  + import Link from "next/link";
  + import { redirect, notFound } from "next/navigation";
  + import { and, asc, eq, ilike, inArray, isNull, or } from "drizzle-orm";
  ```

## tests/unit/UX-cross-audit-recruiter-tracker-chat3.test.ts (6 failing)
- Chat-3 source cross-audit - actual UX and safety contracts > UX-recruiter-drives-jobId-change-requests-02

  ```
  AssertionError: expected '"use client";\nimport Link from "next…' to contain 'if(!response.ok)throw Error("Could no…'
  - Expected
  + Received
  - if(!response.ok)throw Error("Could not save change request.")
  + "use client";
  + import Link from "next/link";
  + import {useRef,useState} from "react";
  + import {Input} from "@/components/ui/input";
  ```
- Chat-3 source cross-audit - actual UX and safety contracts > UX-recruiter-drives-new-02

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'text-base text-foreground focus-visib…'
  - Expected
  + Received
  - text-base text-foreground focus-visible:outline-2
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { useToast } from "@/components/ui/toast";
  ```
- Chat-3 source cross-audit - actual UX and safety contracts > UX-tracker-02

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'text-base text-foreground focus-visib…'
  - Expected
  + Received
  - text-base text-foreground focus-visible:outline-2
  + "use client";
  +
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  ```
- Chat-3 source cross-audit - actual UX and safety contracts > UX-tracker-audit-findings-02

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain '<Input name="area"'
  - Expected
  + Received
  - <Input name="area"
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Banner } from "@/components/ui/banner";
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  ```
- Chat-3 source cross-audit - actual UX and safety contracts > UX-tracker-issues-02

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'inline-flex min-h-11 items-center tex…'
  - Expected
  + Received
  - inline-flex min-h-11 items-center text-[var(--lms-teal-deep)] underline focus-visible:outline-2
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { TrackerAdminNav } from "@/components/tracker/tracker-admin-nav";
  ```
- Chat-3 source cross-audit - actual UX and safety contracts > UX-tracker-audit-findings-publicId-03

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'focus-visible:outline-[var(--lms-teal…'
  - Expected
  + Received
  - focus-visible:outline-[var(--lms-teal-deep)]">Looks similar
  + import Link from "next/link";
  + import {notFound} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  ```

## tests/unit/UX-mentor-cross-evidence-links-01.test.ts (1 failing)
- UX-mentor-cross-E01 source/demo/attachment links stay sanitized and 44px

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'className="ml-2 inline-flex min-h-11 …'
  - Expected
  + Received
  - className="ml-2 inline-flex min-h-11 items-center
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {Disclosure} from "@/components/ui/disclosure";
  ```

## tests/unit/UX-recruiter-drives-jobId-change-requests-01.test.ts (1 failing)
- UX-recruiter-drives-jobId-change-requests-01 > preserves role-safe navigation, exact route copy and accessible shared surface

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'actions={<Link href='
  - Expected
  + Received
  - actions={<Link href=
  + import Link from "next/link";
  + import {PageBackLink} from "@/components/ui/page-back-link";
  + import {notFound} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```

## tests/unit/UX-teacher-courses-deliveryid-students-membershipid-coverage-01.test.ts (1 failing)
- UX-teacher-courses-deliveryid-students-membershipid-01 /teacher/courses/[deliveryId]/students/[membershipId] keeps page scope and true states

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-label="Student details"'
  - Expected
  + Received
  - aria-label="Student details"
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```
