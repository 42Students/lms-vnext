# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/mentor-projects-chat7-r06-empty-sprints.test.ts (1 failing)
- mentor empty sprint workflow > MEN-projects-meetings-R06 has truthful empty state and actionable first step

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'No sprints yet. Add the sprints this …'
  - Expected
  + Received
  - No sprints yet. Add the sprints this project should be measured against.
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/project-class-team-workspace-admin-controls.test.ts (1 failing)
- managed Project team affordances > does not render learner member edit controls for group-managed Projects

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'member.role !== "LEARNER"'
  - Expected
  + Received
  - member.role !== "LEARNER"
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
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

## tests/unit/sa-tenants-modules-24-college-mutation-audit.test.ts (1 failing)
- SA-tenants-modules-24 tenant write audit > writes each tenant mutation and event inside a transaction

  ```
  AssertionError: expected 3 to be 2 // Object.is equality
  - Expected
  + Received
  - 2
  + 3
  ```

## tests/unit/t-s2-04-campaign-send-policy.test.ts (1 failing)
- T-S2-04 campaign send policy > produces a bounded, PII-free preview with stable contact deduplication

  ```
  AssertionError: expected { recipientIds: [ 'a' ], …(3) } to deeply equal { recipientIds: [ 'a' ], …(1) }
  - Expected
  + Received
  @@ -1,9 +1,11 @@
  {
  +   "eligibleCount": 1,
  "recipientIds": [
  "a",
  ```

## tests/unit/tpo-drive-applicant-partials-chat5.test.ts (1 failing)
- TPO drive applicant partial parity and query safety > TPO-drive-workspace-72 collapses mobile actions and filters

  ```
  AssertionError: expected '"use client";\nimport Link from "next…' to contain '<TpoGridFilterPanel fields={filters} …'
  - Expected
  + Received
  - <TpoGridFilterPanel fields={filters} mobileSheet/>
  + "use client";
  + import Link from "next/link";
  + import type {TpoGridColumn} from "@/modules/placements/tpo-grid-model";
  + import {applicantStage} from "@/modules/placements/tpo-applicant-pipeline-model";
  ```

## tests/unit/tpo-inbox-team-copy.test.ts (1 failing)
- TPO Messages copy parity > TPO-inbox-team-10 uses the exact legacy Messages subtitle without developer status jargon

  ```
  AssertionError: expected 'import { TpoTeamMessagesDirectory } f…' to contain 'Keep recruiter conversations tied to …'
  - Expected
  + Received
  - Keep recruiter conversations tied to the right drive and follow up without leaving the placement workspace.
  + import { TpoTeamMessagesDirectory } from "@/components/tpo/tpo-team-messages-directory";
  + import Link from "next/link";
  + import {TpoRecruiterMessageReply} from "@/components/tpo/tpo-recruiter-message-reply";
  + import {getTpoRecruiterThreadDetail} from "@/modules/placements/tpo-recruiter-thread-detail-service";
  ```

## tests/unit/tpo-students-model.test.ts (4 failing)
- TPO Students journey derivation > recognizes an accepted offer but not an issued, declined or withdrawn offer as placed

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
- TPO Students college and branch summaries > preserves one learner per row and keeps registered pool distinct from enrollment population

  ```
  AssertionError: expected { activeLearners: 5, …(9) } to match object { activeLearners: 5, …(9) }
  - Expected
  + Received
  {
  "activeLearners": 5,
  "applying": 0,
  "needsReadinessSupport": 1,
  "notRegistered": 1,
  ```
- TPO Students college and branch summaries > uses the registered placement pool as branch placement-rate denominator

  ```
  AssertionError: expected { activeLearners: 3, …(12) } to match object { activeLearners: 3, …(3) }
  (9 matching properties omitted from actual)
  - Expected
  + Received
  {
  "activeLearners": 3,
  -   "placedInPool": 1,
  +   "placedInPool": 0,
  ```
- TPO Students college and branch summaries > paginates and filters without changing source rows

  ```
  AssertionError: expected 1 to be 2 // Object.is equality
  - Expected
  + Received
  - 2
  + 1
  ```
