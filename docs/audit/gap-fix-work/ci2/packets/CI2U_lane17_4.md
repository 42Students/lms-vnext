# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-tpo-batches-batchid-01.test.ts (1 failing)
- UX-tpo-batches-batchid-01 /tpo/batches/[batchId] > preserves legacy UI while applying signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import { StackedMetricBar } from "@/c…' not to match /min-h-(?:9|10)\b/
  - Expected:
  /min-h-(?:9|10)\b/
  + Received:
  "import { StackedMetricBar } from \"@/components/ui/stacked-metric-bar\";
  import batchStyles from \"@/components/tpo/legacy-batch-eligibility.module.css\";
  import Link from \"next/link\";
  import {tpoBatchReturnHref} from \"@/modules/placements/tpo-batch-return-model\";
  ```

## tests/unit/UX-tpo-companies-companyid-manage-01.test.ts (1 failing)
- UX-tpo-companies-companyid-manage-01 /tpo/companies/[companyId]/manage > preserves legacy UI and signed-off phone and contrast contracts

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

## tests/unit/UX-tracker-audit-findings-publicId-01.test.ts (1 failing)
- UX-tracker-audit-findings-publicId-01 > preserves canonical route, scoped data and the audited mobile/action states

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '← Back to audit findings'
  - Expected
  + Received
  - ← Back to audit findings
  + import Link from "next/link";
  + import {notFound} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  ```

## tests/unit/bug-tracker-workflow.test.ts (1 failing)
- DB10 legacy bug tracker workflow contract > rejects retest unless READY_FOR_RETEST and never changes the caller's snapshot

  ```
  AssertionError: expected [Function] to throw error including 'INVALID_STATE' but got 'Issue is not ready for retest.'
  Expected: "INVALID_STATE"
  Received: "Issue is not ready for retest."
  ```

## tests/unit/chat11-learner-projects-list-round3.test.ts (1 failing)
- chat-11 learner Projects legacy list behavior > COL-academic-setup-24 retains program form reset and valid page size persistence choices

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain '{[10, 25, 50, 100].map'
  - Expected
  + Received
  - {[10, 25, 50, 100].map
  + "use client";
  +
  + import { useEffect, useState, useTransition, useSyncExternalStore, type FormEvent } from "react";
  + import { usePathname, useRouter } from "next/navigation";
  ```

## tests/unit/chat11-tpo-job-type-last-custom-visibility.test.ts (1 failing)
- TPO-settings-audit-23 custom job type visibility > lets the UI request disabling the last active custom row and delegates the real last-active decision to the server

  ```
  AssertionError: expected '"use client";\n\nimport { TpoUnifiedJ…' to contain '<button type="button" disabled={busy}…'
  - Expected
  + Received
  - <button type="button" disabled={busy} onClick={()=>void send(
  + "use client";
  +
  + import { TpoUnifiedJobTypesEditor, type EditableJobType } from "./tpo-unified-job-types-editor";
  +
  ```
