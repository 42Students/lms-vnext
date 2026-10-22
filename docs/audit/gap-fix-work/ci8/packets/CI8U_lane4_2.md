# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-placements-admin-mutations.test.ts (1 failing)
- chat-13 additional admin mutation and recruiter account security > SA-PUBLISHED-DRIVE-EDIT-01 refuses tampered versions, arbitrary labels, duplicate locations and reversed CTC

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

## tests/unit/chat2-final-sprint-recruiter-messages.test.ts (1 failing)
- Final sprint recruiter conversations verification > REC-calendar-messages-profile-13 refreshes visible recruiter discussions at four seconds and on focus without GET writes

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' not to contain 'fetch('
  - Expected
  + Received
  - fetch(
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import { Button } from "@/components/ui/button";
  ```
