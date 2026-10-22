# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-admin-correlations.test.ts (4 failing)
- IIT Dharwad Projects: admin submission correlated SQL and tenancy > PROJ-BREAK-reports-08 submission status counts bind to the outer project, not a submission ID

  ```
  TypeError: getDb(...).transaction is not a function
  ❯ Module.getProjectAdminSubmissionSummary src/modules/projects/admin-insights-service.ts:838:18
  836|     organizationId: college.organizationId, collegeId: college.id,
  837|   });
  838|   return getDb().transaction(async db=>{
  |                  ^
  839|     await assertPersistedPlatformPermission(db,context,"projects.manag…
  840|       collegeId:college.id,organizationId:college.organizationId,
  ```
- IIT Dharwad Projects: admin submission correlated SQL and tenancy > PROJ-BREAK-reports-10 completed and archived submissions do not inflate actionable review counters

  ```
  TypeError: getDb(...).transaction is not a function
  ❯ Module.getProjectAdminSubmissionSummary src/modules/projects/admin-insights-service.ts:838:18
  836|     organizationId: college.organizationId, collegeId: college.id,
  837|   });
  838|   return getDb().transaction(async db=>{
  |                  ^
  839|     await assertPersistedPlatformPermission(db,context,"projects.manag…
  840|       collegeId:college.id,organizationId:college.organizationId,
  ```
- IIT Dharwad Projects: admin submission correlated SQL and tenancy > PROJ-BREAK-reports-09 mentor lookups correlate to their own workspace and not the inner member ID

  ```
  TypeError: getDb(...).transaction is not a function
  ❯ Module.listProjectAdminSubmissionQueue src/modules/projects/admin-insights-service.ts:891:18
  889|     collegeId: college.id,
  890|   });
  891|   return getDb().transaction(async db=>{
  |                  ^
  892|     await assertPersistedPlatformPermission(db,context,"projects.manag…
  893|       collegeId:college.id,organizationId:college.organizationId,
  ```
- IIT Dharwad Projects: admin submission correlated SQL and tenancy > PROJ-BREAK-idor-23 selected Super Admin college cannot read another organization's summary or queue

  ```
  AssertionError: expected [Function] to throw error including 'Missing permission: projects.manage' but got 'PROJECT_ACCESS_DENIED'
  Expected: "Missing permission: projects.manage"
  Received: "PROJECT_ACCESS_DENIED"
  ```

## tests/unit/PROJ-BREAK-chat9-admin-view-filter-boundary.test.ts (1 failing)
- IIT Dharwad Projects: strict snapshot filter contract preserves cards and list > PROJ-BREAK-ux-22 college page projects away view before service but preserves user-selected tabs

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'viewHref("cards")'
  - Expected
  + Received
  - viewHref("cards")
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  +
  ```

## tests/unit/PROJ-BREAK-chat9-submissions-tabs-resilience.test.tsx (3 failing)
- IIT Dharwad Projects: adversarial tab outage and pagination journeys > PROJ-BREAK-submissions-41 unsubmitted-only navigation never calls final-delivery services

  ```
  AssertionError: expected '/college/projects Submissions dashboa…' to contain 'Page 2 of 2'
  Expected: "Page 2 of 2"
  Received: "/college/projects Submissions dashboard Final project deliverables across all workspaces. Filters Not submitted ·  0  workspaces"
  ```
- IIT Dharwad Projects: adversarial tab outage and pagination journeys > PROJ-BREAK-submissions-44 optional aggregate outage cannot hide otherwise authorized submissions

  ```
  AssertionError: expected '/college/projects Submissions dashboa…' to contain 'No final-delivery versions match thes…'
  Expected: "No final-delivery versions match these filters."
  Received: "/college/projects Submissions dashboard Final project deliverables across all workspaces. Submission totals are temporarily unavailable. The filtered submissions below are still visible. Filters Submissions Showing current and historical final-delivery versions. Historical versions are re
  ```
- IIT Dharwad Projects: adversarial tab outage and pagination journeys > PROJ-BREAK-submissions-45 essential queue outage shows retry preserving filters

  ```
  AssertionError: expected 'Submissions dashboard Final project d…' to contain 'Submissions unavailable'
  Expected: "Submissions unavailable"
  Received: "Submissions dashboard Final project deliverables across all workspaces. Submissions could not be loaded The submissions list could not be loaded. Your filters have not changed. Retry loading submissions /college/projects/submissions?q=IIT&status=ACTIVE&page=3&pageSize=50"
  ```

## tests/unit/UX-admin-cross-chat-12-touch-contrast.test.ts (8 failing)
- UX-admin first third delegated touch and contrast audits > src/components/courses/admin-assessment-read-directory.tsx

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' not to match /min-h-(?:8|9|10)\b/
  - Expected:
  /min-h-(?:8|9|10)\b/
  + Received:
  "import { FilterBar } from \"@/components/ui/filter-bar\";
  import { Disclosure } from \"@/components/ui/disclosure\";
  import Link from \"next/link\";
  import {Input} from \"@/components/ui/input\";
  ```
- UX-admin first third delegated touch and contrast audits > src/components/academics/college-cohort-management.tsx

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' not to match /min-h-(?:8|9|10)\b/
  - Expected:
  /min-h-(?:8|9|10)\b/
  + Received:
  "\"use client\";
  import { Button } from \"@/components/ui/button\";
  import { useEffect, useState, useTransition, type FormEvent } from \"react\";
  import { usePathname, useRouter } from \"next/navigation\";
  ```
- UX-admin first third delegated touch and contrast audits > src/components/academics/college-section-management.tsx

  ```
  AssertionError: expected '"use client";\nimport { Textarea } fr…' not to match /min-h-(?:8|9|10)\b/
  - Expected:
  /min-h-(?:8|9|10)\b/
  + Received:
  "\"use client\";
  import { Textarea } from \"@/components/ui/textarea\";
  import { Input } from \"@/components/ui/input\";
  import { Button } from \"@/components/ui/button\";
  ```
- UX-admin first third delegated touch and contrast audits > src/components/admin/college-create-form.tsx

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect,u…' not to match /min-h-(?:8|9|10)\b/
  - Expected:
  /min-h-(?:8|9|10)\b/
  + Received:
  "\"use client\";
  import { useEffect,useRef,useState } from \"react\";
  import {useGuardedAction} from \"@/hooks/use-guarded-action\";
  import {useFormDraft} from \"@/hooks/use-form-draft\";
  ```
- UX-admin first third delegated touch and contrast audits > src/components/admin/college-branding-preview.tsx

  ```
  AssertionError: expected '"use client";\nimport {useState} from…' not to match /min-h-(?:8|9|10)\b/
  - Expected:
  /min-h-(?:8|9|10)\b/
  + Received:
  "\"use client\";
  import {useState} from \"react\";
  import type { CSSProperties } from \"react\";
  import { StatusBadge } from \"@/components/ui/status-badge\";
  ```
- UX-admin first third delegated touch and contrast audits > src/components/verification/SuperAdminVerificationPanel.tsx

  ```
  AssertionError: expected '"use client";\nimport {useRouter} fro…' not to match /min-h-(?:8|9|10)\b/
  - Expected:
  /min-h-(?:8|9|10)\b/
  + Received:
  "\"use client\";
  import {useRouter} from \"next/navigation\";
  import {Button} from \"@/components/ui/button\";
  import {Checkbox} from \"@/components/ui/checkbox\";
  ```
- UX-admin first third delegated touch and contrast audits > src/components/admin/super-admin-faculty-assignment-create.tsx

  ```
  AssertionError: expected '"use client";\n\nimport {useState, ty…' not to match /min-h-(?:8|9|10)\b/
  - Expected:
  /min-h-(?:8|9|10)\b/
  + Received:
  "\"use client\";
  import {useState, type FormEvent} from \"react\";
  import {Select} from \"@/components/ui/select\";
  import {Input} from \"@/components/ui/input\";
  ```
- UX-admin first third delegated touch and contrast audits > src/components/admin/admin-scoped-read-page.tsx

  ```
  AssertionError: expected 'import { Select } from "@/components/…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
  ```

## tests/unit/UX-college-college-assignments-01.test.ts (1 failing)
- UX-college-college-assignments-01 keeps responsive layout and legacy wording

  ```
  AssertionError: expected 'import { getCurrentRequestContext } f…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeAssessmentAggregate } from "@/components/courses/college-assessment-aggregate";
  + import {CollegeAssignmentCreate} from "@/components/courses/college-assignment-create";
  + import {getCollegeAssignmentAuthoringCatalog} from "@/modules/courses/college-assignment-authoring-options";
  ```

## tests/unit/UX-college-college-faculty-assignment-01.test.ts (1 failing)
- UX-college-college-faculty-assignment-01 preserves keyboard states, responsive layout and exact labels

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import Link from "next/link";
  + import { FACULTY_ASSIGNMENT_COPY, FACULTY_ASSIGNMENT_ROLE_LABELS, facultyAssignmentRoleLabel } from "@/modules/courses/college-courses-copy";
  + import { Alert } from "@/components/ui/alert";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
