# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-admin-model-states.test.ts (1 failing)
- IIT Dharwad Projects admin state boundaries > PROJ-BREAK-admin-state-21 archived and completed workspaces never remain at risk and historical approvals are not pending

  ```
  AssertionError: expected [ 'Active blocker', 'Pending review' ] to deeply equal []
  - Expected
  + Received
  - []
  + [
  +   "Active blocker",
  +   "Pending review",
  + ]
  ```

## tests/unit/PROJ-BREAK-chat9-mentor-candidate-pii.test.ts (1 failing)
- IIT Dharwad Projects: eligible mentor PII read safety > PROJ-BREAK-mentor-96 active actor receives a bounded, selected-college and ACTIVE-only mentor roster

  ```
  TypeError: tx.select(...).from(...).innerJoin(...).innerJoin(...).where(...).orderBy(...).limit(...).offset is not a function
  ❯ src/modules/projects/member-service.ts:271:25
  269|       asc(collegeMemberships.id),
  270|     )
  271|     .limit(query.limit).offset(query.offset);
  |                         ^
  272|   });
  273| }
  ```

## tests/unit/PROJ-BREAK-chat9-template-detail-pages.test.tsx (4 failing)
- Super Admin last-third global template detail and version history security > PROJ-BREAK-ux-40 denied read returns no template or version payload

  ```
  TypeError: Cannot read properties of undefined (reading 'page')
  ❯ Module.TemplateVersionComparisonPage src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx:24:40
  22|   if (!ids.success) notFound();
  23|   const navigation=await searchParams;
  24|   const historicPage=typeof navigation.page==="string"&&/^[1-9]\d{0,5}…
  |                                        ^
  25|     ?Number(navigation.page):null;
  26|   const versionHistoryHref="/admin/projects/templates/"+encodeURICompo…
  ```
- Super Admin last-third global template detail and version history security > PROJ-BREAK-ux-41 DB outage is not mistaken for absent template/version and never leaks exception content

  ```
  TypeError: Cannot read properties of undefined (reading 'page')
  ❯ Module.TemplateVersionComparisonPage src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx:24:40
  22|   if (!ids.success) notFound();
  23|   const navigation=await searchParams;
  24|   const historicPage=typeof navigation.page==="string"&&/^[1-9]\d{0,5}…
  |                                        ^
  25|     ?Number(navigation.page):null;
  26|   const versionHistoryHref="/admin/projects/templates/"+encodeURICompo…
  ```
- Super Admin last-third global template detail and version history security > PROJ-BREAK-ux-42 forged template/version identifiers 404 without calling services

  ```
  AssertionError: expected [Function] to throw error including 'NEXT_NOT_FOUND' but got '[vitest] No "resolveLegacyProjectTemp…'
  - Expected
  + Received
  - NEXT_NOT_FOUND
  + [vitest] No "resolveLegacyProjectTemplateBookmark" export is defined on the "@/modules/projects/template-service" mock. Did you forget to return it from "vi.mock"?
  + If you need to partially mock a module, you can use "importOriginal" helper inside:
  +
  ```
- Super Admin last-third global template detail and version history security > PROJ-BREAK-ux-43 permitted read can render details without a global mutation grant

  ```
  TypeError: Cannot read properties of undefined (reading 'page')
  ❯ Module.TemplateVersionComparisonPage src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx:24:40
  22|   if (!ids.success) notFound();
  23|   const navigation=await searchParams;
  24|   const historicPage=typeof navigation.page==="string"&&/^[1-9]\d{0,5}…
  |                                        ^
  25|     ?Number(navigation.page):null;
  26|   const versionHistoryHref="/admin/projects/templates/"+encodeURICompo…
  ```

## tests/unit/UX-attendance-calendar-scroll-01.test.ts (2 failing)
- UX-attendance-calendar-scroll-01 large variable-width attendance calendar > admin-attendance-workspace preserves learner/day/mark grid with truthful horizontal scroll fades

  ```
  AssertionError: expected '"use client";\n\nimport { ADMIN_ATTEN…' to contain '<ScrollCue'
  - Expected
  + Received
  - <ScrollCue
  + "use client";
  +
  + import { ADMIN_ATTENDANCE_COPY } from "@/modules/attendance/admin-attendance-copy";
  + import {AdminAttendanceParentContactEditor} from "./admin-attendance-parent-contact-editor";
  ```
- UX-attendance-calendar-scroll-01 large variable-width attendance calendar > faculty-attendance-workspace preserves learner/day/mark grid with truthful horizontal scroll fades

  ```
  AssertionError: expected '"use client";\nimport { SummaryStrip …' to contain '<ScrollCue'
  - Expected
  + Received
  - <ScrollCue
  + "use client";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { Alert } from "@/components/ui/alert";
  + import { Textarea } from "@/components/ui/textarea";
  ```

## tests/unit/UX-college-college-batches-01.test.ts (1 failing)
- UX-college-college-batches-01 preserves state and mobile layout

  ```
  AssertionError: expected 'import { collegeDirectoryValidationMe…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
  + import Link from "next/link";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/UX-college-college-groups-group-id-01.test.ts (1 failing)
- UX-college-college-groups-group-id-01 preserves keyboard states, responsive layout and exact labels

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import Link from "next/link";
  + import { notFound, redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { DataTable } from "@/components/ui/data-table";
  ```
