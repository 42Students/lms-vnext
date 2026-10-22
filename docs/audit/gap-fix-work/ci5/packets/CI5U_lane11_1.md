# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat19-report-joined.test.ts (1 failing)
- HR-BREAK-REPORT-JOINED-51: employer joined stage only includes accepted offers > leaves no shared applicant names or contacts in the funnel SQL

  ```
  AssertionError: expected '\n      select id from placement_jobs…' to contain 'sc.status=\'SHORTLISTED\''
  - Expected
  + Received
  - sc.status='SHORTLISTED'
  +
  +       select id from placement_jobs
  +       where college_id=${collegeId}::uuid
  +         and company_relationship_id=${relationshipId}::uuid
  ```

## tests/unit/PROJ-BREAK-chat9-mentor-reassignment-page-outages.test.tsx (1 failing)
- IIT Dharwad Projects: bulk mentor reassignment partial failure states > PROJ-BREAK-mentor-115 failure in any essential dependency blocks all mutation forms and retains filters

  ```
  AssertionError: expected 'Bulk mentor reassignment Move multipl…' to contain 'Failed to load project workspaces'
  Expected: "Failed to load project workspaces"
  Received: "Bulk mentor reassignment Move multiple active workspaces to a new mentor at once. Mentor options could not be loaded The workspace list and workload are available, but reassignment is disabled until current mentor permissions can be verified. Retry mentors /admin/projects/reassign-mentor?
  ```

## tests/unit/UX-chat15-shell-activity-components-01.test.ts (1 failing)
- UX-chat15-shell-activity-components-01 > UX-shell-mobile-navigation-01 opens a true accessible navigation overlay with Escape and focus trap

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'h-11 w-11'
  - Expected
  + Received
  - h-11 w-11
  + "use client";
  +
  + import { useEffect, useState } from "react";
  + import { usePathname } from "next/navigation";
  ```

## tests/unit/UX-courses-scroll-motion-01.test.ts (1 failing)
- UX-courses-scroll-motion-01 accessible overflow cues > the content preview and learner roadmap modal inherit responsive, accessible scroll and focus behaviour

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useR…' to contain 'opener.current?.focus()'
  - Expected
  + Received
  - opener.current?.focus()
  + "use client";
  +
  + import { useId, useRef, type ReactNode, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/UX-teacher-scroll-motion-pass.test.ts (1 failing)
- Faculty scroll and motion cues > UX-teacher-scroll-motion-02 cues horizontal attendance and retains sticky learner column

  ```
  AssertionError: expected '"use client";\nimport { SummaryStrip …' to contain 'className="sticky left-0 z-10 bg-surf…'
  - Expected
  + Received
  - className="sticky left-0 z-10 bg-surface px-3 py-3"
  + "use client";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { Alert } from "@/components/ui/alert";
  + import { Textarea } from "@/components/ui/textarea";
  ```

## tests/unit/chat11-college-projects-role-journeys.test.ts (1 failing)
- IIT Dharwad College Admin Projects role journeys > PROJ-COL-QUERY-03 refuses number-coercion bypasses and retains canonical decimal navigation

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat12-round19-roster-responsive-counts.test.ts (1 failing)
- TPO Students phone presentation and scoped selection summary > TPO-students-51 shows two-column phone journey, focused row summary and collapsible details/actions

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain 'mobileActionsCollapsible&&mobileExtra…'
  - Expected
  + Received
  - mobileActionsCollapsible&&mobileExtra.length>0?<details
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {FilterChip} from "@/components/ui/filter-chip";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat13-attendance-accessible-correction.test.ts (1 failing)
- Super Admin attendance correction accessibility > SA-academics-people-R05 uses in-app correction actions, not native confirm

  ```
  AssertionError: expected '"use client";\n\nimport { ADMIN_ATTEN…' to contain 'void correct(status)'
  - Expected
  + Received
  - void correct(status)
  + "use client";
  +
  + import { ADMIN_ATTENDANCE_COPY } from "@/modules/attendance/admin-attendance-copy";
  + import {AdminAttendanceParentContactEditor} from "./admin-attendance-parent-contact-editor";
  ```
