# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat15-recruiter-change-requests-page-68.test.tsx (1 failing)
- HR-RECRUITER-PAGE-68: scoped drive change-request page > authorized employer gets a populated component without changing party or acting identity

  ```
  TypeError: Converting circular structure to JSON
  --> starting at object with constructor 'Object'
  --- property 'default' closes the circle
  ```

## tests/unit/PROJ-BREAK-chat9-unsubmitted-navigation.test.ts (1 failing)
- IIT Dharwad Projects: unsubmitted page never loses its filters > PROJ-BREAK-submissions-41 the unsubmitted tab does not depend on summary or other delivery results

  ```
  AssertionError: expected '"use client";\nimport { useCallback, …' to contain 'filterView?"?view=NOT_SUBMITTED":"?"'
  - Expected
  + Received
  - filterView?"?view=NOT_SUBMITTED":"?"
  + "use client";
  + import { useCallback, useEffect, useState } from "react";
  + import { useRouter } from "next/navigation";
  + import Link from "next/link";
  ```

## tests/unit/chat11-college-projects-pages-adversarial.test.ts (2 failing)
- PROJ-BREAK-COL-PAGES-01 scope and resilience for all seven College Admin entries > missing optional template labels must not hide actual project workspaces

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'emptyTitle="No Projects match these f…'
  - Expected
  + Received
  - emptyTitle="No Projects match these filters"
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  +
  ```
- PROJ-BREAK-COL-PAGES-01 scope and resilience for all seven College Admin entries > does not produce a class team when authority or published templates are unavailable

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'href="/college/projects/templates"'
  - Expected
  + Received
  - href="/college/projects/templates"
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {CreateProjectControl} from "@/components/projects/project-create-control";
  + import {ClassTeamWorkspaceCreator} from "@/components/projects/class-team-workspace-creator";
  ```

## tests/unit/chat13-application-rescreen.test.ts (1 failing)
- Application re-screen on real academic evidence > SA-placements-projects-21 protects mutation origin and shows scored policy checks without a fake match score

  ```
  AssertionError: expected '"use client";\nimport {Dialog} from "…' to contain 'No fabricated public resume URL or ma…'
  - Expected
  + Received
  - No fabricated public resume URL or match score is shown.
  + "use client";
  + import {Dialog} from "@/components/ui/dialog";
  + import {ConfirmDialog} from "@/components/ui/confirm-dialog";
  + import {Button} from "@/components/ui/button";
  ```
