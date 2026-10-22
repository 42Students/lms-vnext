# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-final-TPO-campaigns-public-03.test.ts (1 failing)
- chat-9 final sprint > TPO-campaigns-public-03 verifies the implemented contract

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' to contain 'Provider acceptance does not prove re…'
  - Expected
  + Received
  - Provider acceptance does not prove recipient delivery.
  + import { Alert } from "@/components/ui/alert";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Dropdown } from "@/components/ui/dropdown";
  ```

## tests/unit/chat9-round9-report-evidence.test.ts (1 failing)
- chat9 report evidence, filters and privacy > TPO-calendar-reports-43 refuses to fabricate resume/mark verification on the unplaced report

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' to contain 'Academic marks and resume verificatio…'
  - Expected
  + Received
  - Academic marks and resume verification require authoritative evidence
  + import { Input } from "@/components/ui/input";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { TpoReportPresentation } from "@/components/placements/tpo-report-presentation";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/college-academic-export-model.test.ts (1 failing)
- college semester CSV > exports bounded saved batch progression and neutralizes spreadsheet formulas

  ```
  TypeError: Cannot read properties of undefined (reading 'replace')
  ❯ safeCollegeCsvCell src/modules/academics/college-directory-export-model.ts:6:22
  4|  * invisible prefixes that some spreadsheet engines silently strip. */
  5| function safeCollegeCsvCell(value:string):string {
  6|  const visible=value.replace(/^[\s\p{Cf}\p{Mn}]*/u,"");
  |                      ^
  7|  return escapeActivityCsvCell(/^[-=+@]/u.test(visible)?"'"+value:value…
  8| }
  ```

## tests/unit/college-group-csv-preview.test.ts (1 failing)
- Student Group email import dry-run > rejects missing header, oversize files and malformed quoting

  ```
  AssertionError: expected [Function] to throw an error
  - Expected:
  null
  + Received:
  undefined
  ```

## tests/unit/faculty-courses-chat7-batched-list.test.ts (1 failing)
- faculty course cards use bounded scoped summaries > FAC-courses-09 uses fixed batched queries not one full workspace load per card

  ```
  AssertionError: expected 'import "server-only";\n\nimport { and…' to contain 'if (!assigned.length) return result'
  - Expected
  + Received
  - if (!assigned.length) return result
  + import "server-only";
  +
  + import { and, asc, eq, inArray, ne } from "drizzle-orm";
  + import { getDb } from "@/db/client";
  ```

## tests/unit/graceful-raw-error-scan.test.ts (2 failing)
- new raw-error and mutation regression gate > GR-09 rejects new renderings of API codes or internal error messages

  ```
  AssertionError: New unsafe error rendering in: src/components/projects/super-admin-template-plan-editor.tsx: expected [ Array(1) ] to deeply equal []
  - Expected
  + Received
  - []
  + [
  +   "src/components/projects/super-admin-template-plan-editor.tsx",
  + ]
  ```
- new raw-error and mutation regression gate > GR-31 inventories newly changed unguarded mutating components

  ```
  AssertionError: Mutating fetch without useGuardedAction: src/components/academics/college-archived-programs.tsx, src/components/academics/college-hall-booking-action.tsx, src/components/academics/college-hall-cancellation-action.tsx, src/components/admin/tenant-domain-manager.tsx, src/components/col
  - Expected
  + Received
  - []
  + [
  +   "src/components/academics/college-archived-programs.tsx",
  +   "src/components/academics/college-hall-booking-action.tsx",
  +   "src/components/academics/college-hall-cancellation-action.tsx",
  ```

## tests/unit/learner-course-detail-round5.test.ts (1 failing)
- chat-11 Learner Course Detail legacy parity > LEARNER-course-detail-14 displays content kind, progress and due labels on learning items

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useS…' to contain 'caption ?? kind'
  - Expected
  + Received
  - caption ?? kind
  + "use client";
  +
  + import { useId, useState, type ReactNode } from "react";
  + import { Dialog } from "@/components/ui/dialog";
  ```

## tests/unit/learner-placements-chat7-apply-blockers.test.ts (1 failing)
- learner eligibility deny-state explanations > LEARNER-placements-R01 names real registration and academic evidence blockers

  ```
  AssertionError: expected [ Array(1) ] to deeply equal [ Array(1) ]
  - Expected
  + Received
  [
  -   "Register for placements to participate in campus drives.",
  +   "Register for placements first. It takes a minute, and then you can apply.",
  ]
  ```
