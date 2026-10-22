# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat15-notifications-page-97.test.tsx (2 failing)
- HR-NOTIFICATIONS-PAGE-97 private recruiter notices and recovery > array, invalid sort and oversized search filters produce a safe reset

  ```
  AssertionError: expected '  Notifications   Invalid inbox filte…' to contain 'Invalid inbox filter.'
  Expected: "Invalid inbox filter."
  Received: "  Notifications   Invalid inbox filter Review the college, search and unread options. "
  ```
- HR-NOTIFICATIONS-PAGE-97 private recruiter notices and recovery > authorized empty notification inbox is distinct from conversations

  ```
  AssertionError: expected [ '/hr/messages' ] to include '/hr/conversations'
  ❯ tests/unit/HR-BREAK-chat15-notifications-page-97.test.tsx:66:25
  64|   const output=await view({unreadOnly:"true"});
  65|   expect(text(output)).toContain("No matching notifications for this e…
  66|   expect(links(output)).toContain("/hr/conversations");
  |                         ^
  67|   expect(m.list).toHaveBeenCalledWith(actor,expect.objectContaining({u…
  68|  });
  ```

## tests/unit/HR-BREAK-chat19-closed-offer-company-touch.test.ts (1 failing)
- UX-HR-COMPANY-TOUCH-42 keyboard accessible company/team tabs and college selector > provides phone-sized tab links, college selectors and focus-visible recovery

  ```
  AssertionError: expected 'import {NeedsDoingChips} from "@/comp…' to contain 'inline-flex min-h-11 items-center bor…'
  - Expected
  + Received
  - inline-flex min-h-11 items-center border-b-2 border-primary
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import {getDb} from "@/db/client";
  + import {placementCompanies} from "@/db/schema";
  + import {eq} from "drizzle-orm";
  ```

## tests/unit/HR-BREAK-chat19-team-attribution.test.ts (1 failing)
- HR-BREAK-TEAM-ATTRIBUTION-40: count approved drives, never stale request history > college branch suggestions fail closed for mismatched recruiter principal

  ```
  AssertionError: expected 'import "server-only";\nimport type {R…' to contain 'context.recruiter.userId!==context.us…'
  - Expected
  + Received
  - context.recruiter.userId!==context.user.id
  + import "server-only";
  + import type {RequestContext} from "@/modules/identity/context";
  + import { getRecruiterCollegeDemographics } from "./recruiter-college-demographics-service";
  + import { recruiterCollegeCardDetail } from "./recruiter-college-card-service";
  ```

## tests/unit/PROJ-BREAK-SA-security-and-resilience.test.ts (5 failing)
- Super Admin Projects adversarial controls > PROJ-BREAK-SA-02 denies removed memberships, inactive actors and non-admin roles without exposing a lock button

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'allowLock&&canAdminSettleDelivery(sta…'
  - Expected
  + Received
  - allowLock&&canAdminSettleDelivery(status,locked,projectStatus,"LOCK")
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Banner } from "@/components/ui/banner";
  + import {StatusBadge} from "@/components/ui/status-badge";
  ```
- Super Admin Projects adversarial controls > PROJ-BREAK-SA-18 denies role revocation, identity suspension, mismatched scope and forged actor during delivery lock

  ```
  AssertionError: expected 1965 to be greater than 2507
  ❯ tests/unit/PROJ-BREAK-SA-security-and-resilience.test.ts:97:23
  95|     expect(txStart).toBeGreaterThanOrEqual(0);
  96|     expect(rowLock).toBeGreaterThan(txStart);
  97|     expect(persisted).toBeGreaterThan(rowLock);
  |                       ^
  98|     expect(validation).toBeGreaterThan(persisted);
  99|     expect(event).toBeGreaterThan(validation);
  ```
- Super Admin Projects adversarial controls > PROJ-BREAK-SA-04 keeps same-origin enforcement on Super Admin delivery mutations

  ```
  AssertionError: expected 539 to be less than -1
  ❯ tests/unit/PROJ-BREAK-SA-security-and-resilience.test.ts:106:59
  104|     const route = read("src/app/api/projects/[projectId]/submissions/[…
  105|     expect(route).toContain("isSameOriginRequest(request)");
  106|     expect(route.indexOf("isSameOriginRequest(request)")).toBeLessThan…
  |                                                           ^
  107|     expect(route).toContain("apiErrorResponse(error)");
  108|     const service = read("src/modules/projects/admin-submission-review…
  ```
- Super Admin Projects adversarial controls > PROJ-BREAK-SA-06 prevents a selected organization or college reading foreign template availability

  ```
  AssertionError: expected 'import { getDb } from "@/db/client";\…' to contain 'templateAvailabilityCollegesInScope(c…'
  - Expected
  + Received
  - templateAvailabilityCollegesInScope(colleges, context.adminScope ?? null)
  + import { getDb } from "@/db/client";
  + import { and, asc, eq, ilike, isNull } from "drizzle-orm";
  + import { colleges, organizations, legacyIdMap, projectTemplates,
  +   projectTemplateCollegeAssignments, projectTemplateVersions } from "@/db/schema";
  ```
- Super Admin Projects adversarial controls > PROJ-BREAK-SA-08 keeps Super Admin project lists scoped, paginated, and permission gated

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'title="No college selected"'
  - Expected
  + Received
  - title="No college selected"
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {
  ```

## tests/unit/PROJ-BREAK-chat14-mentor-shared-route-http.test.ts (2 failing)
- PROJ-BREAK-MENTOR-205..210 shared project HTTP authorization and role dispatch > PROJ-BREAK-MENTOR-207 authorized mutations delegate exact project scope and JSON once

  ```
  AssertionError: expected undefined to match object { title: 'Sprint checkpoint' }
  - Expected:
  {
  "title": "Sprint checkpoint",
  }
  + Received:
  undefined
  ```
- PROJ-BREAK-MENTOR-205..210 shared project HTTP authorization and role dispatch > PROJ-BREAK-MENTOR-210 malformed JSON never reaches create/update service

  ```
  AssertionError: release create: expected 400 to be 401 // Object.is equality
  - Expected
  + Received
  - 401
  + 400
  ```

## tests/unit/PROJ-BREAK-chat7-learner-readonly-model-matrix.test.ts (1 failing)
- PROJ-BREAK-LEARNER-99 read-only role journey and data leak regressions > searches only the authorized project summary and preserves safe filters without modal URLs

  ```
  AssertionError: expected '/learn/projects/11111111-1111-4111-81…' not to contain 'taskId='
  Expected: "taskId="
  Received: "/learn/projects/11111111-1111-4111-8111-111111111111?tab=activity&taskSearch=capstone&priority=HIGH&activityFrom=2099-01-01&taskId=22222222-2222-4222-8222-222222222222&page=999"
  ```
