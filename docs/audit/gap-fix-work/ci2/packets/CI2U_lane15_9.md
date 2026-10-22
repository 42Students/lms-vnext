# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat5-next-batch-states.test.ts (1 failing)
- Chat5 next batch states > TPO-batches-17 renders accessible batch card skeleton and retry without falsely reporting changed decisions

  ```
  AssertionError: expected 'import { GracefulPageLoading } from "…' to contain 'aria-busy="true"'
  - Expected
  + Received
  - aria-busy="true"
  + import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
  + import { PageHeader } from "@/components/ui/page-header";
  + export default function Loading(){return <div className="min-w-0 space-y-4"><PageHeader title="Placement eligibility"/><GracefulPageLoading label="Loading batches…" shape="directory"/></div>}
  +
  ```

## tests/unit/chat6-admin-write-safety-guards.test.ts (1 failing)
- GR-31 + GR-09 Super Admin write safety > SA-tenants-branding-01 prevents rapid duplicate writes and retains unsaved branding after network failure

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'if (!canEdit || savingRef.current) re…'
  - Expected
  + Received
  - if (!canEdit || savingRef.current) return
  + "use client";
  +
  + import { useEffect, useRef, useState, useTransition } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat6-faculty-assignment-batch-http-101.test.ts (1 failing)
- SA-academics-people-101 guarded course selection HTTP endpoint > forwards exact actor context and array to a single atomic service

  ```
  AssertionError: expected { Object (assignments, createdCount, ...) } to deeply equal { assignments: [ { id: 'one' } ] }
  - Expected
  + Received
  @@ -2,6 +2,8 @@
  "assignments": [
  {
  "id": "one",
  },
  ```

## tests/unit/chat6-people-phone-session-and-mobile-round6.test.ts (2 failing)
- Chat-6 recruiter login and mobile layout safety > COL-dashboard-17 uses wrapped count labels and a mobile-safe setup checklist with accessible links

  ```
  AssertionError: expected '"use client";\nimport {useState,useTr…' to contain 'min-[375px]:grid-cols-2'
  - Expected
  + Received
  - min-[375px]:grid-cols-2
  + "use client";
  + import {useState,useTransition} from "react";
  + import { StatTile } from "@/components/ui/stat-tile";
  + import { Button } from "@/components/ui/button";
  ```
- Chat-6 recruiter login and mobile layout safety > SA-academics-people-75 keeps create controls and scrolling course tables within mobile width

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'className="min-w-0 space-y-8"'
  - Expected
  + Received
  - className="min-w-0 space-y-8"
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { StatTile } from "@/components/ui/stat-tile";
  + import { Alert } from "@/components/ui/alert";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/chat6-superadmin-middle-role-journeys-21.test.tsx (4 failing)
- SA-admin-middle-role-journeys-21 private placement pages > calendar recovers without an exact college, even for a valid global administrator

  ```
  AssertionError: expected '<div class="min-w-0 space-y-4 md:spac…' to contain 'Select a college scope'
  Expected: "Select a college scope"
  Received: "<div class="min-w-0 space-y-4 md:space-y-6"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header-title-size:20px] md:[-
  ```
- SA-admin-middle-role-journeys-21 private placement pages > retention report denies forged learner scope before loading any applicant names

  ```
  TypeError: Cannot destructure property 'searchParams' of 'undefined' as it is undefined.
  ❯ Module.SuperAdminRetentionPage src/app/(authenticated)/admin/placements/retention/page.tsx:25:50
  23|  </div>;
  24| }
  25| export default function SuperAdminRetentionPage({searchParams}:Retenti…
  |                                                  ^
  26|  return <Suspense fallback={<RetentionLoading/>}>
  27|   <RetentionReportContent searchParams={searchParams}/>
  ```
- SA-admin-middle-role-journeys-21 private placement pages > retention report displays recovery without a college and makes no private query

  ```
  TypeError: Cannot destructure property 'searchParams' of 'undefined' as it is undefined.
  ❯ Module.SuperAdminRetentionPage src/app/(authenticated)/admin/placements/retention/page.tsx:25:50
  23|  </div>;
  24| }
  25| export default function SuperAdminRetentionPage({searchParams}:Retenti…
  |                                                  ^
  26|  return <Suspense fallback={<RetentionLoading/>}>
  27|   <RetentionReportContent searchParams={searchParams}/>
  ```
- SA-admin-middle-role-journeys-21 private placement pages > expired session aborts both role journeys without a private report read

  ```
  TypeError: Cannot destructure property 'searchParams' of 'undefined' as it is undefined.
  ❯ Module.SuperAdminRetentionPage src/app/(authenticated)/admin/placements/retention/page.tsx:25:50
  23|  </div>;
  24| }
  25| export default function SuperAdminRetentionPage({searchParams}:Retenti…
  |                                                  ^
  26|  return <Suspense fallback={<RetentionLoading/>}>
  27|   <RetentionReportContent searchParams={searchParams}/>
  ```

## tests/unit/chat7-college-content-authoring-weak.test.ts (3 failing)
- COURSES-WEAK-CONTENT-AUTHORING-01 tenant, stage and private link boundaries > Super Admin resolves acting college scope instead of trusting membership's stale college

  ```
  TypeError: db.selectDistinct is not a function
  ❯ Module.getCollegeContentAuthoringOptions src/modules/courses/college-content-authoring-service.ts:64:25
  62|    eq(courses.status,"ACTIVE"),isNull(courseSectionDeliveries.endedAt)…
  63|   .orderBy(asc(sections.name),asc(courseSectionDeliveries.id));
  64|  const faculty=await db.selectDistinct({
  |                         ^
  65|   membershipId:collegeMemberships.id,offeringId:courseOfferings.id,
  66|   displayName:users.displayName,
  ```
- COURSES-WEAK-CONTENT-AUTHORING-01 tenant, stage and private link boundaries > never exposes published external playback URL in metadata editor while retaining editable drafts

  ```
  TypeError: db.selectDistinct is not a function
  ❯ Module.getCollegeContentAuthoringOptions src/modules/courses/college-content-authoring-service.ts:64:25
  62|    eq(courses.status,"ACTIVE"),isNull(courseSectionDeliveries.endedAt)…
  63|   .orderBy(asc(sections.name),asc(courseSectionDeliveries.id));
  64|  const faculty=await db.selectDistinct({
  |                         ^
  65|   membershipId:collegeMemberships.id,offeringId:courseOfferings.id,
  66|   displayName:users.displayName,
  ```
- COURSES-WEAK-CONTENT-AUTHORING-01 tenant, stage and private link boundaries > honestly flags truncated content list at 250 and never includes >250 records

  ```
  TypeError: db.selectDistinct is not a function
  ❯ Module.getCollegeContentAuthoringOptions src/modules/courses/college-content-authoring-service.ts:64:25
  62|    eq(courses.status,"ACTIVE"),isNull(courseSectionDeliveries.endedAt)…
  63|   .orderBy(asc(sections.name),asc(courseSectionDeliveries.id));
  64|  const faculty=await db.selectDistinct({
  |                         ^
  65|   membershipId:collegeMemberships.id,offeringId:courseOfferings.id,
  66|   displayName:users.displayName,
  ```
