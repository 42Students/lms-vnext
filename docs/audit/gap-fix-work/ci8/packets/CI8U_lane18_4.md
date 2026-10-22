# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-applications-browse-parity.test.ts (1 failing)
- Learner Applications list and detail route > supports shareable filters and an application-id detail drawer

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain '<Drawer open={selected!==null}'
  - Expected
  + Received
  - <Drawer open={selected!==null}
  + "use client";
  +
  + import Link from "next/link";
  + import { useCallback, useEffect, useRef, useState } from "react";
  ```

## tests/unit/public-auth-login-gap-verification.test.ts (1 failing)
- public sign-in verified gap closure > PUB-auth-public-03 restores registered contact, code and resend labels

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'Enter the code'
  - Expected
  + Received
  - Enter the code
  + "use client";
  +
  + import { useEffect, useRef, useState } from "react";
  + import { Button } from "@/components/ui/button";
  ```
