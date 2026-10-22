# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat11-tpo-recruiter-grant-excel-export.test.ts (1 failing)
- TPO-settings-audit-60 historical recruiter grant Excel and CSV parity > does not accept ambiguous or cross-tenant URL parameter overrides

  ```
  AssertionError: expected 'import { gridExportFilename } from "@…' to contain 'filename="recruiters.csv"'
  - Expected
  + Received
  - filename="recruiters.csv"
  + import { gridExportFilename } from "@/modules/placements/grid-export-filename";
  + import {NextResponse} from "next/server";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {apiErrorResponse} from "@/lib/api-error";
  ```

## tests/unit/chat12-fixed-main-students-requests-audit-r2.test.ts (1 failing)
- TPO FIXED-ON-MAIN source checks; live acceptance required > TPO-requests-verification-24 retains its assigned source contract

  ```
  AssertionError: expected '"use client";\nimport { Select } from…' to contain 'Review one by one'
  - Expected
  + Received
  - Review one by one
  + "use client";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  + import {useRouter,useSearchParams} from "next/navigation";
  ```

## tests/unit/chat12-round35-cross-page-selection.test.ts (1 failing)
- TPO-students-17 preserves a tenant-scoped whole-view 5000-row selection across pages and range-selects with Shift

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain 'selectAllIds=selection?.allIds??visib…'
  - Expected
  + Received
  - selectAllIds=selection?.allIds??visibleRowIds
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {FilterChip} from "@/components/ui/filter-chip";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat12-tpo-drive-visibility-200-cas.test.ts (1 failing)
- TPO-students-12 200-learner show/hide and stale visibility CAS > UI uses bounded previewed-row CAS and only undoes its exact saved override IDs

  ```
  AssertionError: expected '"use client";\nimport {Textarea} from…' to contain 'const expectedOverrideId=current.elig…'
  - Expected
  + Received
  - const expectedOverrideId=current.eligibility.override?.id??null
  + "use client";
  + import {Textarea} from "@/components/ui/textarea";
  + import {Select} from "@/components/ui/select";
  + import {useId,useState} from "react";
  ```

## tests/unit/chat13-academic-program-department-move.test.ts (1 failing)
- Super Admin program department changes > SA-academics-people-12 allows moving an unlinked program only to another active department in the scoped college

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to match />Department\s*\n/
  - Expected:
  />Department\s*\n/
  + Received:
  "\"use client\";
  import Link from \"next/link\";
  import type { ReactNode } from \"react\";
  import { Dropdown } from \"@/components/ui/dropdown\";
  ```

## tests/unit/chat13-final-sprint-learner-24.test.ts (1 failing)
- LEARNER-placements-24 cancelled/closed drive history > LEARNER-placements-24 preserves own historical applied drives instead of returning notFound

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'if(rows.length===0&&!journey)notFound…'
  - Expected
  + Received
  - if(rows.length===0&&!journey)notFound()
  + import Link from "next/link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Banner } from "@/components/ui/banner";
  + import {readOptionalLearnerPlacementSource} from "@/modules/placements/learner-optional-placement-source";
  ```
