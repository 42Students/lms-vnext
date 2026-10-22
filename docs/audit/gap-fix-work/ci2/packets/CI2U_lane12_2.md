# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-admin-risk-query.test.ts (1 failing)
- IIT Dharwad Projects: Super and College Admin risk dashboard URL breaker > PROJ-BREAK-ux-14 accepts authorized bucket and list bounds without discarding current filters

  ```
  AssertionError: expected { success: false, …(1) } to match object { success: true, data: { …(6) } }
  (3 matching properties omitted from actual)
  - Expected
  + Received
  {
  -   "data": {
  -     "page": 2,
  -     "pageSize": 100,
  ```

## tests/unit/PROJ-BREAK-chat9-readiness-read-races.test.ts (2 failing)
- IIT Dharwad Projects readiness: revoked roles and archive races > PROJ-BREAK-readiness-61 selected college choices exclude archived rows and are bounded

  ```
  TypeError: tx.select(...).from(...).where(...).orderBy(...).limit(...).offset is not a function
  ❯ src/modules/projects/college-readiness-releases-service.ts:29:83
  27|    .from(projectInstances).where(and(eq(projectInstances.collegeId,col…
  28|     ne(projectInstances.status,"ARCHIVED"),...(search?[ilike(projectIn…
  29|    .orderBy(asc(projectInstances.title),asc(projectInstances.id)).limi…
  |                                                                                   ^
  30|  });
  31| }
  ```
- IIT Dharwad Projects readiness: revoked roles and archive races > PROJ-BREAK-readiness-62 a live owned project is held through sprint and task totals

  ```
  AssertionError: expected [ { id: 'release', …(9) } ] to match object [ { id: 'release', …(4) } ]
  (5 matching properties omitted from actual)
  - Expected
  + Received
  [
  {
  "completedSprints": 1,
  "id": "release",
  ```

## tests/unit/PROJ-BREAK-chat9-unsubmitted-navigation.test.ts (1 failing)
- IIT Dharwad Projects: unsubmitted page never loses its filters > PROJ-BREAK-submissions-41 the unsubmitted tab does not depend on summary or other delivery results

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'view==="ALL"?await Promise.all(['
  - Expected
  + Received
  - view==="ALL"?await Promise.all([
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { safeProjectExternalHref } from "@/modules/projects/mentor-workspace-evidence-model";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/UX-chat15-overlays-second-pass.test.ts (3 failing)
- UX-chat15-overlays-second-pass scroll, dismiss and motion > UX-tracker-live-logs-03 uses shared modal for report export, maintains confirmation for muting and 44px hit targets

  ```
  AssertionError: expected '"use client";\nimport { EmptyState } …' to contain '<Dialog open={reportOpen} onOpenChang…'
  - Expected
  + Received
  - <Dialog open={reportOpen} onOpenChange={setReportOpen} title="Report for Claude">
  + "use client";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { Alert } from "@/components/ui/alert";
  ```
- UX-chat15-overlays-second-pass scroll, dismiss and motion > UX-tracker-telegram-02 keeps explicit consequence and action confirmation and touch-sized actions

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'title="Daily digest"'
  - Expected
  + Received
  - title="Daily digest"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  +
  ```
- UX-chat15-overlays-second-pass scroll, dismiss and motion > UX-hr-bell-02 announcement remains distinct from recruiter messages and popover closes with Escape and outside pointer

  ```
  AssertionError: expected '"use client";\nimport { Badge } from …' to contain 'if(event.key!=="Escape")return'
  - Expected
  + Received
  - if(event.key!=="Escape")return
  + "use client";
  + import { Badge } from "@/components/ui/badge";
  + import { Button } from "@/components/ui/button";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```

## tests/unit/UX-college-college-college-profile-01.test.ts (1 failing)
- UX-college-college-college-profile-01 retains responsive forms, states and legacy copy

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeContactProfileForm } from "@/components/colleges/college-contact-profile-form";
  ```

## tests/unit/UX-college-college-lecture-halls-hall-id-01.test.ts (1 failing)
- UX-college-college-lecture-halls-hall-id-01 keeps accessible shared screen state

  ```
  AssertionError: expected 'import { notFound } from "next/naviga…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import { notFound } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  ```
