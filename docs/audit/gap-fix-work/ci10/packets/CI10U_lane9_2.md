# CI unit-test packet (round 10)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-drives-chat-3-round4.test.ts (1 failing)
- chat-3 Drives round 4 > TPO-drives-49 closed drive has immutable explanation, clone path and retriable read boundary

  ```
  AssertionError: expected 'import {PageHeader} from "@/component…' to contain '<GracefulPageLoading label="Loading d…'
  - Expected
  + Received
  - <GracefulPageLoading label="Loading drive edit"/>
  + import {PageHeader} from "@/components/ui/page-header";
  + import {Skeleton} from "@/components/ui/skeleton";
  + export default function LoadingTpoDriveEdit(){
  +  return <div aria-busy="true" className="min-w-0 space-y-4">
  ```
