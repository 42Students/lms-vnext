# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-admin-submissions-query.test.ts (1 failing)
- IIT Dharwad Projects: admin submissions dashboard URL breaker > PROJ-BREAK-ux-17 preserves the exact authorized status, list and view filters

  ```
  AssertionError: expected { success: false, …(1) } to match object { success: true, data: { …(6) } }
  (3 matching properties omitted from actual)
  - Expected
  + Received
  {
  -   "data": {
  -     "page": 3,
  -     "pageSize": 50,
  ```

## tests/unit/PROJ-BREAK-chat9-sa-tenant-directory-page.test.tsx (4 failing)
- Super Admin last-third tenants directory: failures, denial and invalid GET > SA-tenants-ux-09 DB outage preserves validated filter and reveals no tenant records

  ```
  Error: [vitest] No "can" export is defined on the "@/modules/permissions/policy" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/permissions/policy"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- Super Admin last-third tenants directory: failures, denial and invalid GET > SA-tenants-ux-10 malicious status, repeated page and oversized search never enter the service

  ```
  Error: [vitest] No "can" export is defined on the "@/modules/permissions/policy" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/permissions/policy"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- Super Admin last-third tenants directory: failures, denial and invalid GET > SA-tenants-idor-58 disabled Super Admin is denied before tenant PII read

  ```
  AssertionError: expected [Function] to throw error including 'Missing permission: admin-scope.select' but got '[vitest] No "can" export is defined o…'
  - Expected
  + Received
  - Missing permission: admin-scope.select
  + [vitest] No "can" export is defined on the "@/modules/permissions/policy" mock. Did you forget to return it from "vi.mock"?
  + If you need to partially mock a module, you can use "importOriginal" helper inside:
  +
  ```
- Super Admin last-third tenants directory: failures, denial and invalid GET > SA-tenants-ux-11 genuine zero matches are distinct from an unavailable directory

  ```
  Error: [vitest] No "can" export is defined on the "@/modules/permissions/policy" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/permissions/policy"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```

## tests/unit/UX-admin-colleges-chat-12-bulk-confirm.test.ts (1 failing)
- UX-admin-colleges-chat-12-bulk-confirm > keeps all CSV results visible in one responsive shared table

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'empty={<p'
  - Expected
  + Received
  - empty={<p
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/UX-college-bounded-loading-01.test.ts (1 failing)
- College UX bounded directory loader > UX-college-bounded-loading-02 delegates every nine College directory fallbacks to the shared bounded loader

  ```
  AssertionError: resources: expected 'import { PageHeader } from "@/compone…' to contain 'GracefulPageLoading'
  - Expected
  + Received
  - GracefulPageLoading
  + import { PageHeader } from "@/components/ui/page-header";
  + export default function CollegeResourcesLoading(){
  +  return <section className="min-w-0 space-y-4" aria-busy="true" aria-label="Loading resources">
  +   <PageHeader title="Resources"
  ```

## tests/unit/UX-college-college-domains-01.test.ts (1 failing)
- UX-college-college-domains-01 preserves mobile UX and route policy

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { isSuperAdmin } from "@/modules/identity/context";
  + import {
  ```

## tests/unit/UX-college-department-data-table-01.test.ts (1 failing)
- UX-college-department-data-table-01 evidence reports > shows all department evidence with mobile-first shared DataTable and genuine empty copy

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' to contain 'min-h-11 items-center rounded-md'
  - Expected
  + Received
  - min-h-11 items-center rounded-md
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import Link from "next/link";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
