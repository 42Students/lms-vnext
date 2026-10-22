# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/college-academic-setup-round5-gap-verification.test.ts (1 failing)
- chat-11 college academic page parity round five > COL-academic-setup-32 launches a selected class schedule from its list row

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'defaultSectionId={classId}'
  - Expected
  + Received
  - defaultSectionId={classId}
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeRecurringRouteModal } from "./route-modal";
  + import { PageHeader } from "@/components/ui/page-header";
  ```

## tests/unit/mentor-projects-chat7-final-r7.test.ts (1 failing)
- mentor gaps round-seven behavior > MEN-projects-meetings-R08 preserves persisted truth and legacy controls

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain '!mentor || hasFilters'
  - Expected
  + Received
  - !mentor || hasFilters
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  ```
