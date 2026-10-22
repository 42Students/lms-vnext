# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-round6-project-risk-audit.test.ts (1 failing)
- College Projects risk and activity acceptance > COL-projects-18 enables admin resource change/search without overriding mentor Activity feed

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'resourceAudit={mode==="ADMIN"}'
  - Expected
  + Received
  - resourceAudit={mode==="ADMIN"}
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
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
