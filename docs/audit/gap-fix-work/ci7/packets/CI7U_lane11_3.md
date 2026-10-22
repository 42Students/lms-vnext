# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat6-final-sprint-rec-home-drives-r04.test.ts (1 failing)
- Final sprint recruiter closed drive access > REC-home-drives-R04 closed drives keep read-only history and hide write actions

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'Interview slots'
  - Expected
  + Received
  - Interview slots
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```

## tests/unit/chat7-learner-assessment-route-boundaries.test.ts (1 failing)
- COURSES7-07 / COURSES7-08 authenticated learner assessment HTTP boundaries > COURSES7-07 passes the authenticated context, path quiz, and unmodified body into the authorized service

  ```
  AssertionError: expected 200 to be 201 // Object.is equality
  - Expected
  + Received
  - 201
  + 200
  ```

## tests/unit/chat9-college-navigation-contract.test.ts (1 failing)
- legacy College Admin full sidebar + group href contract > links all six formerly orphaned pages from an authorized College page

  ```
  AssertionError: college/attendance/page.tsx: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/chat9-unknown-report-recovery.test.ts (1 failing)
- TPO report unknown-route recovery > TPO-calendar-reports-53 shows Unknown report and return to reports only for authorized TPO members

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Back to reports'
  - Expected
  + Received
  - Back to reports
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
