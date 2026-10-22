# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat11-tpo-trusted-domain-validation.test.ts (2 failing)
- TPO-settings-audit-TRUST-02 college-scoped company domain validation > accepts ordinary domains, nested subdomains and optional email-style @ prefix

  ```
  AssertionError: expected 'eng.example' to be 'careers.eng.example' // Object.is equality
  Expected: "careers.eng.example"
  Received: "eng.example"
  ```
- TPO-settings-audit-TRUST-02 college-scoped company domain validation > rejects DNS labels with trailing hyphens, invalid separators, 64-byte labels and public mail providers

  ```
  AssertionError: foo@other.example: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat12-requests-history-round3.test.ts (1 failing)
- chat-12 legacy requests history and search scopes > TPO-requests-verification-11 lets TPO search by student number and select a drive or recent period

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'Search student number, student, job o…'
  - Expected
  + Received
  - Search student number, student, job or company
  + import { Select } from "@/components/ui/select";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {FilterChipLink} from "@/components/ui/filter-chip";
  ```

## tests/unit/chat12-round7-students-open-facets.test.ts (2 failing)
- chat-12 reopened Students URL facets and UI contracts > TPO-students-24 preserves debarred and attention filters through URL validation

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain '<TpoGridFilterPanel fields={filters} …'
  - Expected
  + Received
  - <TpoGridFilterPanel fields={filters} mobileSheet/>
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Select} from "@/components/ui/select";
  ```
- chat-12 reopened Students URL facets and UI contracts > TPO-students-51 keeps mobile row actions visible without hiding filters

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain '<TpoSpreadsheetGrid mobilePrimaryKeys='
  - Expected
  + Received
  - <TpoSpreadsheetGrid mobilePrimaryKeys=
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Select} from "@/components/ui/select";
  ```

## tests/unit/chat12-tpo-prep-optional-due-date.test.ts (1 failing)
- TPO-students-10 optional due-date, assignment and notification contracts > TPO course picker preserves selection, optional date and learner notices

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' to contain 'await requireTpoJobActor(tx,ctx)'
  - Expected
  + Received
  - await requireTpoJobActor(tx,ctx)
  + import "server-only";
  + import {and,eq,inArray,isNull,sql} from "drizzle-orm";
  + import {tpoPrepAssignmentInputSchema} from "./tpo-prep-assignment-model";
  + import {summarizeTpoPrepAssignment} from "./tpo-prep-assignment-result-model";
  ```

## tests/unit/chat13-admin-program-parity.test.ts (1 failing)
- Super Admin program input and copy > SA-academics-people-44 derives the required internal code without asking for a mandatory legacy field

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'code:code.trim() || deriveSuperAdminP…'
  - Expected
  + Received
  - code:code.trim() || deriveSuperAdminProgramCode(name)
  + "use client";
  +
  + import { useEffect, useState, useTransition, useSyncExternalStore, type FormEvent } from "react";
  + import { usePathname, useRouter } from "next/navigation";
  ```

## tests/unit/chat13-legacy-posting-readback.test.ts (1 failing)
- Super Admin supplemental draft terms > SA-placements-projects-14 shows persisted responsibilities assessment dates and custom rules

  ```
  AssertionError: expected 'import {SuperAdminDriveDeadline} from…' to contain 'timeZone:"Asia/Kolkata"'
  - Expected
  + Received
  - timeZone:"Asia/Kolkata"
  + import {SuperAdminDriveDeadline} from "@/components/placements/super-admin-drive-deadline";
  + import {SuperAdminDriveDuplicate} from "@/components/placements/super-admin-drive-duplicate";
  + import {SuperAdminDriveArchive} from "@/components/placements/super-admin-drive-archive";
  + import {SuperAdminPublishedDriveEdit} from "@/components/placements/super-admin-published-drive-edit";
  ```
