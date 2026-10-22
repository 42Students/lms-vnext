# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-admin-programs-page.test.tsx (2 failing)
- Super Admin last-third Programs: cross-role, partial outage and scoped directory > UX-admin-programs-37 missing selected college never performs cross-tenant fallback

  ```
  Error: [vitest] No "listGlobalProgramsForSuperAdmin" export is defined on the "@/modules/academics/program-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/academics/program-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- Super Admin last-third Programs: cross-role, partial outage and scoped directory > UX-admin-programs-38 any essential directory outage displays an honest retry, never a false zero-program list

  ```
  AssertionError: expected 'Programs We could not load this page …' to contain 'Programs unavailable'
  Expected: "Programs unavailable"
  Received: "Programs We could not load this page The selected college's program directory could not be verified. No changes were made. Retry loading programs /admin/programs"
  ```

## tests/unit/UX-superadmin-legacy-01.test.ts (1 failing)
- UX-superadmin-legacy-01 > preserves original wording, permissions and supported accessible UX

  ```
  AssertionError: expected 'import { createHash } from "node:cryp…' to contain 'return redirect(destination+'
  - Expected
  + Received
  - return redirect(destination+
  + import { createHash } from "node:crypto";
  + import { and, eq, isNull, sql } from "drizzle-orm";
  + import { notFound, redirect } from "next/navigation";
  + import { ErrorState } from "@/components/ui/error-state";
  ```

## tests/unit/chat12-tpo-company-share-history-behavior.test.ts (1 failing)
- TPO-companies-11 historical applicant sharing is scoped, bounded and honest > reader joins share college to job college and caps history at 100 rows

  ```
  AssertionError: expected 'import "server-only";\nimport {and,de…' to contain 'orderBy(desc(placementCompanyApplican…'
  - Expected
  + Received
  - orderBy(desc(placementCompanyApplicantShares.createdAt))
  + import "server-only";
  + import {and,desc,eq,inArray,sql} from "drizzle-orm";
  + import {placementCompanyShareSelections} from "@/db/schema/placement-company-share-selection";
  + import {getDb} from "@/db/client";
  ```

## tests/unit/chat15-assignment-material-links.test.ts (1 failing)
- Faculty-authored learner assignment materials > LEARNER-learning-misc-02 validates faculty authoring, optimistic parent locking, and same-origin mutation

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'rows.some(row=>row.externalUrl.toLowe…'
  - Expected
  + Received
  - rows.some(row=>row.externalUrl.toLowerCase()
  + import "server-only";
  + import {and,asc,eq,sql} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```
