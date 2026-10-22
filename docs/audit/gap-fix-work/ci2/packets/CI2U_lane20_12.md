# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-profile-learning-gap-closure.test.ts (2 failing)
- Learner Profile and Learning Round-R gap closure > LEARNER-profile-misc-R02 role, shift, city and specific role preferences have persisted schema and edit UI

  ```
  AssertionError: expected '"use client";\nimport {LEARNER_EDUCAT…' to contain 'jobPrefsDraft.rolePreferences'
  - Expected
  + Received
  - jobPrefsDraft.rolePreferences
  + "use client";
  + import {LEARNER_EDUCATION_TYPES,learnerQualifyingExamSuggestions,LEARNER_QUALIFYING_EXAM_DETAILS,learnerEducationValidationProblem} from "@/modules/people/learner-education-picker-model";
  + import {LearnerSkillCatalogInput} from "@/components/profile/learner-skill-catalog-input";
  + import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
  ```
- Learner Profile and Learning Round-R gap closure > LEARNER-profile-misc-R04 alternate phone validates ten-to-fifteen digits and deduplicates against primary

  ```
  AssertionError: expected 'import "server-only";\n\nimport { and…' to contain 'ALTERNATE_PHONE_SAME_AS_PRIMARY'
  - Expected
  + Received
  - ALTERNATE_PHONE_SAME_AS_PRIMARY
  + import "server-only";
  +
  + import { and, eq, sql } from "drizzle-orm";
  + import { getDb } from "@/db/client";
  ```

## tests/unit/mentor-resource-audit-update.test.ts (1 failing)
- keeps update resource audit inside the project transaction with safe metadata

  ```
  AssertionError: expected '{"projectId":"project-a","resourceId"…' not to contain 'Reference'
  Expected: "Reference"
  Received: "{"projectId":"project-a","resourceId":"resource-a","resourceKey":"resource-a","actionType":"UPDATE","beforeJson":null,"afterJson":{"title":"Reference =unsafe","sequence":null,"required":null,"visibility":null,"resourceType":null,"status":null,"pinned":null,"legacyResourceKind":null,"url":
  ```

## tests/unit/projects-phase2-final-delivery-links-and-copy.test.ts (1 failing)
- PR-S2-07 registered 0091 final delivery links and Project page copy > keeps one account-level tab strip and legacy labels

  ```
  AssertionError: Target cannot be null or undefined.
  ❯ tests/unit/projects-phase2-final-delivery-links-and-copy.test.ts:21:71
  19|  });
  20|  it("keeps one account-level tab strip and legacy labels",()=>{
  21|   expect(workspace.match(/aria-label="Project workspace sections"/g)).…
  |                                                                       ^
  22|   expect(mentor).toContain("<MentorProjectTabs");
  23|   expect(learner).toContain("<LearnerProjectTabs");
  ```

## tests/unit/recruiter-chat14-message-email-policy.test.ts (1 failing)
- REC-calendar-messages-profile-R01 unread recruiter mail policy > REC-calendar-messages-profile-R01 preserves new multiline replies while rejecting oversize

  ```
  AssertionError: expected 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx…' to be null // Object.is equality
  - Expected:
  null
  + Received:
  "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
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

## tests/unit/super-admin-videos-directory.test.ts (1 failing)
- Super Admin Videos directory pure model > includes hosted and YouTube videos, not other content

  ```
  AssertionError: expected 'YouTube' to be 'YouTube Video' // Object.is equality
  Expected: "YouTube Video"
  Received: "YouTube"
  ```
