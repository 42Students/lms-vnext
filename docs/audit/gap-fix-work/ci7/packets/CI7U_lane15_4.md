# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/hr-today-action-queue-model.test.ts (1 failing)
- filters foreign-company and foreign-college drives before constructing review links

  ```
  AssertionError: expected '/hr/notifications?collegeId=college-a…' to contain '/recruiter/messages'
  Expected: "/recruiter/messages"
  Received: "/hr/notifications?collegeId=college-a&unreadOnly=true"
  ```

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

## tests/unit/recruiter-chat14-unconfirmed-decisions.test.ts (1 failing)
- chat-14 UNCONFIRMED recruiter owner decisions > REC-calendar-messages-profile-46 reuses verified existing-account join and never silently auto-accepts

  ```
  AssertionError: expected 'import { recruiterAccessMonthsOrDefau…' to contain 'recruiterGrantEffectiveAt(grant, now,…'
  - Expected
  + Received
  - recruiterGrantEffectiveAt(grant, now, "DRIVES")
  + import { recruiterAccessMonthsOrDefault } from "@/modules/placements/recruiter-access-defaults";
  + import "server-only";
  +
  + import { createHash } from "node:crypto";
  ```

## tests/unit/tpo-drive-workspace-s2-evidence-contracts.test.ts (2 failing)
- Drive workspace S2 source-to-UI contracts > TPO-drive-workspace-04 shows the export, company share and run-again actions in More

  ```
  AssertionError: expected 'import { Dropdown } from "@/component…' to contain 'More ▾'
  - Expected
  + Received
  - More ▾
  + import { Dropdown } from "@/components/ui/dropdown";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import type { ReactNode } from "react";
  ```
- Drive workspace S2 source-to-UI contracts > TPO-drive-workspace-63 retains applicant-level inclusion actions without cross-college mutation

  ```
  AssertionError: expected '"use client";\n\nimport { Disclosure …' to contain 'Force'
  - Expected
  + Received
  - Force
  + "use client";
  +
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {
  ```
