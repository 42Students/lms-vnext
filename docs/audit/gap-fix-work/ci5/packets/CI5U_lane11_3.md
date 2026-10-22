# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-super-admin-colleges-bulk-csv-hardening.test.ts (1 failing)
- Super Admin colleges bulk CSV adversarial parser > SA-colleges-bulk-input-03 enforces 200 rows, no case-variant duplicate codes, required names and correct lengths

  ```
  AssertionError: expected [Function] to throw error including 'Duplicate college code' but got 'Row 3: duplicate college code abc (fi…'
  Expected: "Duplicate college code"
  Received: "Row 3: duplicate college code abc (first used on line 2)."
  ```

## tests/unit/chat5-placements-core-extended-state-machines.test.ts (1 failing)
- chat-5 placements core — offer state transition matrix > PLACEMENTS-TPO-CASCADE-17 applies the learner sibling cascade atomically with TPO evidence, attribution and rollback

  ```
  AssertionError: expected 'import "server-only";\n\nimport { and…' to contain 'cascade=await cascadeTpoRecordedAccep…'
  - Expected
  + Received
  - cascade=await cascadeTpoRecordedAcceptance(tx,{
  + import "server-only";
  +
  + import { and, asc, eq, inArray, isNull, lte, ne, notExists, sql } from "drizzle-orm";
  + import {z} from "zod";
  ```

## tests/unit/chat6-college-placements-remaining-decisions.test.ts (1 failing)
- College Placements additional UNCONFIRMED decisions > COL-placements-15 does not delete a company identity or silently restore a global company

  ```
  AssertionError: expected 'import {\n  and,\n  asc,\n  eq,\n  il…' to contain 'status: "ARCHIVED"'
  - Expected
  + Received
  - status: "ARCHIVED"
  + import {
  +   and,
  +   asc,
  +   eq,
  ```

## tests/unit/chat6-people-phone-session-and-mobile-round6.test.ts (2 failing)
- Chat-6 recruiter login and mobile layout safety > COL-dashboard-17 uses wrapped count labels and a mobile-safe setup checklist with accessible links

  ```
  AssertionError: expected '"use client";\nimport {useState,useTr…' to contain 'min-w-0 break-words'
  - Expected
  + Received
  - min-w-0 break-words
  + "use client";
  + import {useState,useTransition} from "react";
  + import { StatTile } from "@/components/ui/stat-tile";
  + import { Button } from "@/components/ui/button";
  ```
- Chat-6 recruiter login and mobile layout safety > SA-academics-people-75 keeps create controls and scrolling course tables within mobile width

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'min-w-0 flex-[1_1_14rem]'
  - Expected
  + Received
  - min-w-0 flex-[1_1_14rem]
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { StatTile } from "@/components/ui/stat-tile";
  + import { Alert } from "@/components/ui/alert";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/chat6-superadmin-people-verified-closure.test.ts (3 failing)
- chat-6 selected-college People gap verification > SA-academics-people-78 uses the legacy exact no-college title and contextual noun

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'Choose a college in the header above …'
  - Expected
  + Received
  - Choose a college in the header above to see its
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
  ```
- chat-6 selected-college People gap verification > SA-academics-people-82 validates the 500-row faculty sample and preserves row result feedback

  ```
  AssertionError: expected 'import { z } from "zod";\nimport { pa…' to contain 'result.length > 500'
  - Expected
  + Received
  - result.length > 500
  + import { z } from "zod";
  + import { parseTpoImportCsvRecords } from "@/modules/placements/tpo-import-csv-parser";
  +
  + /** A legacy LECTURER remains a FACULTY. An explicit MENTOR also gains MENTOR
  ```
- chat-6 selected-college People gap verification > SA-academics-people-87 NOT-A-GAP prohibits impersonation per OD-23

  ```
  AssertionError: expected 'import {getCurrentRequestContext} fro…' not to contain 'Impersonate'
  - Expected
  + Received
  - Impersonate
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {PageBackLink} from "@/components/ui/page-back-link";
  ```

## tests/unit/chat7-learner-assessment-route-boundaries.test.ts (1 failing)
- COURSES7-07 / COURSES7-08 authenticated learner assessment HTTP boundaries > COURSES7-07 passes the authenticated context, path quiz, and unmodified body into the authorized service

  ```
  AssertionError: expected 200 to be 201 // Object.is equality
  - Expected
  + Received
  - 201
  + 200
  ```

## tests/unit/chat7-mentor-meeting-facilitation.test.ts (2 failing)
- mentor meeting facilitated notes > MEN-projects-meetings-27 persists retrospective notes action items and follow-up

  ```
  AssertionError: expected 'import {\n  and,\n  asc,\n  eq,\n  in…' to contain 'input.facilitation??existing?.facilit…'
  - Expected
  + Received
  - input.facilitation??existing?.facilitation??{}
  + import {
  +   and,
  +   asc,
  +   eq,
  ```
- mentor meeting facilitated notes > MEN-projects-meetings-27 accepts each legacy follow-up status and retrospective label

  ```
  AssertionError: expected '"use client";\n\nimport { type FormEv…' to contain '? "Meeting updated."'
  - Expected
  + Received
  - ? "Meeting updated."
  + "use client";
  +
  + import { type FormEvent, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```

## tests/unit/chat7-superadmin-course-tenant-bulk.test.ts (1 failing)
- SA-academics-people-52/53 GR-COURSES-TENANT-01 safe scoped Super Admin visibility and progress > the initial lesson-content query filters both college-owned departments and periods to acting scope before counting matches

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' to contain 'updateCollegeContentStudentVisibility…'
  - Expected
  + Received
  - updateCollegeContentStudentVisibility(context
  + import "server-only";
  + import {and,eq,sql} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```
