# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-placements-chat7-apply-blockers.test.ts (1 failing)
- learner eligibility deny-state explanations > LEARNER-placements-R01 names real registration and academic evidence blockers

  ```
  AssertionError: expected [ Array(1) ] to deeply equal [ Array(1) ]
  - Expected
  + Received
  [
  -   "Register for placements to participate in campus drives.",
  +   "Register for placements first. It takes a minute, and then you can apply.",
  ]
  ```

## tests/unit/learner-schedule-parity.test.ts (1 failing)
- learner class schedule parity surface > keeps the dedicated learner calendar route and shell destination

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'aria-label="Next upcoming classes"'
  - Expected
  + Received
  - aria-label="Next upcoming classes"
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { CalendarGrid } from "@/components/ui/calendar-grid";
  + import calendarStyles from "@/components/placements/legacy-calendar-theme.module.css";
  ```

## tests/unit/nsrit-migration-academics.test.ts (1 failing)
- buildAcademicsPlan on a synthetic snapshot > loads quiz attempts as SUBMITTED history with prompt and option snapshots

  ```
  AssertionError: expected [ Array(1) ] to have a length of 2 but got 1
  - Expected
  + Received
  - 2
  + 1
  ```

## tests/unit/pub-auth-public-41-invite-send.test.ts (1 failing)
- PUB-auth-public-41 REC-calendar-messages-profile-38 invitation send-code > limits code requests per token and college

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/recruiter-company-team-scope.test.ts (2 failing)
- W05 recruiter company college scope > HR-TEAM-REVOKE-32 revalidates persisted recruiter and grant before disclosing colleagues

  ```
  AssertionError: expected 5958 to be less than -1
  ❯ tests/unit/recruiter-company-team-scope.test.ts:98:8
  96|     ])expect(scopeQuery).toContain(check);
  97|     expect(source.indexOf('if (!company) throw new AuthorizationError'…
  98|       .toBeLessThan(source.indexOf("const team = await db"));
  |        ^
  99|   });
  100|
  ```
- W05 recruiter company college scope > HR-TEAM-RECIPIENT-45 returns only verified and unexpired colleague contact grants

  ```
  AssertionError: expected '\n' to contain 'eq(placementRecruiterCollegeGrants.co…'
  - Expected
  + Received
  - eq(placementRecruiterCollegeGrants.companyRelationshipId, company.relationshipId)
  +
  +
  ```

## tests/unit/super-admin-broadcast-ui.test.ts (1 failing)
- Super Admin all and selected college publishing > renders selected-college chooser and consent-based publish confirmation

  ```
  AssertionError: expected '"use client";\nimport {useRef,useStat…' to contain 'Consent and publish'
  - Expected
  + Received
  - Consent and publish
  + "use client";
  + import {useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {Button} from "@/components/ui/button";
  ```
