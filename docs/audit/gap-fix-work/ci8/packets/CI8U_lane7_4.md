# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-project-team-mentor-modal.test.ts (1 failing)
- College Admin workspace Team actions > COL-projects-15 offers a scoped mentor search and confirmed reassignment modal without changing member roles directly

  ```
  AssertionError: expected '"use client";\n\nimport {useRef,useSt…' to contain 'if(lock.current||!mentorId)return'
  - Expected
  + Received
  - if(lock.current||!mentorId)return
  + "use client";
  +
  + import {useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
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
