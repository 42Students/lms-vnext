# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat15-activity-page-96.test.tsx (1 failing)
- HR-ACTIVITY-PAGE-96 recruiter history role and state coverage > bad duplicate filters and unsupported kinds fail with a retry link and no SQL

  ```
  AssertionError: expected [] to include '/hr/activity'
  ❯ tests/unit/HR-BREAK-chat15-activity-page-96.test.tsx:51:26
  49|    expect(text(output)).toContain("Invalid activity filters");
  50|    expect(text(output)).toContain("Review the college and event filter…
  51|    expect(links(output)).toContain("/hr/activity");
  |                          ^
  52|   }
  53|   expect(m.list).not.toHaveBeenCalled();
  ```

## tests/unit/PROJ-BREAK-chat9-admin-audit-access.test.ts (1 failing)
- IIT Dharwad Projects: global audit authorization > PROJ-BREAK-idor-25 a selected college or organization never quietly becomes global audit scope

  ```
  AssertionError: expected 'import { getCurrentRequestContext } f…' to contain 'result.remainingCount?" ("+result.rem…'
  - Expected
  + Received
  - result.remainingCount?" ("+result.remainingCount+" remaining":""
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {type ReactNode} from "react";
  + import {ProjectAuditRefreshButton} from "@/components/projects/project-audit-filters";
  + import {StatusBadge} from "@/components/ui/status-badge";
  ```

## tests/unit/PROJ-BREAK-chat9-unsubmitted-navigation.test.ts (1 failing)
- IIT Dharwad Projects: unsubmitted page never loses its filters > PROJ-BREAK-submissions-41 the unsubmitted tab does not depend on summary or other delivery results

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'view==="NOT_SUBMITTED"?await listProj…'
  - Expected
  + Received
  - view==="NOT_SUBMITTED"?await listProjectAdminUnsubmitted(
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { safeProjectExternalHref } from "@/modules/projects/mentor-workspace-evidence-model";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/UX-college-college-groups-group-id-01.test.ts (1 failing)
- UX-college-college-groups-group-id-01 preserves keyboard states, responsive layout and exact labels

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { notFound, redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { DataTable } from "@/components/ui/data-table";
  ```

## tests/unit/UX-project-workspaces-chat17.test.ts (1 failing)
- UX-project-workspaces-41/42 accessible workspace cards > UX-project-workspaces-41 primary navigation retains minimum 44px target

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain '}>Open'
  - Expected
  + Received
  - }>Open
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import styles from "./project-workspace-readiness.module.css";
  + import Link from "next/link";
  + import { ProjectArchiveControl } from "@/components/projects/project-archive-control";
  ```

## tests/unit/UX-tpo-placements-jobs-jobid-applicants-pipeline-01.test.ts (1 failing)
- UX-tpo-placements-jobs-jobid-applicants-pipeline-01 /tpo/placements/jobs/[jobId]/applicants-pipeline > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' not to match /min-h-(?:9|10)\b/
  - Expected:
  /min-h-(?:9|10)\b/
  + Received:
  "import {Button} from \"@/components/ui/button\";
  import {Select} from \"@/components/ui/select\";
  import {Input} from \"@/components/ui/input\";
  import Link from \"next/link\";
  ```

## tests/unit/chat11-tpo-rules-pagination-adversarial.test.ts (1 failing)
- TPO-settings-audit-RULES-PAGE-01 placement rules URL parsing > does not query rules or job policy data for an invalid query

  ```
  AssertionError: expected -1 to be greater than 5009
  ❯ tests/unit/chat11-tpo-rules-pagination-adversarial.test.ts:32:19
  30|   expect(denied).toBeGreaterThan(parsed);
  31|   expect(read).toBeGreaterThan(denied);
  32|   expect(version).toBeGreaterThan(read);
  |                   ^
  33|   expect(page).toContain("Invalid placement rules filters");
  34|   expect(page).toContain("Clear filters");
  ```

## tests/unit/chat12-tpo-students-contract.test.ts (1 failing)
- Chat-12 Students claimed-main gaps — verified source contracts > TPO-students-11 gives roster and per-student private notes a persisted editor

  ```
  AssertionError: expected '"use client";\nimport {Button} from "…' to contain '<TpoStudentNoteEditor membershipIds={…'
  - Expected
  + Received
  - <TpoStudentNoteEditor membershipIds={[student.membershipId]}
  + "use client";
  + import {Button} from "@/components/ui/button";
  + import {Tabs} from "@/components/ui/tabs";
  + import {Drawer} from "@/components/ui/drawer";
  ```
