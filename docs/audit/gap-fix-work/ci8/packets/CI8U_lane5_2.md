# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-published-drive-edit.test.ts (1 failing)
- Super Admin published drive editing > SA-placements-projects-13 enforces selected-college and optimistic version locks

  ```
  AssertionError: expected 'import "server-only";\nimport {and,co…' to contain '!["PUBLISHED","CLOSED","CANCELLED","A…'
  - Expected
  + Received
  - !["PUBLISHED","CLOSED","CANCELLED","ARCHIVED"].includes(job.status)
  + import "server-only";
  + import {and,count,eq,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {placementApplications,placementJobs,placementJobRoleOptions,placementSeasons,placementCompanyRelationships} from "@/db/schema";
  ```

## tests/unit/chat2-final-sprint-recruiter-profile-company.test.ts (2 failing)
- Final sprint recruiter profile/company verification > REC-calendar-messages-profile-36 matches legacy recruiter company header label without CSS changes

  ```
  AssertionError: expected 'import {NeedsDoingChips} from "@/comp…' to contain 'description={"Your work with " + resu…'
  - Expected
  + Received
  - description={"Your work with " + result.grant.collegeName}
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import {getDb} from "@/db/client";
  + import {placementCompanies} from "@/db/schema";
  + import {eq} from "drizzle-orm";
  ```
- Final sprint recruiter profile/company verification > REC-calendar-messages-profile-36 independent final-sprint acceptance regression

  ```
  AssertionError: expected 'import {NeedsDoingChips} from "@/comp…' to contain 'description={"Your work with " + resu…'
  - Expected
  + Received
  - description={"Your work with " + result.grant.collegeName}
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import {getDb} from "@/db/client";
  + import {placementCompanies} from "@/db/schema";
  + import {eq} from "drizzle-orm";
  ```
