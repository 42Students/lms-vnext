# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-admin-filters.test.ts (1 failing)
- IIT Dharwad Projects: Super Admin URL and pagination resilience > PROJ-BREAK-ux-10 preserves authorized default list semantics and legacy search aliases

  ```
  AssertionError: expected { success: true, data: { …(3) } } to match object { success: true, data: { …(3) } }
  - Expected
  + Received
  {
  "data": {
  "page": 1,
  -     "pageSize": 20,
  +     "pageSize": 10,
  ```

## tests/unit/PROJ-BREAK-chat9-evaluation-read.test.ts (1 failing)
- IIT Dharwad rubric evaluation read privacy and project tenancy > PROJ-BREAK-grading-02 College Admin can read only this project's single submission evaluation and item sequence

  ```
  AssertionError: expected 5 to be 2 // Object.is equality
  - Expected
  + Received
  - 2
  + 5
  ```

## tests/unit/PROJ-BREAK-chat9-template-college-page.test.tsx (3 failing)
- Super Admin Projects template colleges: resilient, scoped and bounded page states > PROJ-BREAK-ux-35 failed service read is not represented as zero matching colleges

  ```
  Error: [vitest] No "resolveTemplateCollegeLegacyId" export is defined on the "@/modules/projects/template-college-availability-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/projects/template-college-availability-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- Super Admin Projects template colleges: resilient, scoped and bounded page states > PROJ-BREAK-ux-36 invalid filter and repeated page values recover before reads

  ```
  Error: [vitest] No "resolveTemplateCollegeLegacyId" export is defined on the "@/modules/projects/template-college-availability-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/projects/template-college-availability-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- Super Admin Projects template colleges: resilient, scoped and bounded page states > PROJ-BREAK-ux-37 authorized empty catalogue is distinct from a service error

  ```
  Error: [vitest] No "resolveTemplateCollegeLegacyId" export is defined on the "@/modules/projects/template-college-availability-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/projects/template-college-availability-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```

## tests/unit/UX-admin-scroll-motion-chat6.test.ts (9 failing)
- UX admin scroll and motion after invisible scrollbar owner decision > UX-admin-scroll-motion-01 DataTable delegates adaptive horizontal fades and keyboard focus to ScrollCue (src/components/ui/data-table.tsx)

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain 'sm:rounded-xl'
  - Expected
  + Received
  - sm:rounded-xl
  + import type { ReactNode } from "react";
  + import Link from "next/link";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  + import { TableSelectAll } from "@/components/ui/table-select-all";
  ```
- UX admin scroll and motion after invisible scrollbar owner decision > UX-admin-scroll-motion-05 bulk drive selection shows scroll hint for longer bounded lists (src/components/placements/super-admin-bulk-drive-actions.tsx)

  ```
  AssertionError: expected '"use client";\nimport { useRef, useSt…' to contain '[mask-image:linear-gradient'
  - Expected
  + Received
  - [mask-image:linear-gradient
  + "use client";
  + import { useRef, useState } from "react";
  + import Link from "next/link";
  + import {useToast} from "@/components/ui/toast";
  ```
- UX admin scroll and motion after invisible scrollbar owner decision > UX-admin-scroll-motion-06 drive action menu has vertical fade, focusable bounded region and narrow-phone hint (src/components/placements/placement-drive-workspace.tsx)

  ```
  AssertionError: expected 'import { Dropdown } from "@/component…' to contain '[mask-image:linear-gradient'
  - Expected
  + Received
  - [mask-image:linear-gradient
  + import { Dropdown } from "@/components/ui/dropdown";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import type { ReactNode } from "react";
  ```
- UX admin scroll and motion after invisible scrollbar owner decision > UX-admin-scroll-motion-07 placement calendar wide grid has horizontal overscroll isolation and fade (src/components/placements/placement-calendar-workspace.tsx)

  ```
  AssertionError: expected 'import {TpoWeekHourCalendar} from "@/…' to contain '[mask-image:linear-gradient(to_right'
  - Expected
  + Received
  - [mask-image:linear-gradient(to_right
  + import {TpoWeekHourCalendar} from "@/components/placements/tpo-week-hour-calendar";
  + import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
  + import Link from "next/link";
  +
  ```
- UX admin scroll and motion after invisible scrollbar owner decision > UX-admin-scroll-motion-08 inbound-mail Drawer uses the audited native body with guarded status and accessible message (src/components/admin/inbound-mail-list.tsx)

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'disabled={busy}'
  - Expected
  + Received
  - disabled={busy}
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import Link from "next/link";
  + import {useRouter} from "next/navigation";
  ```
- UX admin scroll and motion after invisible scrollbar owner decision > UX-admin-scroll-motion-13 profile editing uses shared Dialog and retains failure status (src/components/admin/person-profile-dialog.tsx)

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useRef,\…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  +
  + import {
  +   useRef,
  ```
- UX admin scroll and motion after invisible scrollbar owner decision > UX-admin-scroll-motion-15 uses motion tokens and global reduced-motion and hidden-scrollbar rules

  ```
  AssertionError: expected '@import "tailwindcss";\n@source not "…' to contain '--lms-motion-base: 200ms'
  - Expected
  + Received
  - --lms-motion-base: 200ms
  + @import "tailwindcss";
  + @source not "../../docs";
  + @source not "../../scripts";
  + @source not "../../tests";
  ```
- UX admin scroll and motion after invisible scrollbar owner decision > UX-admin-scroll-motion-20 application notes Drawer scroll is labelled, masked and keyboard reachable

  ```
  AssertionError: expected '"use client";\nimport {Dialog} from "…' to contain 'tabIndex={0}'
  - Expected
  + Received
  - tabIndex={0}
  + "use client";
  + import {Dialog} from "@/components/ui/dialog";
  + import {ConfirmDialog} from "@/components/ui/confirm-dialog";
  + import {Button} from "@/components/ui/button";
  ```
- UX admin scroll and motion after invisible scrollbar owner decision > UX-admin-scroll-motion-22 deadline confirmation keeps form values and blocks duplicate writes

  ```
  AssertionError: expected '"use client";\nimport {useRef,useStat…' to contain 'text-base sm:text-sm'
  - Expected
  + Received
  - text-base sm:text-sm
  + "use client";
  + import {useRef,useState,type FormEvent} from "react";
  + import {ConfirmDialog} from "@/components/ui/confirm-dialog";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/UX-college-college-batch-promotion-01.test.ts (1 failing)
- UX-college-college-batch-promotion-01 preserves state and mobile layout

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import Link from "next/link";
  + import { CollegePromotionConfirmation } from "@/components/academics/college-promotion-confirmation";
  ```

## tests/unit/UX-college-college-groups-01.test.ts (1 failing)
- UX-college-college-groups-01 preserves keyboard states, responsive layout and exact labels

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import { Pagination } from "@/components/ui/pagination";
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
