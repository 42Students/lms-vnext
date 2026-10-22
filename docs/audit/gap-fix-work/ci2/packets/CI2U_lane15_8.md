# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat2-tpo-unowned-work-parity.test.ts (1 failing)
- TPO unowned work assignment safety > TPO-inbox-team-33 exposes a guarded, accessible assigner only when the schema is ready

  ```
  AssertionError: expected '"use client";\n\nimport { useRef, use…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  +
  + import { useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```

## tests/unit/chat3-final-sprint-company-memory.test.ts (4 failing)
- chat-3 final sprint TPO Companies company memory > TPO-companies-08 preserves the persisted legacy company memory contract

  ```
  AssertionError: expected '"use client";\nimport { PageBackLink …' to contain 'Search drives'
  - Expected
  + Received
  - Search drives
  + "use client";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Badge } from "@/components/ui/badge";
  ```
- chat-3 final sprint TPO Companies company memory > TPO-companies-10 preserves the persisted legacy company memory contract

  ```
  AssertionError: expected '"use client";\nimport { PageBackLink …' to contain 'href={"/tpo/placements/jobs/" + encod…'
  - Expected
  + Received
  - href={"/tpo/placements/jobs/" + encodeURIComponent(drive.id)}
  + "use client";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Badge } from "@/components/ui/badge";
  ```
- chat-3 final sprint TPO Companies company memory > TPO-companies-11 preserves the persisted legacy company memory contract

  ```
  AssertionError: expected '"use client";\nimport { PageBackLink …' to contain 'Nothing shared yet.'
  - Expected
  + Received
  - Nothing shared yet.
  + "use client";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Badge } from "@/components/ui/badge";
  ```
- chat-3 final sprint TPO Companies company memory > TPO-companies-12 preserves the persisted legacy company memory contract

  ```
  AssertionError: expected '"use client";\nimport { PageBackLink …' to contain 'Invite sent, not opened'
  - Expected
  + Received
  - Invite sent, not opened
  + "use client";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Badge } from "@/components/ui/badge";
  ```

## tests/unit/chat4-admin-colleges-organizations-directory.test.ts (2 failing)
- Super Admin colleges and organizations directory contracts (chat-4) > SA-colleges-directory-01 parses a search/pagination query without discarding legitimate filters

  ```
  AssertionError: expected { q: '', page: 1, pageSize: 10 } to deeply equal { q: '', page: 1, pageSize: 25 }
  - Expected
  + Received
  {
  "page": 1,
  -   "pageSize": 25,
  +   "pageSize": 10,
  "q": "",
  ```
- Super Admin colleges and organizations directory contracts (chat-4) > SA-colleges-directory-06 checks the Super Admin permission before even rendering invalid-filter errors

  ```
  AssertionError: expected 7258 to be less than -1
  ❯ tests/unit/chat4-admin-colleges-organizations-directory.test.ts:99:57
  97|     expect(organizationPage).toMatch(/requirePermission\(context,\s*"a…
  98|     for (const page of [collegePage, organizationPage]) {
  99|       expect(page.indexOf("requirePermission(context")).toBeLessThan(p…
  |                                                         ^
  100|     }
  101|   });
  ```

## tests/unit/chat4-college-import-tenant-journey-depth.test.ts (2 failing)
- College bulk import and Super Admin tenant setup journey > COL-IMPORT-PREVIEW-01 rejects header-only, duplicate headings and excess columns

  ```
  AssertionError: expected [Function] to throw error including 'Duplicate college code' but got 'Row 3: duplicate college code ABC (fi…'
  Expected: "Duplicate college code"
  Received: "Row 3: duplicate college code ABC (first used on line 2)."
  ```
- College bulk import and Super Admin tenant setup journey > SA-COL-SETUP-02 links tenant setup steps in a defined order without claiming runtime readiness

  ```
  AssertionError: expected [ 'brand', 'login', 'host', …(5) ] to deeply equal [ 'brand', 'login', 'host', …(4) ]
  - Expected
  + Received
  [
  "brand",
  "login",
  "host",
  +   "preview",
  ```

## tests/unit/chat4-final-fac-attendance-grades-22.test.ts (2 failing)
- FAC-attendance-grades-22 header-copy parity > FAC-attendance-grades-22 does not invent legacy Faculty eyebrow or a dynamic report header description

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' not to match /<PageHeader[^>]*\bdescription=/
  - Expected:
  /<PageHeader[^>]*\bdescription=/
  + Received:
  "import { Pagination } from \"@/components/ui/pagination\";
  import { Disclosure } from \"@/components/ui/disclosure\";
  import { Input } from \"@/components/ui/input\";
  import {Button} from \"@/components/ui/button\";
  ```
- FAC-attendance-grades-22 header-copy parity > FAC-attendance-grades-22 preserves authorized read APIs, actions and meaningful states

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain 'Download full Section CSV'
  - Expected
  + Received
  - Download full Section CSV
  + import { Pagination } from "@/components/ui/pagination";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Input } from "@/components/ui/input";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat4-superadmin-college-admins-list-page.test.tsx (4 failing)
- SA-colleges-admins-list-01 tenant administrator roster page > renders the empty/permission-safe scoped directory without invented admins

  ```
  TypeError: Cannot read properties of undefined (reading 'page')
  ❯ Module.CollegeAdministratorsPage src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:26:20
  24|  const context=await getCurrentRequestContext();
  25|  const raw=await searchParams;
  26|  const rawPage=raw.page;
  |                    ^
  27|  const validPage=Object.keys(raw).every(key=>key==="page"||key==="role…
  28|    (rawPage===undefined||(typeof rawPage==="string"&&/^[1-9][0-9]{0,4}…
  ```
- SA-colleges-admins-list-01 tenant administrator roster page > renders real role/status and authorized nested device and history URLs

  ```
  TypeError: Cannot read properties of undefined (reading 'page')
  ❯ Module.CollegeAdministratorsPage src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:26:20
  24|  const context=await getCurrentRequestContext();
  25|  const raw=await searchParams;
  26|  const rawPage=raw.page;
  |                    ^
  27|  const validPage=Object.keys(raw).every(key=>key==="page"||key==="role…
  28|    (rawPage===undefined||(typeof rawPage==="string"&&/^[1-9][0-9]{0,4}…
  ```
- SA-colleges-admins-list-01 tenant administrator roster page > discloses a 500-record cap rather than presenting incomplete rosters as exhaustive

  ```
  TypeError: Cannot read properties of undefined (reading 'page')
  ❯ Module.CollegeAdministratorsPage src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:26:20
  24|  const context=await getCurrentRequestContext();
  25|  const raw=await searchParams;
  26|  const rawPage=raw.page;
  |                    ^
  27|  const validPage=Object.keys(raw).every(key=>key==="page"||key==="role…
  28|    (rawPage===undefined||(typeof rawPage==="string"&&/^[1-9][0-9]{0,4}…
  ```
- SA-colleges-admins-list-01 tenant administrator roster page > does not render administrator details when the scoped service denies the actor

  ```
  AssertionError: expected [Function] to throw error including 'REVOKED' but got 'Cannot read properties of undefined (…'
  Expected: "REVOKED"
  Received: "Cannot read properties of undefined (reading 'page')"
  ```
