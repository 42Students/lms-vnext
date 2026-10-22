# CI unit-test packet (round 9)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat15-calendar-window-bounds.test.ts (1 failing)
- chat-15 bounded calendar retrieval > LEARNER-learning-misc-34 bounds academic schedule to IST visible month and week spillover

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'getLearnerClassSchedule(context,windo…'
  - Expected
  + Received
  - getLearnerClassSchedule(context,window)
  + import Link from "next/link";
  + import { notFound } from "next/navigation";
  + import { resolveOwnLearnerCalendarFilters } from "@/modules/academics/learner-calendar-filter-model";
  + import {learnerCalendarQuerySchema} from "@/modules/academics/learner-calendar-filter-model";
  ```
