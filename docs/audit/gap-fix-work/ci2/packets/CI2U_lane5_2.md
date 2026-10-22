# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-admin-export-date-resilience.test.ts (1 failing)
- IIT Dharwad Projects: malformed stored dates do not crash exports > PROJ-BREAK-resilience-20 admin CSV preserves valid rows and uses an explicit invalid-date placeholder

  ```
  AssertionError: expected '\ufeff"Workspace","Status","Progress"…' to contain '"Date unavailable"'
  - Expected
  + Received
  - "Date unavailable"
  + ﻿"Workspace","Status","Progress","Mentor","Template ID"
  + "'=HYPERLINK(1)","In progress","10","Unassigned","Not available"
  + "Legitimate workspace","Ready","100","Faculty","Not available"
  +
  ```

## tests/unit/PROJ-BREAK-chat9-csv-isolates.test.ts (1 failing)
- IIT Dharwad Projects: adversarial spreadsheet export > PROJ-BREAK-exports-06 isolates cannot disguise formula cells in template exports

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/PROJ-BREAK-chat9-superadmin-directory-resilience.test.ts (1 failing)
- IIT Dharwad Projects: Super Admin template scale and graceful college creator > PROJ-BREAK-scale-22 loads only the current version of each paged template for directory counts

  ```
  AssertionError: expected 10 to be 20 // Object.is equality
  - Expected
  + Received
  - 20
  + 10
  ```

## tests/unit/UX-admin-interviews-table-chat17.test.ts (1 failing)
- UX-UNOWNED-TABLE-04 Super Admin interview operations > retains IST formatting and permission-preserving schedule destination

  ```
  AssertionError: expected '"use client";\nimport { Checkbox } fr…' to contain 'title:row.title,date:row.startsAt'
  - Expected
  + Received
  - title:row.title,date:row.startsAt
  + "use client";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import {SuperAdminInterviewEdit} from "@/components/admin/super-admin-interview-edit";
  + import {useMemo,useState,useTransition} from "react";
  ```

## tests/unit/UX-college-college-attendance-settings-01.test.ts (1 failing)
- UX-college-college-attendance-settings-01 preserves state and mobile layout

  ```
  AssertionError: expected 'import { PageBackLink } from "@/compo…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { isSuperAdmin } from "@/modules/identity/context";
  ```

## tests/unit/UX-college-college-faculty-membership-id-01.test.ts (1 failing)
- UX-college-college-faculty-membership-id-01 preserves keyboard states, responsive layout and exact labels

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import Link from "next/link";
  + import { notFound, redirect } from "next/navigation";
  + import {and,eq} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  ```
