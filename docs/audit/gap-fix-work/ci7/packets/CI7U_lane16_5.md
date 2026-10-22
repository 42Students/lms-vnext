# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/ux-admin-chat9-batch-02.test.ts (1 failing)
- chat-9 last-third admin UX rollout, batch 02 > UX-admin-projects-templates-01 preserves verified shared UX contract

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' to contain '<Input'
  - Expected
  + Received
  - <Input
  + import { Badge } from "@/components/ui/badge";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
