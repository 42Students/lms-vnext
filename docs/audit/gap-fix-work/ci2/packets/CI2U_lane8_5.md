# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat11-tpo-team-preferences-guard-and-retries.test.ts (1 failing)
- TPO-settings-audit-PREF-TEAM-01 tenant-safe personal team preferences > rebuilds persisted active TPO or College Admin team role inside both read and write transactions

  ```
  AssertionError: expected 'import {hasPlacementTeamMembership} f…' to contain 'if(!changed)return {following,muted:!…'
  - Expected
  + Received
  - if(!changed)return {following,muted:!!mutedAt}
  + import {hasPlacementTeamMembership} from "./placement-team-access-model";
  + import {planTpoThreadPreferenceChange,tpoTeamPreferenceActionSchema} from "./tpo-team-preference-state-model";
  + export {tpoTeamPreferenceActionSchema} from "./tpo-team-preference-state-model";
  + import "server-only";
  ```

## tests/unit/chat12-profile-facets-round6.test.ts (1 failing)
- TPO saved profile count facets > TPO-students-31 uses saved profile and separate placement readiness

  ```
  AssertionError: expected 'import {\n  getLearnerPlacementAccess…' to contain 'profileFacts:tpoStudentProfileFacts'
  - Expected
  + Received
  - profileFacts:tpoStudentProfileFacts
  + import {
  +   getLearnerPlacementAccess,
  +   type ResolvedPlacementParticipation,
  + } from "./batch-eligibility-policy";
  ```

## tests/unit/chat12-round4-request-contracts.test.ts (1 failing)
- chat-12 Requests and Verification contracts, source-only > TPO-requests-verification-25 preserves contract

  ```
  AssertionError: expected '"use client";\nimport { Select } from…' to contain 'Review one by one ('
  - Expected
  + Received
  - Review one by one (
  + "use client";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  + import {useRouter,useSearchParams} from "next/navigation";
  ```

## tests/unit/chat12-tpo-prep-assignment-persisted-role.test.ts (2 failing)
- TPO-students-10 preparation assignment current TPO permission boundary > preserves a second persisted actor lock inside the write transaction, before creating any notice

  ```
  AssertionError: expected -1 to be greater than -1
  ❯ tests/unit/chat12-tpo-prep-assignment-persisted-role.test.ts:59:17
  57|   const lock=src.indexOf('for("update").limit(1)',guard);
  58|   const notification=src.indexOf("await tx.insert(inAppNotifications)"…
  59|   expect(guard).toBeGreaterThan(tx);
  |                 ^
  60|   expect(lock).toBeGreaterThan(guard);
  61|   expect(notification).toBeGreaterThan(lock);
  ```
- TPO-students-10 preparation assignment current TPO permission boundary > TPO-students-10 optional deadline requires registered nullable storage and preserves the no-deadline state

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' to contain 'dueAt:z.iso.datetime({offset:true}).n…'
  - Expected
  + Received
  - dueAt:z.iso.datetime({offset:true}).nullable().optional()
  + import "server-only";
  + import {and,eq,inArray,isNull,sql} from "drizzle-orm";
  + import {tpoPrepAssignmentInputSchema} from "./tpo-prep-assignment-model";
  + import {summarizeTpoPrepAssignment} from "./tpo-prep-assignment-result-model";
  ```

## tests/unit/chat13-admin-placement-directory-and-identity-adversarial.test.ts (3 failing)
- chat-13 Super Admin placements: adversarial directory, company identity and HR filters > SA-ADMIN-DRIVE-01 rejects malicious pagination/status and never lets URL params escape query encoding

  ```
  AssertionError: expected { q: '', status: 'ALL', page: 1, …(1) } to match object { status: 'ALL', q: '', page: 1, …(1) }
  - Expected
  + Received
  {
  "page": 1,
  -   "pageSize": 10,
  +   "pageSize": 20,
  "q": "",
  ```
- chat-13 Super Admin placements: adversarial directory, company identity and HR filters > SA-ADMIN-DRIVE-02 filters by actual published status, company and lowercases without changing input

  ```
  AssertionError: expected 'Expired' to be 'Open · Expired' // Object.is equality
  Expected: "Open · Expired"
  Received: "Expired"
  ```
- chat-13 Super Admin placements: adversarial directory, company identity and HR filters > SA-COMPANY-IDENTITIES-01 rejects claiming email hosts, college domains and malformed DNS input

  ```
  AssertionError: http://acme.example: expected [Function] to throw an error
  ❯ tests/unit/chat13-admin-placement-directory-and-identity-adversarial.test.ts:42:52
  40|   expect(normalizeCompanyDomain(" Employee@WWW.Acme.Example ")).toBe("…
  41|   for(const input of ["gmail.com","finance@outlook.com","yahoo.com","c…
  42|    expect(()=>normalizeCompanyDomain(input),input).toThrow();
  |                                                    ^
  43|   }
  44|   expect(companyDomainCommandSchema.safeParse({companyId:uuid,action:"…
  ```

## tests/unit/chat13-hiring-report-confirmed-hired.test.ts (2 failing)
- SA-HIRING-LEDGER-14 count real joined students in Super Admin hiring analytics > uses accepted offers and confirmed joining rather than mutable stage HIRED

  ```
  AssertionError: expected 'hired:sql<number>`count(distinct ${pl…' to contain 'exists ('
  - Expected
  + Received
  - exists (
  + hired:sql<number>`count(distinct ${placementApplications.id}) filter (
  +     where ${placementApplications.status} = 'SUBMITTED'
  +     and ${verifiedJoined}
  +   )::integer`.mapWith(Number),
  ```
- SA-HIRING-LEDGER-14 count real joined students in Super Admin hiring analytics > retains selected tenant and scoped application membership pairing including on date-filtered reports

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'eq(placementJobs.collegeId,selected.c…'
  - Expected
  + Received
  - eq(placementJobs.collegeId,selected.collegeId)
  + import "server-only";
  + import {and,asc,eq,exists,gte,ilike,lt,or,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {
  ```
