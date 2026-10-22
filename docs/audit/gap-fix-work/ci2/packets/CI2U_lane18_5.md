# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat12-final-course-announcements.test.ts (2 failing)
- LEARNER-home-courses-14 official class announcements > LEARNER-home-courses-14 requires a validated learner and owned class

  ```
  AssertionError: expected 'import "server-only";\nimport {and,de…' to contain 'member.roles.includes("LEARNER")'
  - Expected
  + Received
  - member.roles.includes("LEARNER")
  + import "server-only";
  + import {and,desc,eq,inArray,isNull,lte,gt,or} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {z} from "zod";
  ```
- LEARNER-home-courses-14 official class announcements > LEARNER-home-courses-14 shows exactly the latest two official class notices

  ```
  AssertionError: expected 'import { StatTile } from "@/component…' to contain 'key: `announcement-${update.id}`'
  - Expected
  + Received
  - key: `announcement-${update.id}`
  + import { StatTile } from "@/components/ui/stat-tile";
  + import { Badge } from "@/components/ui/badge";
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  ```

## tests/unit/chat12-round27-request-grid.test.ts (1 failing)
- TPO Requests grid and 500 row parity > TPO-requests-verification-16 provides 500-row server paging, column selection, sticky students, selected copy, and Ask/Decided sort

  ```
  AssertionError: expected '"use client";\nimport { Checkbox } fr…' to contain 'sm:sticky sm:left-10'
  - Expected
  + Received
  - sm:sticky sm:left-10
  + "use client";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat12-tpo-company-share-history-behavior.test.ts (1 failing)
- TPO-companies-11 historical applicant sharing is scoped, bounded and honest > reader joins share college to job college and caps history at 100 rows

  ```
  AssertionError: expected 'import "server-only";\nimport {and,de…' to contain 'inArray(placementCompanyApplicantShar…'
  - Expected
  + Received
  - inArray(placementCompanyApplicantShares.jobId,[...jobIds])
  + import "server-only";
  + import {and,desc,eq,inArray,sql} from "drizzle-orm";
  + import {placementCompanyShareSelections} from "@/db/schema/placement-company-share-selection";
  + import {getDb} from "@/db/client";
  ```

## tests/unit/chat13-academic-attendance-policy.test.ts (1 failing)
- Super Admin Academic Attendance > SA-academics-people-32 preserves exact legacy attendance-policy copy and accessible errors

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'How long after a class ends attendanc…'
  - Expected
  + Received
  - How long after a class ends attendance can be marked or corrected.
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import {useToast} from "@/components/ui/toast";
  ```

## tests/unit/chat13-company-global-edit.test.ts (1 failing)
- Super Admin canonical company editor > SA-placements-projects-26 protects concurrent edits with millisecond CAS and atomic audit

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' to contain 'Another company already uses this nam…'
  - Expected
  + Received
  - Another company already uses this name.
  + import "server-only";
  + import {and,eq,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {placementCompanies} from "@/db/schema";
  ```

## tests/unit/chat13-placement-create-safety.test.ts (1 failing)
- Super Admin create and edit drive safety > SA-placements-projects-16 renders a concrete season recovery link and keeps creation disabled without an active season

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useState…' to contain 'disabled={pending || !activeSeason ||…'
  - Expected
  + Received
  - disabled={pending || !activeSeason || uncertainCreate}
  + "use client";
  +
  + import {
  +   useState,
  ```
