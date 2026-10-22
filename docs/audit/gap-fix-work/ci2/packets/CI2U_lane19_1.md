# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat15-portfolio-owner-24.test.ts (1 failing)
- HR-PORTFOLIO-OWNER-24 no unauthorized employer portfolio enumeration > HR-PORTFOLIO-ARCHIVE-36 excludes archived and unpublished drives before returning an employer portfolio

  ```
  AssertionError: expected 'export async function listOwnRecruite…' to contain 'eq(placementCompanyRelationships.stat…'
  - Expected
  + Received
  - eq(placementCompanyRelationships.status,
  + export async function listOwnRecruiterPlacementJobs(
  +   context: RequestContext,
  +   collegeId?: string,
  +   options: {limit?:number;jobIds?:readonly string[]} = {},
  ```

## tests/unit/HR-BREAK-chat19-company-team-grant-id.test.ts (1 failing)
- HR-BREAK-TEAM-GRANT-14: stale grant ID cannot be rescued by another active grant > queries persistence for the exact selected grant ID, same user and relationship before listing team

  ```
  AssertionError: expected 5958 to be less than -1
  ❯ tests/unit/HR-BREAK-chat19-company-team-grant-id.test.ts:45:15
  43|    "eq(placementCompanyRelationships.companyId, recruiter.companyId)",
  44|   ])expect(query).toContain(scope);
  45|   expect(end).toBeLessThan(source.indexOf("const team = await db"));
  |               ^
  46|  });
  47|  it("never accepts another college ID or a borrowed recruiter identity…
  ```

## tests/unit/HR-BREAK-chat19-today-offer-withdrawn.test.ts (1 failing)
- HR-BREAK-OFFER-FOLLOWUP-15: withdrawn/unshared students never produce recruiter follow-ups > the service applies each corresponding persisted eligibility predicate before aggregating offer counts

  ```
  AssertionError: expected '.where(and(inArray(placementJobs.id,i…' to contain 'eq(placementJobs.status,"PUBLISHED")'
  - Expected
  + Received
  - eq(placementJobs.status,"PUBLISHED")
  + .where(and(inArray(placementJobs.id,ids),eq(placementJobs.collegeId,collegeId),
  +    inArray(placementJobs.status,[...HR_FOLLOWUP_JOB_STATUSES]),
  +    isNull(placementJobs.archivedAt),
  +    // A withdrawn candidate must not resurface in the recruiter's queue
  ```

## tests/unit/PROJ-BREAK-SA-unsubmitted-search.test.ts (2 failing)
- Super Admin not-submitted Projects directory abuse > PROJ-BREAK-SA-21 enforces bounded paging, trimmed search and forbids arbitrary query keys

  ```
  AssertionError: {"status":"ARCHIVED"}: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
- Super Admin not-submitted Projects directory abuse > PROJ-BREAK-SA-22 keeps selected-college authorization, archive exclusion and SQL NOT EXISTS on the query itself

  ```
  AssertionError: expected 'import "server-only";\nimport {z} fro…' to contain 'eq(projectSubmissions.projectId,proje…'
  - Expected
  + Received
  - eq(projectSubmissions.projectId,projectInstances.id)
  + import "server-only";
  + import {z} from "zod";
  + import {and,asc,count,eq,ilike,ne,notExists,or,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  ```

## tests/unit/PROJ-BREAK-chat14-mentor-sprint-create-service.test.ts (1 failing)
- IIT Dharwad Mentor Sprint creation state and access > PROJ-BREAK-MENTOR-308 creates exactly one planned sprint and audit in assigned project

  ```
  TypeError: existingKeys.filter is not a function
  ❯ src/modules/projects/mentor-sprint-write-service.ts:73:35
  71|         deletedAt:projectSprints.deletedAt,
  72|       }).from(projectSprints).where(eq(projectSprints.projectId,scope.…
  73|       const liveKeys=existingKeys.filter(row=>!row.deletedAt);
  |                                   ^
  74|       if(liveKeys.length>=500)
  75|         throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
  ```

## tests/unit/PROJ-BREAK-chat9-admin-IST-dates.test.ts (2 failing)
- IIT Dharwad Projects Admin IST date-boundary integrity > PROJ-BREAK-admin-time-33 the workspace card and scoped export show the same IST calendar day at UTC midnight

  ```
  AssertionError: expected '\ufeff"Workspace","Status","Progress"…' to contain '"02/06/99"'
  - Expected
  + Received
  - "02/06/99"
  + ﻿"Workspace","Status","Progress","Mentor","Template ID"
  + "IIT Dharwad","In progress","50","Mentor","Not available"
  +
  ```
- IIT Dharwad Projects Admin IST date-boundary integrity > PROJ-BREAK-admin-exports-35 Super Admin export uses the same visible status and timezone as cards

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'collegeWorkspaceStatusLabel(r.status,…'
  - Expected
  + Received
  - collegeWorkspaceStatusLabel(r.status,r.riskReasons)
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {useState} from "react";
  + import {projectAdminCsv} from "@/modules/projects/project-admin-csv-model";
  ```
