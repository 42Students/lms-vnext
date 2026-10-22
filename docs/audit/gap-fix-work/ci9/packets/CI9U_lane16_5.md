# CI unit-test packet (round 9)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-home-31-new-followup.test.ts (1 failing)
- TPO-home-31 quick-create follow-up modal > uses the pre-existing scoped leads and calendar follow-up routes

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain '<TpoTopbarNewMenu collegeId={context.…'
  - Expected
  + Received
  - <TpoTopbarNewMenu collegeId={context.membership!.collegeId}/>
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { canOpenTpoWorkspace, hasTpoTooling } from "@/modules/placements/tpo-workspace-access-model";
  + import { TpoKeyboardShortcuts } from "@/components/tpo/tpo-keyboard-shortcuts";
  ```
