# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-teacher-response-followups-coverage-01.test.ts (1 failing)
- UX-teacher-response-followups-01 /teacher/response-followups keeps report scope and state contracts

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain 'aria-label="Assessment follow-up page…'
  - Expected
  + Received
  - aria-label="Assessment follow-up pages"
  + import { Pagination } from "@/components/ui/pagination";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  ```

## tests/unit/UX-tpo-batches-batchid-registrations-membershipid-history-02.test.ts (1 failing)
- UX-tpo-batches-batchid-registrations-membershipid-history-02 > uses the audited shared PageHeader and keeps existing actions

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain '<Button type="submit">Apply</Button>'
  - Expected
  + Received
  - <Button type="submit">Apply</Button>
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {Alert} from "@/components/ui/alert";
  ```

## tests/unit/UX-tpo-find-03.test.ts (1 failing)
- UX-tpo-find-03 > uses shared controls without changing legacy labels or authorized data

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain '<Button type="submit" className="self…'
  - Expected
  + Received
  - <Button type="submit" className="self-end">Find</Button>
  + import {Button} from "@/components/ui/button";
  + import {Input} from "@/components/ui/input";
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  ```

## tests/unit/UX-ui-primitives-chat15-01.test.ts (2 failing)
- UX-ui-primitives-chat15-01 direct contracts > UX-ui-bottom-sheet-01 traps background interaction, returns focus and cues overflow

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useR…' to contain 'modal.showModal()'
  - Expected
  + Received
  - modal.showModal()
  + "use client";
  +
  + import { useId, useRef, type ReactNode, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- UX-ui-primitives-chat15-01 direct contracts > UX-ui-selection-controls-01 uses labelled native controls, 44px targets and reduced motion

  ```
  AssertionError: expected '"use client";\n\nimport type { Compon…' to contain '<input type={type}'
  - Expected
  + Received
  - <input type={type}
  + "use client";
  +
  + import type { ComponentPropsWithRef, ReactNode } from "react";
  + import { cx } from "@/lib/class-names";
  ```

## tests/unit/chat11-college-projects-http-adversarial.test.ts (4 failing)
- PROJ-BREAK-COL-HTTP-01 actual College Admin Projects API boundaries > uses server principal rather than forged user data on create

  ```
  AssertionError: expected 400 to be 201 // Object.is equality
  - Expected
  + Received
  - 201
  + 400
  ```
- PROJ-BREAK-COL-HTTP-01 actual College Admin Projects API boundaries > maps stale-tab/expired-session create failures without exposing internals

  ```
  AssertionError: expected 400 to be 409 // Object.is equality
  - Expected
  + Received
  - 409
  + 400
  ```
- PROJ-BREAK-COL-HTTP-01 actual College Admin Projects API boundaries > uses server principal rather than forged user data on mentor reassignment

  ```
  AssertionError: expected 409 to be 200 // Object.is equality
  - Expected
  + Received
  - 200
  + 409
  ```
- PROJ-BREAK-COL-HTTP-01 actual College Admin Projects API boundaries > GET project listing is read-only and lets server-side scope checks reject forged college

  ```
  AssertionError: expected { projects: [ { …(2) } ], …(3) } to deeply equal { projects: [ { …(2) } ] }
  - Expected
  + Received
  {
  +   "legacyEndpoints": {
  +     "list": "GET /api/v1/admin/projects",
  +     "paged": "GET /api/v1/admin/projects?page={page}&limit={limit}",
  +   },
  ```

## tests/unit/chat11-super-admin-module-metrics-revoked-role.test.ts (1 failing)
- SA-tenants-modules-R01 persisted role and selected tenant authorization > checks persisted authority within the read transaction even for an empty page

  ```
  AssertionError: expected 'import "server-only";\nimport {and,co…' to contain 'tx.select({total:countDistinct(module…'
  - Expected
  + Received
  - tx.select({total:countDistinct(moduleAccessRules.id)})
  + import "server-only";
  + import {and,countDistinct,eq,inArray} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {collegeMemberships,membershipRoles,moduleAccessRules,colleges,users} from "@/db/schema";
  ```
