# CI unit-test packet (round 8)

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

## tests/unit/chat7-superadmin-courses-content-page-gates.test.ts (1 failing)
- Super Admin courses and content page-level scope, recovery and mobile access gates > SA-academics-people-67 progress directory and per-student details keep scoped recovery and export parity

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Unable to read course progress'
  - Expected
  + Received
  - Unable to read course progress
  + import Link from "next/link";
  + import {DataTable} from "@/components/ui/data-table";
  + import {EmptyState} from "@/components/ui/empty-state";
  + import {redirect} from "next/navigation";
  ```
