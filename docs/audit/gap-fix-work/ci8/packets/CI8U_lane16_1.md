# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-college-join-01.test.ts (1 failing)
- UX-college-join-01 college recruiter invitation > uses shared phone-first form, explicit labels, pending guards and focusable inline error

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'min-h-dvh'
  - Expected
  + Received
  - min-h-dvh
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  +
  + import authStyles from "@/components/public/public-auth-skin.module.css";
  ```

## tests/unit/chat12-round37-xlsx-export.test.ts (1 failing)
- TPO-students-36 creates genuine ZIP-based XLSX with sorted scoped columns, mandatory batch/branch and an italic view provenance line

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain 'Export selected XLSX'
  - Expected
  + Received
  - Export selected XLSX
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Select} from "@/components/ui/select";
  ```
