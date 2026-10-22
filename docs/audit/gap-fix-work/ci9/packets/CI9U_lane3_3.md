# CI unit-test packet (round 9)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat3-tpo-supplemental-round14.test.ts (1 failing)
- TPO supplemental job metadata > TPO-drives-29/30/38 read and write supplemental details in the scoped job JSONB

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useS…' to contain 'href={safeHref} rel="noopener norefer…'
  - Expected
  + Received
  - href={safeHref} rel="noopener noreferrer"
  + "use client";
  +
  + import { useId, useState } from "react";
  + import { Button } from "@/components/ui/button";
  ```
