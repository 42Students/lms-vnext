# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-admin-first-third-audit.test.ts (1 failing)
- chat-13 Super Admin /admin first-third route source audit > SA-ADMIN-FIRST-04 fails closed on malformed employer searches and impossible selected-college filters

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'listSuperAdminCompanyDirectory(contex…'
  - Expected
  + Received
  - listSuperAdminCompanyDirectory(context, parsed.data)
  + import {Button} from "@/components/ui/button";
  + import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
  + import {Banner} from "@/components/ui/banner";
  + import type {AdminCompanyRow} from "@/modules/placements/admin-company-directory-model";
  ```

## tests/unit/chat2-UX-tpo-overlay-01.test.ts (1 failing)
- UX-tpo-overlay: focus-safe mobile and desktop workflows > UX-tpo-overlay primitive contracts share focus restoration, top-layer dismissal and reduced-motion exit

  ```
  Error: ENOENT: no such file or directory, open 'src/components/ui/use-overlay-exit.tsx'
  ❯ ui tests/unit/chat2-UX-tpo-overlay-01.test.ts:5:30
  3|
  4| const file = (name: string) => readFileSync("src/components/tpo/" + na…
  5| const ui = (name: string) => readFileSync("src/components/ui/" + name …
  |                              ^
  6|
  7| describe("UX-tpo-overlay: focus-safe mobile and desktop workflows", ()…
  ```
