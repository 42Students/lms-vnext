# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-request-drive-page-01.test.ts (3 failing)
- HR-BREAK-request-drive-page-01: no-grant, wrong college and stale draft > invalid college/query combinations and guessed college IDs are rejected before a DB read

  ```
  AssertionError: expected '  ' to contain 'We couldn\'t load that drive'
  Expected: "We couldn't load that drive"
  Received: "  "
  ```
- HR-BREAK-request-drive-page-01: no-grant, wrong college and stale draft > a stale or cancelled request cannot be treated as a valid edit or sent-back revision

  ```
  AssertionError: expected '  ' to contain 'We couldn\'t load that drive'
  Expected: "We couldn't load that drive"
  Received: "  "
  ```
- HR-BREAK-request-drive-page-01: no-grant, wrong college and stale draft > a valid new request remains scoped to its college and uses authorized branch suggestions

  ```
  AssertionError: expected [ …(2) ] to include '/hr/drives?collegeId=123e4567-e89b-42…'
  ❯ tests/unit/HR-BREAK-request-drive-page-01.test.ts:93:25
  91|   expect(rendered(result)).toContain("Request is scoped to");
  92|   expect(rendered(result)).toContain("College A");
  93|   expect(hrefs(result)).toContain("/hr/drives?collegeId="+collegeA);
  |                         ^
  94|   expect(m.branches).toHaveBeenCalledWith(expect.anything(),collegeA);
  95|   expect(m.requests).not.toHaveBeenCalled();
  ```

## tests/unit/PROJ-BREAK-chat9-sa-student-lookup-recovery.test.tsx (1 failing)
- Super Admin last-third student placement lookup: URL safety and role scope > SA-placements-student-lookup-02 invalid long, duplicate, whitespace-only and short GET never reach DB

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/UX-college-academic-directory-scroll-chat17.test.ts (2 failing)
- UX-UNOWNED-GRID-11 responsive College Admin academic directories > college-academic-directory.tsx preserves editing and filter actions with scroll cues

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain 'Mapped courses'
  - Expected
  + Received
  - Mapped courses
  + import type { ReactNode } from "react";
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Button } from "@/components/ui/button";
  + import { StatusBadge } from "@/components/ui/status-badge";
  ```
- UX-UNOWNED-GRID-11 responsive College Admin academic directories > college-structure-directory.tsx preserves editing and filter actions with scroll cues

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain 'Program / batch'
  - Expected
  + Received
  - Program / batch
  + import type { ReactNode } from "react";
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Button } from "@/components/ui/button";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/UX-dense-grids-chat17.test.ts (1 failing)
- UX-UNOWNED-DENSE-GRID-05 semantic grid exceptions > college attendance month grid retains each scheduled-day column and per-learner correction controls

  ```
  AssertionError: expected '"use client";\n\nimport { ADMIN_ATTEN…' to contain '<Drawer'
  - Expected
  + Received
  - <Drawer
  + "use client";
  +
  + import { ADMIN_ATTENDANCE_COPY } from "@/modules/attendance/admin-attendance-copy";
  + import {AdminAttendanceParentContactEditor} from "./admin-attendance-parent-contact-editor";
  ```

## tests/unit/UX-tpo-companies-01.test.ts (1 failing)
- UX-tpo-companies-01 /tpo/companies > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import {TpoCompaniesSpreadsheet} from…' not to match /min-h-(?:9|10)\b/
  - Expected:
  /min-h-(?:9|10)\b/
  + Received:
  "import {TpoCompaniesSpreadsheet} from \"@/components/tpo/tpo-companies-spreadsheet\";
  import {Button} from \"@/components/ui/button\";
  import {Select} from \"@/components/ui/select\";
  import {Input} from \"@/components/ui/input\";
  ```

## tests/unit/chat11-final-SA-tenants-modules-R01.test.ts (1 failing)
- Super Admin control-page overview final sprint > SA-tenants-modules-R01 restores all three header-card contracts with truthful bounded counters

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Effective access'
  - Expected
  + Received
  - Effective access
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Banner } from "@/components/ui/banner";
  ```

## tests/unit/chat12-round35-cross-page-selection.test.ts (1 failing)
- TPO-students-17 preserves a tenant-scoped whole-view 5000-row selection across pages and range-selects with Shift

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain 'visibleRowIds.slice(Math.min(anchor.c…'
  - Expected
  + Received
  - visibleRowIds.slice(Math.min(anchor.current,index)
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {FilterChip} from "@/components/ui/filter-chip";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat13-final-sprint-public-share-zip.test.ts (1 failing)
- PUB-auth-public-55 blocks resume ZIP until signed malware-scanned file delivery is registered

  ```
  AssertionError: expected 'import authStyles from "@/components/…' not to contain 'Download all resumes (ZIP)'
  - Expected
  + Received
  - Download all resumes (ZIP)
  + import authStyles from "@/components/public/public-auth-skin.module.css";
  + import Link from "next/link";
  + import { Button } from "@/components/ui/button";
  + import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
  ```
