# CI unit-test packet (round 9)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-super-admin-projects-gap-closure.test.ts (3 failing)
- chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-58 preserves actual at-risk mentor reassignment and overload semantics

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
- chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-58 shows average-based mentor overload, not a fixed cap

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
- chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-57 restores creator mode wording and split-team help

  ```
  AssertionError: expected '"use client";\nimport { EmptyState } …' to contain 'One workspace per student'
  - Expected
  + Received
  - One workspace per student
  + "use client";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { useEffect, useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```
