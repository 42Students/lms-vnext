# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-placements-chat7-queue-review.test.ts (5 failing)
- chat-7 learner placements queued closure audit > LEARNER-placements-53 describe only stored college offer rules

  ```
  AssertionError: expected 'export type LearnerCollegeRule={\n co…' to contain 'When counted placed:'
  - Expected
  + Received
  - When counted placed:
  + export type LearnerCollegeRule={
  +  countsAsPlacedAt:string;maxHeldOffers:number;upliftPct:number;minResponseHours:number;
  + };
  + export type LearnerHeldOfferFact={kind:string;status:string;annualCtcInr:number|null};
  ```
- chat-7 learner placements queued closure audit > LEARNER-placements-41 shows scheduled online assessments without inventing result confirmations

  ```
  AssertionError: expected 'import { Tabs } from "@/components/ui…' to contain 'Join online round'
  - Expected
  + Received
  - Join online round
  + import { Tabs } from "@/components/ui/tabs";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  ```
- chat-7 learner placements queued closure audit > LEARNER-placements-55 keeps three anchored placement cell sections

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'id="registration"'
  - Expected
  + Received
  - id="registration"
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- chat-7 learner placements queued closure audit > LEARNER-placements-18 retains approved vNext published-drive summary and saved bookmark count

  ```
  AssertionError: expected '"use client";\n\nimport { useCallback…' to contain 'All published drives summary'
  - Expected
  + Received
  - All published drives summary
  + "use client";
  +
  + import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
  + import {Disclosure} from "@/components/ui/disclosure";
  ```
- chat-7 learner placements queued closure audit > LEARNER-placements-10 retains OD-38 approved dashboard counts

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-label="Placement snapshot"'
  - Expected
  + Received
  - aria-label="Placement snapshot"
  + import Link from "next/link";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import type { learnerPlacementDashboard } from "@/modules/placements/learner-dashboard-model";
  ```

## tests/unit/mentor-projects-chat7-r06-empty-sprints.test.ts (1 failing)
- mentor empty sprint workflow > MEN-projects-meetings-R06 has truthful empty state and actionable first step

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'No sprints yet. Add the sprints this …'
  - Expected
  + Received
  - No sprints yet. Add the sprints this project should be measured against.
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/proj-break-chat9-services.test.ts (3 failing)
- IIT Dharwad Projects adversarial service and route contracts > PROJ-BREAK-archive-01 archived projects never enter active override counts or result exports

  ```
  AssertionError: expected 'import { and, desc, eq, inArray } fro…' to contain 'ne(projectInstances.status, "ARCHIVED…'
  - Expected
  + Received
  - ne(projectInstances.status, "ARCHIVED")
  + import { and, desc, eq, inArray } from "drizzle-orm";
  + import { getDb } from "@/db/client";
  + import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
  + import { activityEvents, projectInstances, users } from "@/db/schema";
  ```
- IIT Dharwad Projects adversarial service and route contracts > PROJ-BREAK-archive-02 archived project IDs cannot be selected for readiness releases

  ```
  AssertionError: expected 3 to be 2 // Object.is equality
  - Expected
  + Received
  - 2
  + 3
  ```
- IIT Dharwad Projects adversarial service and route contracts > PROJ-BREAK-ux-01 admin and college Project screens preserve explicit empty/denied UX, no raw crash

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain '<EmptyState'
  - Expected
  + Received
  - <EmptyState
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {
  ```

## tests/unit/public-join-client-error-model.test.ts (1 failing)
- REC-calendar-messages-profile-R04/39/45 join errors > rejects mismatched domain and invalid mobile locally

  ```
  AssertionError: expected null to be 'Use your example.org email address fo…' // Object.is equality
  - Expected:
  "Use your example.org email address for this link."
  + Received:
  null
  ```

## tests/unit/recruiter-invite-otp-send-model.test.ts (1 failing)
- T-S1-03 OTP provider-independent send decision > blocks one too many sends for link or shared college

  ```
  AssertionError: expected 'ALLOW' to be 'DENY' // Object.is equality
  Expected: "DENY"
  Received: "ALLOW"
  ```

## tests/unit/super-admin-semesters-read.test.ts (1 failing)
- Super Admin semester read URL > rejects malformed/duplicated filters and never accepts forged college overrides

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
