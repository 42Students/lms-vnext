# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat2-tpo-recruiter-message-picker.test.ts (1 failing)
- TPO-inbox-team-02 recruiter message picker > does not accept a client-supplied college scope

  ```
  AssertionError: expected 'import {NextResponse} from "next/serv…' to contain 'z.strictObject({recruiterUserId'
  - Expected
  + Received
  - z.strictObject({recruiterUserId
  + import {NextResponse} from "next/server";
  + import {z} from "zod";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {isSameOriginRequest} from "@/auth/origin";
  ```

## tests/unit/chat2-ux-tpo-students-team.test.ts (1 failing)
- TPO student and team UX contracts > UX-tpo-tpo-team-01 preserves page semantics and responsive action targets

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain '<PageHeader'
  - Expected
  + Received
  - <PageHeader
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/chat3-sa-academics-workspace-bounded-concurrency.test.ts (1 failing)
- SA-ACADEMICS-SPACE-01 bounded academic workspace fanout > preserves program order while limiting concurrent academic read workers

  ```
  AssertionError: expected 2 to be 3 // Object.is equality
  - Expected
  + Received
  - 3
  + 2
  ```

## tests/unit/chat4-college-admin-project-route-journey.test.ts (3 failing)
- PROJ-BREAK-COLLEGE-04 College Admin projects route journey > PROJ-BREAK-COLLEGE-04-11 resolves an authorized college before any project list query

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'listProjectAdminSnapshots(context, co…'
  - Expected
  + Received
  - listProjectAdminSnapshots(context, collegeId, query)
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  +
  ```
- PROJ-BREAK-COLLEGE-04 College Admin projects route journey > PROJ-BREAK-COLLEGE-04-12 invalid filters recover without a SQL read or a leaked error code

  ```
  AssertionError: expected 2450 to be less than -1
  ❯ tests/unit/chat4-college-admin-project-route-journey.test.ts:19:50
  17|   it("PROJ-BREAK-COLLEGE-04-12 invalid filters recover without a SQL r…
  18|     const page = read("src/app/(authenticated)/college/projects/page.t…
  19|     expect(page.indexOf("if (!parsed.success)")).toBeLessThan(page.ind…
  |                                                  ^
  20|     expect(page).toContain("Invalid project filters");
  21|     expect(page).toContain("Clear filters");
  ```
- PROJ-BREAK-COLLEGE-04 College Admin projects route journey > PROJ-BREAK-COLLEGE-04-13 optional template label lookup cannot hide persisted projects

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Archived workspaces'
  - Expected
  + Received
  - Archived workspaces
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  +
  ```

## tests/unit/chat4-college-structure-decimal-query.test.ts (1 failing)
- College Admin academic structure query integrity > COL-STRUCTURE-DECIMAL-01 accepts decimal URL pagination but not exponents, hex, signs, whitespace or floats

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat4-learner-discussion-poll-r22.test.ts (2 failing)
- LEARNER-home-courses-22 bounded discussion refresh > LEARNER-home-courses-22 validates tenant-scoped central polling interval

  ```
  AssertionError: expected 3000 to be null
  - Expected:
  null
  + Received:
  3000
  ```
- LEARNER-home-courses-22 bounded discussion refresh > LEARNER-home-courses-22 uses validated interval only while visible and allows configured failure fallback

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' to contain '.catch(()=>({...LEARNER_PLAYBACK_DEFA…'
  - Expected
  + Received
  - .catch(()=>({...LEARNER_PLAYBACK_DEFAULTS}))
  + import { Banner } from "@/components/ui/banner";
  + import { CoursesServiceError } from "@/modules/courses/errors";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  + import { ZodError } from "zod";
  ```
