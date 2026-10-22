# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-admin-csv-security.test.ts (1 failing)
- IIT Dharwad Projects admin exports: spreadsheet injection resilience > PROJ-BREAK-exports-17 college template catalogue rejects Unicode-mark hidden formulas

  ```
  AssertionError: expected '\ufeff"Title","Version","Summary"\r\n…' to contain '"2","4","1","0","1","2","0"'
  - Expected
  + Received
  - "2","4","1","0","1","2","0"
  + ﻿"Title","Version","Summary"
  + "'͏؜=HYPERLINK(1)","2",""
  +
  ```

## tests/unit/PROJ-BREAK-chat9-college-project-outage.test.tsx (2 failing)
- IIT Dharwad College Admin Projects: independent outage and view contracts > PROJ-BREAK-college-resilience-23 primary read outage shows a filter-preserving retry without leaking DB internals

  ```
  AssertionError: expected 'Project workspaces Live projects, eac…' to contain 'Project workspaces unavailable'
  Expected: "Project workspaces unavailable"
  Received: "Project workspaces Live projects, each run by a mentor with a team of students. Workspaces could not be loaded Failed to load project workspaces. Your search and filters were not changed. Retry /college/projects?q=IIT+Dharwad&status=ACTIVE&page=2&pageSize=50&view=cards"
  ```
- IIT Dharwad College Admin Projects: independent outage and view contracts > PROJ-BREAK-college-ux-26 strict backend query excludes cards/table view but keeps valid filters

  ```
  Error: NEXT_REDIRECT
  ❯ getRedirectError node_modules/next/src/client/components/redirect.ts:15:17
  ❯ getRedirectError node_modules/next/src/client/components/redirect.ts:40:9
  ```

## tests/unit/PROJ-BREAK-chat9-super-admin-project-resilience.test.ts (2 failing)
- IIT Dharwad Super Admin Projects graceful degradation > PROJ-BREAK-admin-resilience-17 optional template failures do not hide the authorized workspace listing

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'role="status"'
  - Expected
  + Received
  - role="status"
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {
  ```
- IIT Dharwad Super Admin Projects graceful degradation > PROJ-BREAK-admin-idor-17 missing selected college cannot attempt either project query

  ```
  AssertionError: expected -1 to be greater than 0
  ❯ tests/unit/PROJ-BREAK-chat9-super-admin-project-resilience.test.ts:23:24
  21|     const firstGuard=page.indexOf("if (!collegeId) {");
  22|     const scopeQuery=page.indexOf("listProjectAdminSnapshots(");
  23|     expect(firstGuard).toBeGreaterThan(0);
  |                        ^
  24|     expect(scopeQuery).toBeGreaterThan(firstGuard);
  25|     expect(page).toContain('title="No college selected"');
  ```

## tests/unit/UX-admin-features-chat-12-drawer.test.ts (1 failing)
- UX-admin-features-chat-12-drawer > uses shared drawer with native focus containment, Escape and topmost Back handling

  ```
  AssertionError: expected '"use client";\nimport {Drawer} from "…' to contain '<Drawer open={detail!==null}'
  - Expected
  + Received
  - <Drawer open={detail!==null}
  + "use client";
  + import {Drawer} from "@/components/ui/drawer";
  + import {Input} from "@/components/ui/input";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/UX-college-college-attendance-01.test.ts (1 failing)
- UX-college-college-attendance-01 keeps responsive layout and legacy wording

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { isSuperAdmin } from "@/modules/identity/context";
  + import { z } from "zod";
  ```

## tests/unit/UX-college-college-faculty-import-01.test.ts (1 failing)
- UX-college-college-faculty-import-01 preserves keyboard states, responsive layout and exact labels

  ```
  AssertionError: expected 'import {redirect} from "next/navigati…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import {redirect} from "next/navigation";
  + import {PageBackLink} from "@/components/ui/page-back-link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {requirePermission} from "@/modules/permissions/policy";
  ```
