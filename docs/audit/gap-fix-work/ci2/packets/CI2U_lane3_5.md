# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat11-tpo-recruiter-grant-export-route.test.ts (2 failing)
- TPO-settings-audit-60 recruiter grant exports keep scope and input safe > accepts bounded caller filters while deriving officer scope server-side

  ```
  AssertionError: expected 'attachment; filename="recruiters - 22…' to contain 'filename="recruiters.csv"'
  Expected: "filename="recruiters.csv""
  Received: "attachment; filename="recruiters - 22 Oct 2026.csv""
  ```
- TPO-settings-audit-60 recruiter grant exports keep scope and input safe > returns an Office ZIP workbook using the same authorized filtered rows

  ```
  AssertionError: expected 'attachment; filename="recruiters - 22…' to contain 'filename="recruiters.xlsx"'
  Expected: "filename="recruiters.xlsx""
  Received: "attachment; filename="recruiters - 22 Oct 2026.xlsx""
  ```

## tests/unit/chat12-general-request-scope-r61.test.ts (3 failing)
- chat-12 request admission and duplicate replay invariants > TPO-requests-verification-01 returns an idempotent replay only for identical pending requests

  ```
  AssertionError: expected 'import "server-only";\nimport {random…' to contain 'return {id:existing.id,replayed:true}'
  - Expected
  + Received
  - return {id:existing.id,replayed:true}
  + import "server-only";
  + import {randomUUID} from "node:crypto";
  + import {and,desc,eq,sql} from "drizzle-orm";
  + import {z} from "zod";
  ```
- chat-12 request admission and duplicate replay invariants > TPO-requests-verification-01 keeps all request events and placement-cell notices transactional

  ```
  AssertionError: expected 'import "server-only";\nimport {random…' to contain 'await notifyTpo(tx,college.id,event.i…'
  - Expected
  + Received
  - await notifyTpo(tx,college.id,event.id)
  + import "server-only";
  + import {randomUUID} from "node:crypto";
  + import {and,desc,eq,sql} from "drizzle-orm";
  + import {z} from "zod";
  ```
- chat-12 request admission and duplicate replay invariants > TPO-requests-verification-01 traces the original 0134 incompatibility to the registered 0135 correction

  ```
  Error: ENOENT: no such file or directory, open '/home/runner/work/lms-vnext/lms-vnext/docs/proposed-migrations/chat-12-0134-general-requests-correction.sql'
  ❯ read tests/unit/chat12-general-request-scope-r61.test.ts:4:27
  2| import {describe,expect,it} from "vitest";
  3| const source=readFileSync(new URL("../../src/modules/placements/tpo-ge…
  4| const read=(path:string)=>readFileSync(new URL("../../"+path,import.me…
  |                           ^
  5| describe("chat-12 request admission and duplicate replay invariants",(…
  6|  it("TPO-requests-verification-01 binds an absence dispute to its owne…
  ```

## tests/unit/chat12-round36-legacy-f-filters.test.ts (1 failing)
- TPO Students historical grid filters > TPO-students-24 retains active filter chips and Clear all with live server match counts

  ```
  AssertionError: expected '"use client";\nimport {Select} from "…' to contain 'Active student filters'
  - Expected
  + Received
  - Active student filters
  + "use client";
  + import {Select} from "@/components/ui/select";
  + import {Button} from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  ```

## tests/unit/chat12-tpo-first-third-42-route-scope.test.ts (1 failing)
- UX-tpo-first-third-42 route scope and navigation inventory > UX-/tpo/batches/[batchId]/rules: role/redirect boundary does not open private records before scope

  ```
  AssertionError: expected 'import {PageHeader} from "@/component…' to match /(?:getTpoBatch|listTpoBatch|listTpoBa…/
  - Expected:
  /(?:getTpoBatch|listTpoBatch|listTpoBatches|getTpoLearnerRegistrationHistory)\w*\(/
  + Received:
  "import {PageHeader} from \"@/components/ui/page-header\";
  import {batchRuleDate} from \"@/modules/placements/tpo-batch-labels-model\";
  import {TpoBatchRuleEditor} from \"@/components/tpo/tpo-batch-rule-editor\";
  import {tpoBatchRuleOverridesSchema} from \"@/modules/placements/tpo-batch-rules-model\";
  ```

## tests/unit/chat13-accreditation-report-evidence-integrity.test.ts (2 failing)
- chat-13 Super Admin accreditation evidence-only report adversarial reconciliation > SA-ACCREDITATION-10 reports only accepted real-OFFER CTC, blank official denominator and protected CSV cells

  ```
  AssertionError: expected { drives: 1, liveDrives: null, …(22) } to match object { drives: 1, applicants: 2, …(4) }
  (18 matching properties omitted from actual)
  - Expected
  + Received
  {
  "acceptedOffers": 2,
  "applicants": 2,
  -   "averagePackageInr": 600000,
  ```
- chat-13 Super Admin accreditation evidence-only report adversarial reconciliation > SA-ACCREDITATION-11 refuses to certify placement rate or guess a missing season

  ```
  AssertionError: expected +0 to be null
  - Expected:
  null
  + Received:
  0
  ```

## tests/unit/chat13-final-sprint-learner-35.test.ts (1 failing)
- LEARNER-placements-35 booked-round attendance confirmation > LEARNER-placements-35 offers precise confirmation chips and a grouped needs-confirmation count

  ```
  AssertionError: expected 'import { Tabs } from "@/components/ui…' to contain 'rounds need your confirmation'
  - Expected
  + Received
  - rounds need your confirmation
  + import { Tabs } from "@/components/ui/tabs";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  ```
