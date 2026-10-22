# CI unit-test packet (round 9)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-super-admin-placement-source-reconciliation.test.ts (1 failing)
- Super Admin Placements documented parity and owner-accepted navigation > SA-placements-projects-27 maintains company domains with removal guard and provider-side authorization

  ```
  AssertionError: expected '"use client";\nimport {useState,type …' to contain 'Company domain or email'
  - Expected
  + Received
  - Company domain or email
  + "use client";
  + import {useState,type FormEvent} from "react";
  + import {useRouter} from "next/navigation";
  + import {apiFetch} from "@/lib/api-fetch";
  ```
