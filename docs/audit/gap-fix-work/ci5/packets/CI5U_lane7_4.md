# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-college-project-resource-audit.test.ts (1 failing)
- College workspace resource activity > COL-projects-18 recognizes resource added edited saved removed without treating task events as resource edits

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'All resource changes'
  - Expected
  + Received
  - All resource changes
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Input } from "@/components/ui/input";
  ```

## tests/unit/chat9-round6-college-projects-parity.test.ts (1 failing)
- College Admin Projects round 6 > COL-projects-16 provides template search section counts details and a scoped CSV export

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'visible.map'
  - Expected
  + Received
  - visible.map
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```

## tests/unit/chat9-tpo-job-type-policy-round8.test.ts (2 failing)
- chat9 TPO job-type and drive-approval verification > TPO-settings-audit-21 requires an explicit placed decision for each new custom job type

  ```
  AssertionError: expected '"use client";\n\nimport { TpoUnifiedJ…' to contain 'countsAsPlaced===null'
  - Expected
  + Received
  - countsAsPlaced===null
  + "use client";
  +
  + import { TpoUnifiedJobTypesEditor, type EditableJobType } from "./tpo-unified-job-types-editor";
  +
  ```
- chat9 TPO job-type and drive-approval verification > TPO-settings-audit-22 preserves in-use job-type history by deactivating instead of deleting a referenced category

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' not to match /delete\(placementTpoJobTypes\)/
  - Expected:
  /delete\(placementTpoJobTypes\)/
  + Received:
  "import \"server-only\";
  import {and,eq,sql} from \"drizzle-orm\";
  import {z} from \"zod\";
  import {getDb} from \"@/db/client\";
  ```

## tests/unit/college-directory-mobile-scroll.test.ts (2 failing)
- College Admin mobile tables > exposes keyboard-scrollable and mobile-annotated semester and batch results

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain 'max-w-full overflow-x-auto'
  - Expected
  + Received
  - max-w-full overflow-x-auto
  + import type { ReactNode } from "react";
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Button } from "@/components/ui/button";
  + import { StatusBadge } from "@/components/ui/status-badge";
  ```
- College Admin mobile tables > exposes keyboard-scrollable and mobile-annotated class and elective results

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain 'max-w-full overflow-x-auto'
  - Expected
  + Received
  - max-w-full overflow-x-auto
  + import type { ReactNode } from "react";
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Button } from "@/components/ui/button";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/company-share-mobile-cards.test.ts (2 failing)
- renders equivalent three-field mobile cards and desktop tables

  ```
  AssertionError: expected 'import authStyles from "@/components/…' to contain 'cell: row=>row.cells[key]??"Not recor…'
  - Expected
  + Received
  - cell: row=>row.cells[key]??"Not recorded"
  + import authStyles from "@/components/public/public-auth-skin.module.css";
  + import Link from "next/link";
  + import { Button } from "@/components/ui/button";
  + import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
  ```
- discloses only the selected fields on either viewport

  ```
  AssertionError: expected [ 'APPLICATION_ID', 'NAME', …(2) ] to deeply equal [ 'NAME', 'ROLL_NUMBER', 'STAGE' ]
  - Expected
  + Received
  [
  +   "APPLICATION_ID",
  "NAME",
  "ROLL_NUMBER",
  "STAGE",
  ```

## tests/unit/faculty-video-management-ui.test.ts (1 failing)
- faculty lesson management storage API wiring > exposes upload thumbnail replacement, publish, ordering, delete and content linking

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain '"DELETE",undefined'
  - Expected
  + Received
  - "DELETE",undefined
  + "use client";
  +
  + import { useEffect, useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```

## tests/unit/learner-applications-browse-parity.test.ts (1 failing)
- Learner Applications list and detail route > supports shareable filters and an application-id detail drawer

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'item.applicationId === url.applicatio…'
  - Expected
  + Received
  - item.applicationId === url.applicationId
  + "use client";
  +
  + import Link from "next/link";
  + import { useCallback, useEffect, useRef, useState } from "react";
  ```

## tests/unit/learner-offer-action-errors.test.ts (1 failing)
- non-leaking learner offer action failures > does not reveal existence on role or college denial

  ```
  AssertionError: expected 'Only learners can respond to their ow…' to contain 'current account'
  Expected: "current account"
  Received: "Only learners can respond to their own offers. Switch to your learner workspace."
  ```
