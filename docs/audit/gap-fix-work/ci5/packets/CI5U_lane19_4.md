# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-phase2-college-analytics.test.ts (1 failing)
- legacy College Admin Analytics scope and URL > requires the persisted membership college before calling the report service

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' to contain 'collegeId: context.membership.college…'
  - Expected
  + Received
  - collegeId: context.membership.collegeId
  + import { Alert } from "@/components/ui/alert";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/chat9-super-admin-organizations-copy.test.ts (2 failing)
- Super Admin Organizations exact dev-legacy copy > matches section headings and table headers in legacy Organizations.js

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'canCreate ? <section'
  - Expected
  + Received
  - canCreate ? <section
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { OrganizationActions } from "@/components/admin/organization-actions";
  + import {TenantRestoreAction} from "@/components/admin/tenant-restore-action";
  ```
- Super Admin Organizations exact dev-legacy copy > retains exact legacy create control and example

  ```
  AssertionError: expected '"use client";\n\nimport { useState } …' to contain 'disabled={pending || !name.trim()}'
  - Expected
  + Received
  - disabled={pending || !name.trim()}
  + "use client";
  +
  + import { useState } from "react";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```

## tests/unit/college-admin-read-first-boundaries.test.ts (1 failing)
- College Admin read-first page boundaries > shared view components explicitly distinguish real empty pages from load failures

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' to match /\.items\.length === 0/
  - Expected:
  /\.items\.length === 0/
  + Received:
  "import { Input } from \"@/components/ui/input\";
  import { Select } from \"@/components/ui/select\";
  import { Button } from \"@/components/ui/button\";
  import Link from \"next/link\";
  ```

## tests/unit/college-program-mutation-model.test.ts (1 failing)
- College Admin program write contracts > confirms before discarding dirty inputs, even invalid drafts

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/faculty-profile-round10-8.test.ts (1 failing)
- rejects invalid and duplicate-id skills but accepts valid saved records

  ```
  AssertionError: expected null not to be null
  ❯ tests/unit/faculty-profile-round10-8.test.ts:7:61
  5|  const row={id,skill:"Java",proficiency:"Advanced"};
  6|  expect(facultyProfileSkillsIssue([row])).toBeNull();
  7|  expect(facultyProfileSkillsIssue([{...row,skill:""}])).not.toBeNull();
  |                                                             ^
  8|  expect(facultyProfileSkillsIssue([row,row])).toMatch(/Duplicate/);
  9| });
  ```

## tests/unit/hr-round-empty-workspace.test.ts (1 failing)
- shows an accessible empty state before mapping rounds

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'role="status"'
  - Expected
  + Received
  - role="status"
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import {z} from "zod";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```

## tests/unit/learner-discussion-message-limit-model.test.ts (1 failing)
- learner discussion message limit > accepts the maximum 3900 characters enforced by server validation

  ```
  AssertionError: expected 4000 to be 3900 // Object.is equality
  - Expected
  + Received
  - 3900
  + 4000
  ```

## tests/unit/learner-placements-chat7-not-open-groups.test.ts (1 failing)
- legacy learner drive browse sections > LEARNER-placements-15 groups unavailable cards without hiding recorded applications

  ```
  AssertionError: expected '"use client";\n\nimport { useCallback…' to contain 'item.canApply||item.application!==nul…'
  - Expected
  + Received
  - item.canApply||item.application!==null||item.deadlinePassed
  + "use client";
  +
  + import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
  + import {Disclosure} from "@/components/ui/disclosure";
  ```
