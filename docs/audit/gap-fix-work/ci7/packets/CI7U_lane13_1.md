# CI unit-test packet (round 7)

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
  -     "pageSize": 10,
  +     "pageSize": 20,
  ```

## tests/unit/UX-superadmin-import-tables-chat17.test.ts (2 failing)
- UX-UNOWNED-TABLE-07/08 Super Admin import surfaces > student import history uses the shared mobile DataTable with intact four legacy headings

  ```
  AssertionError: expected '"use client";\n\nimport { useState } …' to contain 'No import history found.'
  - Expected
  + Received
  - No import history found.
  + "use client";
  +
  + import { useState } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- UX-UNOWNED-TABLE-07/08 Super Admin import surfaces > faculty CSV import preserves CAS confirmation, upload bounds and per-row outcomes

  ```
  AssertionError: expected '"use client";\nimport { useRef, useSt…' not to match /<\s*table\b/i
  - Expected:
  /<\s*table\b/i
  + Received:
  "\"use client\";
  import { useRef, useState } from \"react\";
  import { useRouter } from \"next/navigation\";
  import { parseFacultyBulkCsv } from \"@/modules/people/faculty-bulk-import-model\";
  ```

## tests/unit/chat12-round37-xlsx-export.test.ts (1 failing)
- TPO-students-36 creates genuine ZIP-based XLSX with sorted scoped columns, mandatory batch/branch and an italic view provenance line

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain 'Export selected XLSX'
  - Expected
  + Received
  - Export selected XLSX
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Select} from "@/components/ui/select";
  ```

## tests/unit/chat14-final-pub-auth-public-31.test.ts (1 failing)
- chat-14 final sprint > PUB-auth-public-31 broadcasts safe API failure globally and keeps the offline banner

  ```
  AssertionError: expected 'import {Suspense} from "react";\nimpo…' to contain '<ConnectionFailureNotice/>'
  - Expected
  + Received
  - <ConnectionFailureNotice/>
  + import {Suspense} from "react";
  + import {PortalAccessNotice} from "@/components/auth/portal-access-notice";
  + import {ConnectionFailureNotice} from "@/components/auth/connection-failure-notice";
  + import { redirect } from "next/navigation";
  ```
