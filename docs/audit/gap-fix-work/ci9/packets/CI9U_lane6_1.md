# CI unit-test packet (round 9)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-admin-scroll-motion-chat6.test.ts (1 failing)
- UX admin scroll and motion after invisible scrollbar owner decision > UX-admin-scroll-motion-03 Drawer preserves one visual viewport scroller and focus return (src/components/ui/drawer.tsx)

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'flex h-full min-h-0 flex-col overflow…'
  - Expected
  + Received
  - flex h-full min-h-0 flex-col overflow-hidden
  + "use client";
  +
  + import { useEffect, useId, useRef, type ReactNode, type RefObject, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```
