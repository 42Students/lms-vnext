# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-tpo-batches-01.test.ts (1 failing)
- UX-tpo-batches-01 /tpo/batches > preserves legacy UI while applying signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import { Disclosure } from "@/compone…' not to match /min-h-(?:9|10)\b/
  - Expected:
  /min-h-(?:9|10)\b/
  + Received:
  "import { Disclosure } from \"@/components/ui/disclosure\";
  import {Button} from \"@/components/ui/button\";
  import {Select} from \"@/components/ui/select\";
  import {TpoBatchUndoControl} from \"@/components/tpo/tpo-batch-undo-control\";
  ```

## tests/unit/UX-tpo-companies-companyid-feedback-01.test.ts (1 failing)
- UX-tpo-companies-companyid-feedback-01 /tpo/companies/[companyId]/feedback > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to match /min-h-(?:9|10)\b/
  - Expected:
  /min-h-(?:9|10)\b/
  + Received:
  "import Link from \"next/link\";
  import { notFound, redirect } from \"next/navigation\";
  import { getCurrentRequestContext } from \"@/auth/request-context\";
  import {requireTpoBatchActor} from \"@/modules/placements/tpo-batch-workspace-read-service\";
  ```

## tests/unit/UX-tracker-audit-findings-01.test.ts (1 failing)
- UX-tracker-audit-findings-01 > preserves canonical route, scoped data and the audited mobile/action states

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain '<DataTable columns={findingColumns}'
  - Expected
  + Received
  - <DataTable columns={findingColumns}
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Banner } from "@/components/ui/banner";
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/bug-tracker-access-and-attachments.test.ts (10 failing)
- DB10 screenshot validation without public object URLs > refuses unsupported content type image/svg+xml

  ```
  
  ```
- DB10 screenshot validation without public object URLs > refuses unsupported content type image/gif

  ```
  
  ```
- DB10 screenshot validation without public object URLs > refuses unsupported content type application/pdf

  ```
  
  ```
- DB10 screenshot validation without public object URLs > refuses unsupported content type text/html

  ```
  AssertionError: expected [Function] to throw error including 'INVALID_FILE' but got 'Screenshot must be a PNG, JPEG or Web…'
  Expected: "INVALID_FILE"
  Received: "Screenshot must be a PNG, JPEG or WebP image."
  ```
- DB10 screenshot validation without public object URLs > rejects invalid object content size 0

  ```
  
  ```
- DB10 screenshot validation without public object URLs > rejects invalid object content size -1

  ```
  
  ```
- DB10 screenshot validation without public object URLs > rejects invalid object content size 8388609

  ```
  
  ```
- DB10 screenshot validation without public object URLs > rejects invalid object content size 1.5

  ```
  
  ```
- DB10 screenshot validation without public object URLs > rejects invalid object content size NaN

  ```
  AssertionError: expected [Function] to throw error including 'INVALID_FILE' but got 'Screenshot is empty or larger than 8 …'
  Expected: "INVALID_FILE"
  Received: "Screenshot is empty or larger than 8 MB. Choose an image up to 8 MB."
  ```
- DB10 screenshot validation without public object URLs > refuses fourth attachment even if MIME and size are valid

  ```
  AssertionError: expected [Function] to throw error including 'TOO_MANY_ATTACHMENTS' but got 'This issue already has the maximum nu…'
  Expected: "TOO_MANY_ATTACHMENTS"
  Received: "This issue already has the maximum number of screenshots"
  ```

## tests/unit/chat11-learner-course-deadline-empty.test.ts (1 failing)
- learner course deadline, own submissions and empty state > LEARNER-course-detail-20 restores no-roadmap, no-content and filtered lesson copy

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'No content in this lesson yet.'
  - Expected
  + Received
  - No content in this lesson yet.
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import type {ComponentProps} from "react";
  + import progressStyles from "./learner-course-progress.module.css";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/chat11-tpo-job-type-cas-retries.test.ts (1 failing)
- TPO-settings-audit-23 atomic, idempotent job-type config changes > TPO-settings-audit-23 refuses symbol-only labels while allowing Indian scripts

  ```
  AssertionError: expected { success: true, data: '--' } to match object { success: false }
  (1 matching property omitted from actual)
  - Expected
  + Received
  {
  -   "success": false,
  +   "success": true,
  }
  ```
