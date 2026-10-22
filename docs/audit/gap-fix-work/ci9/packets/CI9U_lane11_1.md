# CI unit-test packet (round 9)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-kit-scroll-motion-01.test.tsx (2 failing)
- UX-kit-scroll-motion owner invisible-scrollbar contracts > UX-kit-scroll-motion-02 drawer locks its container to one scrollable content region

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'min-h-0 flex-1'
  - Expected
  + Received
  - min-h-0 flex-1
  + "use client";
  +
  + import { useEffect, useId, useRef, type ReactNode, type RefObject, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- UX-kit-scroll-motion owner invisible-scrollbar contracts > UX-kit-scroll-motion-07 skeleton shimmer and disclosure honor reduced-motion defaults

  ```
  AssertionError: expected '<details data-slot="disclosure" class…' to contain 'min-h-11'
  Expected: "min-h-11"
  Received: "<details data-slot="disclosure" class="group min-w-0 border-t border-[var(--lms-canvas-border)]"><summary style="min-height:44px" class="flex cursor-pointer list-none items-center justify-between gap-[var(--lms-space-2)] rounded-[var(--lms-control-radius)] px-[var(--lms-space-2)] py-[var(
  ```
