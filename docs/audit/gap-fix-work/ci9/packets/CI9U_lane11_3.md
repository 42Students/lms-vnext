# CI unit-test packet (round 9)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat5-ux-cross-tpo-last.test.ts (1 failing)
- Chat-5 UX CROSS AUDIT: /tpo LAST THIRD (routes 85–126) > UX-tpo-settings-recruiters-12 reviews grant, revoke and extension without native confirmations

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' not to contain 'min-h-9'
  - Expected
  + Received
  - min-h-9
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  + import {EmptyState} from "@/components/ui/empty-state";
  ```
