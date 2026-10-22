# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat4-superadmin-tenants.test.ts (1 failing)
- Super Admin colleges/organizations/tenants adversarial audit > SA-colleges-tenants-BREAK-02 selected-college scope cannot enumerate every organization

  ```
  AssertionError: expected 'if(selected?.collegeId){\n    require…' to contain 'eq(colleges.id, selected.collegeId)'
  - Expected
  + Received
  - eq(colleges.id, selected.collegeId)
  + if(selected?.collegeId){
  +     requirePermission(context,"organization.read",{
  +      organizationId:selectedOrganizationId,collegeId:selected.collegeId,
  +     });
  ```

## tests/unit/UX-kit-states-chat17.test.tsx (1 failing)
- UX-kit-STATES: semantic SSR states and accessible fallbacks > UX-kit-HARDEN-50 availability transition clears obsolete file validation state

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'aria-invalid={error ? true : undefine…'
  - Expected
  + Received
  - aria-invalid={error ? true : undefined}
  + "use client";
  +
  + import { useEffect, useId, useRef, useState, type ChangeEvent, type ComponentPropsWithRef, type ReactNode } from "react";
  + import { cx } from "@/lib/class-names";
  ```

## tests/unit/chat12-admin-first-third-cross-audit.test.ts (3 failing)
- UX-admin-first-third-chat12 independent source cross-audit > UX-admin-academics-01 requires explicit selected-college safety scope

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'title="Select a college scope"'
  - Expected
  + Received
  - title="Select a college scope"
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { isSuperAdmin } from "@/modules/identity/context";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- UX-admin-first-third-chat12 independent source cross-audit > UX-admin-colleges-01 validates filters before source queries and retains mobile actions

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'parseAdminDirectorySearchParams(await…'
  - Expected
  + Received
  - parseAdminDirectorySearchParams(await searchParams)
  + import {Button} from "@/components/ui/button";
  + import {inArray,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {collegeMemberships} from "@/db/schema";
  ```
- UX-admin-first-third-chat12 independent source cross-audit > UX-admin-companies-01 errors on malformed filters before directory lookup and labels safety scope

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'adminCompaniesQuerySchema.safeParse'
  - Expected
  + Received
  - adminCompaniesQuerySchema.safeParse
  + import {Button} from "@/components/ui/button";
  + import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
  + import {Banner} from "@/components/ui/banner";
  + import type {AdminCompanyRow} from "@/modules/placements/admin-company-directory-model";
  ```

## tests/unit/chat13-superadmin-gap-register-reconcile-c.test.ts (1 failing)
- chat-13 Super Admin settings, access and tracker reconciliation > SA-tenants-modules-48 verifies current code, without asserting runtime activation

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'Release (critical & high)'
  - Expected
  + Received
  - Release (critical & high)
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Banner } from "@/components/ui/banner";
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  ```
