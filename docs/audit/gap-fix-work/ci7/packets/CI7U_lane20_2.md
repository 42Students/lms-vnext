# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

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

## tests/unit/chat3-superadmin-academics-people-audit-r2.test.ts (1 failing)
- Chat-3 second-eye Super Admin academics and people audit > SA3-PEOPLE-04 directory has explicit no-scope state, read-only masking, URL filter and pagination

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'title="No matching users"'
  - Expected
  + Received
  - title="No matching users"
  + import Link from "next/link";
  + import { SuperAdminPeopleCsvControl } from "@/components/admin/super-admin-people-csv-control";
  + import { superAdminPeopleExportHref } from "@/modules/people/admin-users-export-model";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/chat4-superadmin-branding-page-journey.test.tsx (1 failing)
- SA-colleges-branding-page-01 tenant branding permissions and honest editor state > rejects a missing or out-of-scope tenant preview

  ```
  AssertionError: expected "vi.fn()" to not be called at all, but actually been called 1 times
  Received:
  1st vi.fn() call:
  Array [
  Object {
  "adminScope": Object {
  "collegeId": "11111111-1111-4111-8111-111111111111",
  "organizationId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  ```

## tests/unit/chat6-admin-second-third-placements.test.ts (1 failing)
- /admin placements second-third: scoping, filtering, counts, links > CHAT6-ADMIN-DRIVES-01 maps only published drives to active and caps paginated results

  ```
  AssertionError: expected 'Expired' to be 'Open · Expired' // Object.is equality
  Expected: "Open · Expired"
  Received: "Expired"
  ```
