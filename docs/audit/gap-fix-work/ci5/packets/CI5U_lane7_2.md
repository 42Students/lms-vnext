# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-ux-cross-audit-tpo.test.ts (1 failing)
- chat-13 TPO second-third cross-audit repairs > UX-cross-tpo-second-C13-027 recruiter directory and company communication remain accessible across viewports

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'mobilePriority:"action"'
  - Expected
  + Received
  - mobilePriority:"action"
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Tabs } from "@/components/ui/tabs";
  + import { FilterChip } from "@/components/ui/filter-chip";
  ```

## tests/unit/chat16-final-col-placements-10.test.ts (1 failing)
- COL-placements-10 needs attention > COL-placements-10 retains four legacy attention categories and stage-specific drilldowns

  ```
  AssertionError: expected '"use client";\nimport Link from "next…' to contain 'encodeURIComponent(item.jobId)+"/appl…'
  - Expected
  + Received
  - encodeURIComponent(item.jobId)+"/applications?stage="+category.tab
  + "use client";
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  + import {useState} from "react";
  ```

## tests/unit/chat16-recruiter-email-digest-live-grant-16.test.ts (1 failing)
- chat-16 recruiter digest scheduler live authorization > email-bridge-digest-worker-16 is inert when a verified bridge is not enabled

  ```
  AssertionError: expected { examined: +0, sent: +0, …(3) } to deeply equal { examined: +0, sent: +0, …(1) }
  - Expected
  + Received
  {
  "enabled": false,
  "examined": 0,
  +   "operatorAlert": "Recruiter email bridge is not ready: BRIDGE_DISABLED",
  +   "readinessReason": "BRIDGE_DISABLED",
  ```

## tests/unit/chat2-UX-tpo-overlay-01.test.ts (4 failing)
- UX-tpo-overlay: focus-safe mobile and desktop workflows > UX-tpo-overlay-01 student panel uses Drawer focus isolation and sticky next/previous actions

  ```
  AssertionError: expected '"use client";\nimport {Button} from "…' to contain 'title={"Student panel for "+student.d…'
  - Expected
  + Received
  - title={"Student panel for "+student.displayName}
  + "use client";
  + import {Button} from "@/components/ui/button";
  + import {Tabs} from "@/components/ui/tabs";
  + import {Drawer} from "@/components/ui/drawer";
  ```
- UX-tpo-overlay: focus-safe mobile and desktop workflows > UX-tpo-overlay-02 notice composer uses native shared modal behavior

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain '<Dialog open={open} onOpenChange={set…'
  - Expected
  + Received
  - <Dialog open={open} onOpenChange={setOpen} title={title}>
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {useEffect,useState,type ReactNode} from "react";
  + import {Dialog} from "@/components/ui/dialog";
  ```
- UX-tpo-overlay: focus-safe mobile and desktop workflows > UX-tpo-overlay-05 bell opens a named Drawer and exposes retry paths

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain '<Drawer open={open} onOpenChange={cha…'
  - Expected
  + Received
  - <Drawer open={open} onOpenChange={changeOpen}
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import Link from "next/link";
  + import {Drawer} from "@/components/ui/drawer";
  ```
- UX-tpo-overlay: focus-safe mobile and desktop workflows > UX-tpo-overlay primitive contracts isolate focus, lock background and restore opener

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useR…' to contain 'modal.showModal()'
  - Expected
  + Received
  - modal.showModal()
  + "use client";
  +
  + import { useId, useRef, type ReactNode, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat2-round-edit-concurrency.test.ts (2 failing)
- TPO-drive-workspace-37 optimistic round draft edits > TPO-drive-workspace-37 refuses an overlapping editor's stale compare-and-swap without emitting an event

  ```
  AssertionError: expected TypeError: tx.select is not a function to match object { Object (code) }
  - Expected
  + Received
  - {
  -   "code": "PLACEMENT_ROUND_NOT_EDITABLE",
  + TypeError {
  +   "message": "tx.select is not a function",
  }
  ```
- TPO-drive-workspace-37 optimistic round draft edits > TPO-drive-workspace-37 persists an accepted edit and writes exactly one round event

  ```
  TypeError: tx.select is not a function
  ❯ src/modules/placements/round-service.ts:248:34
  246|   const expectedUpdatedAt = current.round.updatedAt.toISOString();
  247|   return db.transaction(async (tx) => {
  248|     const [lockedJob] = await tx.select({ status: placementJobs.status…
  |                                  ^
  249|       .from(placementJobs).where(eq(placementJobs.id, current.job.id))
  250|       .for("update").limit(1);
  ```

## tests/unit/chat2-tpo-reports-server-page-states.test.ts (1 failing)
- UX-tpo-LAST-THIRD-01 branch and CTC reports server-page guard and state > UX-tpo-LAST-THIRD-01 passes trusted college and filters to branch report, and retains honest no-season empty

  ```
  TypeError: Converting circular structure to JSON
  --> starting at object with constructor 'Object'
  --- property 'default' closes the circle
  ```

## tests/unit/chat3-sa-faculty-assignments-tenant-pages.test.ts (3 failing)
- SA3-FAC-ASSIGNMENTS-01 scoped assignment directory and facets > limits assignment joins to one college and a Section matching the course offering cohort and term

  ```
  TypeError: Cannot read properties of undefined (reading 'toISOString')
  ❯ src/modules/admin-ui/super-admin-faculty-assignments-service.ts:117:26
  115|   id:row.id,title:row.teacherName?.trim()||"Faculty name unavailable (…
  116|   subtitle:(row.courseName?.trim()||"Course name unavailable (ID "+row…
  117|   revision:row.updatedAt.toISOString(),
  |                          ^
  118|   // Private server-rendered action metadata; the generic directory do…
  119|   // not display these membership or delivery identifiers as columns.
  ```
- SA3-FAC-ASSIGNMENTS-01 scoped assignment directory and facets > clamps stale deep links to the current final page after a Faculty assignment was removed

  ```
  TypeError: Cannot read properties of undefined (reading 'toISOString')
  ❯ src/modules/admin-ui/super-admin-faculty-assignments-service.ts:117:26
  115|   id:row.id,title:row.teacherName?.trim()||"Faculty name unavailable (…
  116|   subtitle:(row.courseName?.trim()||"Course name unavailable (ID "+row…
  117|   revision:row.updatedAt.toISOString(),
  |                          ^
  118|   // Private server-rendered action metadata; the generic directory do…
  119|   // not display these membership or delivery identifiers as columns.
  ```
- SA3-FAC-ASSIGNMENTS-01 scoped assignment directory and facets > limits selectable class facets by both cohort-program department and term college

  ```
  AssertionError: expected 2 to be greater than or equal to 3
  ❯ tests/unit/chat3-sa-faculty-assignments-tenant-pages.test.ts:197:84
  195|     expect(joined).toContain('"academic_periods"."college_id"');
  196|     expect(joined).toContain('"departments"."college_id"');
  197|     expect(state.joins.flatMap(p => p.params).filter(p => p === colleg…
  |                                                                                    ^
  198|     expect(state.joins.flatMap(p => p.params)).toContain(organizationI…
  199|     expect(joined).toContain('"colleges"."organization_id"');
  ```

## tests/unit/chat4-college-faculty-csv-import.test.ts (4 failing)
- COL-people-faculty-csv-01 registered faculty import validation and safe partial outcomes > never creates identities during a preview, even with valid faculty rows

  ```
  AssertionError: expected { preview: true, valid: +0, …(3) } to match object { preview: true, valid: 2, …(2) }
  (1 matching property omitted from actual)
  - Expected
  + Received
  {
  -   "invalid": 0,
  +   "invalid": 2,
  "preview": true,
  ```
- COL-people-faculty-csv-01 registered faculty import validation and safe partial outcomes > produces row-specific duplicate and invalid mobile/email/type errors without side effects

  ```
  AssertionError: expected { preview: true, valid: +0, …(3) } to match object { preview: true, valid: 1, invalid: 2 }
  (2 matching properties omitted from actual)
  - Expected
  + Received
  {
  -   "invalid": 2,
  +   "invalid": 3,
  "preview": true,
  ```
- COL-people-faculty-csv-01 registered faculty import validation and safe partial outcomes > imports normalized one-college faculty role and legacy employment type exactly once

  ```
  AssertionError: expected { preview: false, valid: +0, …(3) } to match object { preview: false, valid: 1, …(1) }
  (2 matching properties omitted from actual)
  - Expected
  + Received
  {
  -   "invalid": 0,
  +   "invalid": 1,
  "preview": false,
  ```
- COL-people-faculty-csv-01 registered faculty import validation and safe partial outcomes > does not echo private storage errors after partial faculty profile or identity failure

  ```
  AssertionError: expected 'INVALID' to be 'FAILED' // Object.is equality
  Expected: "FAILED"
  Received: "INVALID"
  ```
