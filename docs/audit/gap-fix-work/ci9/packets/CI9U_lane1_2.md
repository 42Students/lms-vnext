# CI unit-test packet (round 9)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat12-round19-roster-responsive-counts.test.ts (1 failing)
- TPO Students phone presentation and scoped selection summary > TPO-students-51 shows two-column phone journey, focused row summary and collapsible details/actions

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'onClose={() => { if (open) onOpenChan…'
  - Expected
  + Received
  - onClose={() => { if (open) onOpenChange(false); opener.current?.focus(); }}
  + "use client";
  +
  + import { useEffect, useId, useRef, type ReactNode, type RefObject, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```
