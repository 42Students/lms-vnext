# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-placements-round2-legacy-navigation.test.ts (2 failing)
- Learner Placements legacy request/nav surfaces > LEARNER-placements-46 links announcements and personal updates separately

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' to contain 'href="#college-notices"'
  - Expected
  + Received
  - href="#college-notices"
  + import { Banner } from "@/components/ui/banner";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  ```
- Learner Placements legacy request/nav surfaces > LEARNER-placements-55 provides all three anchored placement cell sections

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

## tests/unit/mentor-resource-audit-archive.test.ts (1 failing)
- keeps archive resource audit inside the project transaction with safe metadata

  ```
  AssertionError: expected '{"projectId":"project-a","resourceId"…' not to contain 'Reference'
  Expected: "Reference"
  Received: "{"projectId":"project-a","resourceId":"resource-a","resourceKey":"resource-a","actionType":"DELETE","beforeJson":null,"afterJson":{"title":"Reference =unsafe","sequence":null,"required":null,"visibility":null,"resourceType":null,"status":null,"pinned":null,"legacyResourceKind":null,"url":
  ```

## tests/unit/projects-mentor-route-guards-chat14.test.ts (1 failing)
- chat-14 mentor route guards and friendly API error handling > requires a confirmed release version from a same-origin authenticated DELETE

  ```
  AssertionError: expected 'import {NextResponse} from "next/serv…' to contain 'releaseId,"DELETE",await request.json…'
  - Expected
  + Received
  - releaseId,"DELETE",await request.json()
  + import {NextResponse} from "next/server";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {isSameOriginRequest} from "@/auth/origin";
  + import {apiErrorResponse} from "@/lib/api-error";
  ```

## tests/unit/recruiter-chat14-autoapprove-contract.test.ts (2 failing)
- REC-home-drives-33 recruiter formal request auto approval > REC-home-drives-33 safeguards request replay against duplicate job creation

  ```
  AssertionError: expected 'import "server-only";\nimport {and,de…' to contain 'return {request:existing,replayed:tru…'
  - Expected
  + Received
  - return {request:existing,replayed:true}
  + import "server-only";
  + import {and,desc,eq,inArray,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {activityEvents,collegeMemberships,colleges,inAppNotifications,membershipRoles,
  ```
- REC-home-drives-33 recruiter formal request auto approval > REC-home-drives-33 tells recruiters an autoapproved draft awaits publication, not review

  ```
  AssertionError: expected 'Approved awaiting publication' to be 'Approved — awaiting publication' // Object.is equality
  Expected: "Approved — awaiting publication"
  Received: "Approved awaiting publication"
  ```

## tests/unit/sa-tenants-modules-20-primary-domain-transition.test.ts (1 failing)
- SA-tenants-modules-20 clears any former primary before promoting managed address

  ```
  AssertionError: expected 'if(current){\n   await tx.update(tena…' to contain 'eq(tenantDomains.isPrimary,true)'
  - Expected
  + Received
  - eq(tenantDomains.isPrimary,true)
  + if(current){
  +    await tx.update(tenantDomains).set({
  +     deletedAt:now,isPrimary:false,isVerified:false,verificationToken:null,
  +     updatedAt:now,lastCheckResult:"MANAGED_RETIRED",
  ```

## tests/unit/super-admin-template-plan-editor.test.ts (2 failing)
- SA-placements-projects-83 Sprint repeating editor > renaming the sprint preserves its tasks and rejects deleting a populated sprint

  ```
  AssertionError: the given combination of arguments (null and string) is invalid for this assertion. You can use an array, a map, an object, a set, a string, or a weakset instead of a string
  ❯ tests/unit/super-admin-template-plan-editor.test.ts:33:63
  31|     const renamed = updateTemplateSprint(parse(), 0, { key: "sprint-ne…
  32|     expect(renamed.tasks[0].sprintKey).toBe("sprint-new");
  33|     expect(removeTemplateSprint(renamed, "sprint-new").error).toContai…
  |                                                               ^
  34|     expect(projectTemplateBlueprintSchema.safeParse(renamed).success).…
  35|   });
  ```
- SA-placements-projects-84 Task repeating editor > validates priority, sprint reference, and 1-13 point estimates

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
