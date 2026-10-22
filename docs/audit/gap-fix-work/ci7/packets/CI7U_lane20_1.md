# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-submissions-tabs-resilience.test.tsx (1 failing)
- IIT Dharwad Projects: adversarial tab outage and pagination journeys > PROJ-BREAK-submissions-41 unsubmitted-only navigation never calls final-delivery services

  ```
  AssertionError: expected null to deeply equal { page: 2, pageCount: 2 }
  - Expected:
  {
  "page": 2,
  "pageCount": 2,
  }
  + Received:
  null
  ```

## tests/unit/api-origin-guard.test.ts (1 failing)
- state-changing API routes > every POST/PUT/PATCH/DELETE handler checks the request origin

  ```
  AssertionError: Handlers that change state without a same-origin check:
  src/app/api/internal/operations/notification-scheduler/route.ts POST
  src/app/api/internal/placements/tpo/deadline-today/route.ts POST
  src/app/api/internal/placements/tpo/interview-evening/route.ts POST
  src/app/api/internal/placements/tpo/offer-expiry/run/route.ts POST
  src/app/api/internal/storage/scan-verdict/route.ts POST
  src/app/api/lecture-halls/[hallId]/route.ts PUT
  src/app/api/notifications/[notificationId]/delete/route.ts DELETE
  ```

## tests/unit/chat13-academic-page-copy.test.ts (1 failing)
- Super Admin Academic Setup page copy > SA-academics-people-02 shows the legacy no-college guidance without exposing the six-step strip

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'data ? <AcademicSetupSteps'
  - Expected
  + Received
  - data ? <AcademicSetupSteps
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  + import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
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
