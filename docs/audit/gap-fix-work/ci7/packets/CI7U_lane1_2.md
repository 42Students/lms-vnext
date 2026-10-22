# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-inbound-mail-admin-page-16.test.tsx (1 failing)
- chat-16 inbound-mail Super Admin page-level failure and privacy journeys > UX-chat16-inbound-mail-02 renders a safe reset instead of querying an invalid recipient or page

  ```
  AssertionError: expected ' Every email sent to a 42lms.com addr…' to contain 'Invalid filters.'
  Expected: "Invalid filters."
  Received: " Every email sent to a 42lms.com address. Recruiters' replies to a conversation go straight into it; anything else waits here until someone reads it and marks it done. Private platform-wide inbox. Failed recruiter replies remain available for manual triage; this view never sends automatic
  ```

## tests/unit/chat2-final-sprint-recruiter-profile-company.test.ts (3 failing)
- Final sprint recruiter profile/company verification > REC-calendar-messages-profile-32 provides scoped company name, safe website, domain, industry fallback and initials

  ```
  AssertionError: expected 'import {NeedsDoingChips} from "@/comp…' to contain 'One company for everyone at it.'
  - Expected
  + Received
  - One company for everyone at it.
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import {getDb} from "@/db/client";
  + import {placementCompanies} from "@/db/schema";
  + import {eq} from "drizzle-orm";
  ```
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

## tests/unit/chat3-tenant-public-verified-round13.test.ts (2 failing)
- Chat-3 owner-backed tenant/public gap dispositions > SA-tenants-modules-06 has two scoped URL-persisted tenant setup steps

  ```
  AssertionError: expected 'import {PageBackLink} from "@/compone…' to contain 'requirePermission(context,"admin-scop…'
  - Expected
  + Received
  - requirePermission(context,"admin-scope.select")
  + import {PageBackLink} from "@/components/ui/page-back-link";
  + import Link from "next/link";
  + import {notFound} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```
- Chat-3 owner-backed tenant/public gap dispositions > SA-tenants-modules-19 retains college-scoped activity read and authorized CSV without a duplicate GET write

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'collegeId: one(params.collegeId)'
  - Expected
  + Received
  - collegeId: one(params.collegeId)
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {
  ```

## tests/unit/chat4-superadmin-college-admins-list-page.test.tsx (4 failing)
- SA-colleges-admins-list-01 tenant administrator roster page > renders the empty/permission-safe scoped directory without invented admins

  ```
  Error: [vitest] No "listCollegeAdminSessionTargetsPage" export is defined on the "@/modules/colleges/admin-session-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/colleges/admin-session-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- SA-colleges-admins-list-01 tenant administrator roster page > renders real role/status and authorized nested device and history URLs

  ```
  Error: [vitest] No "listCollegeAdminSessionTargetsPage" export is defined on the "@/modules/colleges/admin-session-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/colleges/admin-session-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- SA-colleges-admins-list-01 tenant administrator roster page > discloses a 500-record cap rather than presenting incomplete rosters as exhaustive

  ```
  Error: [vitest] No "listCollegeAdminSessionTargetsPage" export is defined on the "@/modules/colleges/admin-session-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/colleges/admin-session-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- SA-colleges-admins-list-01 tenant administrator roster page > does not render administrator details when the scoped service denies the actor

  ```
  AssertionError: expected [Function] to throw error including 'REVOKED' but got '[vitest] No "listCollegeAdminSessionT…'
  - Expected
  + Received
  - REVOKED
  + [vitest] No "listCollegeAdminSessionTargetsPage" export is defined on the "@/modules/colleges/admin-session-service" mock. Did you forget to return it from "vi.mock"?
  + If you need to partially mock a module, you can use "importOriginal" helper inside:
  +
  ```
