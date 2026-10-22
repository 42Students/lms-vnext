# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-admin-courses-content-audit-01.test.ts (2 failing)
- UX-admin-courses-content-audit-01 Super Admin scoped courses and content > UX-admin-assignments-quizzes-01 requires scoped college and preserves builder/editor and failure states

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'Open offering builder / submissions'
  - Expected
  + Received
  - Open offering builder / submissions
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import {Input} from "@/components/ui/input";
  ```
- UX-admin-courses-content-audit-01 Super Admin scoped courses and content > UX-admin-course-progress-01 distinguishes measured activity from fabricated completion

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-label="Per student progress tabl…'
  - Expected
  + Received
  - aria-label="Per student progress table"
  + import Link from "next/link";
  + import {DataTable} from "@/components/ui/data-table";
  + import {EmptyState} from "@/components/ui/empty-state";
  + import {redirect} from "next/navigation";
  ```

## tests/unit/chat11-super-admin-signin-readiness.test.ts (1 failing)
- SA-tenants-modules-READY-01: persisted readiness does not imply launch approval > branding and module access read the selected tenant without a URL-supplied scope override

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'requirePermission(context,"admin-scop…'
  - Expected
  + Received
  - requirePermission(context,"admin-scope.select")
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Banner } from "@/components/ui/banner";
  ```
