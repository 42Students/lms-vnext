# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-kit-projects-hardening-chat17.test.tsx (2 failing)
- UX-kit-HARDEN-01 shared primitives: a11y, validation, phone and failure states > UX-kit-HARDEN-14 link refuses HTTP/credentials and keeps valid URL copy fallback

  ```
  AssertionError: expected '<span class="inline-flex min-w-0 flex…' to contain 'target="_blank" rel="noopener norefer…'
  Expected: "target="_blank" rel="noopener noreferrer""
  Received: "<span class="inline-flex min-w-0 flex-col gap-[var(--lms-space-2)]"><a href="https://example.org/" rel="noopener noreferrer" class="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white 
  ```
- UX-kit-HARDEN-22 declared 38-element shared UI surface register > UX-kit-HARDEN-22 third-party-link remains in the checked-in kit and has no native popup or one-off >300ms interactive duration

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useS…' to contain 'target="_blank" rel="noopener norefer…'
  - Expected
  + Received
  - target="_blank" rel="noopener noreferrer"
  + "use client";
  +
  + import { useId, useState } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat12-tpo-persisted-private-read-boundaries.test.ts (1 failing)
- PROJ-BREAK-TPO-READ-07 expired/revoked role cannot open student and company data routes > requires persisted actor before reading private student or company data: src/app/api/placements/tpo/students/export/route.ts

  ```
  AssertionError: expected 1320 to be less than -1
  ❯ tests/unit/chat12-tpo-persisted-private-read-boundaries.test.ts:19:22
  17|    const persisted=src.indexOf("await requireTpoBatchActor(context)");
  18|    expect(persisted).toBeGreaterThanOrEqual(0);
  19|    expect(persisted).toBeLessThan(src.indexOf(access));
  |                      ^
  20|    expect(src).not.toContain("readPublicCompanyDirectory(");
  21|   });
  ```
