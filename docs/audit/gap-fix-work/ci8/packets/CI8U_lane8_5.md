# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-batches-40-chat5.test.ts (1 failing)
- TPO batch eligibility import presentation > TPO-batches-40 uses an accessible modal and exact import copy without raw identifiers

  ```
  AssertionError: expected '"use client";\nimport { Tabs } from "…' to contain 'disabled={busy||preview.ready===0||un…'
  - Expected
  + Received
  - disabled={busy||preview.ready===0||unresolved>0||!acknowledged}
  + "use client";
  + import { Tabs } from "@/components/ui/tabs";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { Checkbox } from "@/components/ui/checkbox";
  ```

## tests/ux-color-contrast.test.ts (1 failing)
- UX-AUDIT B-01/B-05/B-06 canonical LMS AA pairings > UX-PLAYBOOK-12 both themes keep a white on-primary semantic on the solid teal button

  ```
  AssertionError: expected '@import "tailwindcss";\n@source not "…' to contain '--lms-link-text: #0a7c88'
  - Expected
  + Received
  - --lms-link-text: #0a7c88
  + @import "tailwindcss";
  + @source not "../../docs";
  + @source not "../../scripts";
  + @source not "../../tests";
  ```
