# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-withdrawal-source-contract.test.ts (2 failing)
- Learner withdrawal UX and backend write contracts > requires explicit reason-bearing confirmation in the existing Applications drawer

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'Confirm application withdrawal'
  - Expected
  + Received
  - Confirm application withdrawal
  + "use client";
  +
  + import Link from "next/link";
  + import { useCallback, useEffect, useRef, useState } from "react";
  ```
- Learner withdrawal UX and backend write contracts > rechecks same origin, Zod and persisted active role/college within audited transaction

  ```
  AssertionError: expected 'import {\n  and,\n  asc,\n  desc,\n  …' to contain 'learnerWithdrawalReasonSchema.optiona…'
  - Expected
  + Received
  - learnerWithdrawalReasonSchema.optional().parse(reasonInput)
  + import {
  +   and,
  +   asc,
  +   desc,
  ```

## tests/unit/placement-calendar-model.test.ts (4 failing)
- Placement calendar view windows > uses Monday-first week boundaries

  ```
  AssertionError: expected '2026-10-11' to be '2026-10-12' // Object.is equality
  Expected: "2026-10-12"
  Received: "2026-10-11"
  ```
- Placement calendar view windows > includes adjacent month days in a 42-day grid

  ```
  AssertionError: expected '2026-09-27' to be '2026-09-28' // Object.is equality
  Expected: "2026-09-28"
  Received: "2026-09-27"
  ```
- Placement calendar view windows > uses the selected calendar month for agenda

  ```
  AssertionError: expected { from: '2026-02-14', …(2) } to deeply equal { from: '2026-02-01', …(2) }
  - Expected
  + Received
  {
  "days": [],
  -   "from": "2026-02-01",
  -   "to": "2026-02-28",
  +   "from": "2026-02-14",
  ```
- Placement calendar view windows > handles leap-year month boundaries

  ```
  AssertionError: expected '2028-03-30' to be '2028-02-29' // Object.is equality
  Expected: "2028-02-29"
  Received: "2028-03-30"
  ```

## tests/unit/public-error-pages.test.ts (1 failing)
- shared public error pages > GR-13 keeps a customer-friendly no-code 404 route

  ```
  AssertionError: expected 'import type { Metadata } from "next";…' to contain 'homeHref="/"'
  - Expected
  + Received
  - homeHref="/"
  + import type { Metadata } from "next";
  + import { GracefulScreen } from "@/components/public/graceful-screen";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { getShellNavigation } from "@/components/shell/shell-model";
  ```

## tests/unit/route-dynamic-slug-names.test.ts (1 failing)
- app router dynamic segments > never uses two different slug names at the same path level (Next fails at runtime)

  ```
  AssertionError: expected [ …(2) ] to deeply equal []
  - Expected
  + Received
  - []
  + [
  +   "api/placements/recruiter/pending-invites: [collegeId] vs [grantId]",
  +   "api/v2/colleges: [...legacyMode] vs [[...path]]",
  + ]
  ```

## tests/unit/super-admin-template-directory-model.test.ts (1 failing)
- Super Admin template catalogue filters > retains filters in internal next-page route

  ```
  AssertionError: expected 5 to be 3 // Object.is equality
  - Expected
  + Received
  - 3
  + 5
  ```

## tests/unit/tpo-batches-chat5-round4-fallback.test.ts (4 failing)
- TPO Batches resilient working set > TPO-batches-09 ranks active eligible batches before nonempty, empty and finished

  ```
  AssertionError: expected [ 'with-students', 'active', …(2) ] to deeply equal [ 'active', 'with-students', …(2) ]
  - Expected
  + Received
  [
  -   "active",
  "with-students",
  +   "active",
  "empty",
  ```
- TPO Batches resilient working set > TPO-batches-15 never displays internal migration names when lifecycle data is unavailable

  ```
  AssertionError: expected 'import { Disclosure } from "@/compone…' to contain 'Some batch details are temporarily un…'
  - Expected
  + Received
  - Some batch details are temporarily unavailable.
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {TpoBatchUndoControl} from "@/components/tpo/tpo-batch-undo-control";
  ```
- TPO Batches resilient working set > GR-38 does not show zero when a KPI could not be loaded

  ```
  AssertionError: expected 'import { Disclosure } from "@/compone…' to contain 'journey===null?"—"'
  - Expected
  + Received
  - journey===null?"—"
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {TpoBatchUndoControl} from "@/components/tpo/tpo-batch-undo-control";
  ```
- TPO Batches resilient working set > TPO-batches-27 shows academic years, a placement-eligibility back link, and effective status

  ```
  AssertionError: expected 'import { StackedMetricBar } from "@/c…' to contain '← Placement eligibility'
  - Expected
  + Received
  - ← Placement eligibility
  + import { StackedMetricBar } from "@/components/ui/stacked-metric-bar";
  + import batchStyles from "@/components/tpo/legacy-batch-eligibility.module.css";
  + import Link from "next/link";
  + import {tpoBatchReturnHref} from "@/modules/placements/tpo-batch-return-model";
  ```

## tests/unit/tpo-drives-chat-3-round4.test.ts (7 failing)
- chat-3 Drives round 4 > TPO-drives-04 review-first default and persistent badge counts

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-current={data.view===view?"page"…'
  - Expected
  + Received
  - aria-current={data.view===view?"page":undefined}
  + import Link from "next/link";
  + import { Dropdown } from "@/components/ui/dropdown";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- chat-3 Drives round 4 > TPO-drives-49 non-editable drive points to safe clone recovery

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'This drive is not editable'
  - Expected
  + Received
  - This drive is not editable
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  ```
- chat-3 Drives round 4 > TPO-drives-R03 preflight shows nonblocking rounds and eligibility warnings

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useState…' to contain 'No eligibility rules set - every regi…'
  - Expected
  + Received
  - No eligibility rules set - every registered student will see this drive
  + "use client";
  +
  + import {
  +   useState,
  ```
- chat-3 Drives round 4 > TPO-drives-26 Create drive now provides a scoped clone-past picker

  ```
  AssertionError: expected 'import { Disclosure } from "@/compone…' to contain '<TpoDriveCloneAction jobId={job.id}'
  - Expected
  + Received
  - <TpoDriveCloneAction jobId={job.id}
  + import { Disclosure } from "@/components/ui/disclosure";
  + import type { ReactNode } from "react";
  + import Link from "next/link";
  + import {and,desc,eq,inArray,isNull,sql} from "drizzle-orm";
  ```
- chat-3 Drives round 4 > TPO-drives-22 creation and edit wording matches the familiar drive actions

  ```
  AssertionError: expected 'import { Disclosure } from "@/compone…' to contain 'Back to drives'
  - Expected
  + Received
  - Back to drives
  + import { Disclosure } from "@/components/ui/disclosure";
  + import type { ReactNode } from "react";
  + import Link from "next/link";
  + import {and,desc,eq,inArray,isNull,sql} from "drizzle-orm";
  ```
- chat-3 Drives round 4 > GR-04 TPO-drives-22 edit action never surfaces a raw API error code

  ```
  AssertionError: expected '"use client";\nimport { DateInput } f…' to contain 'await apiFetch('
  - Expected
  + Received
  - await apiFetch(
  + "use client";
  + import { DateInput } from "@/components/ui/date-input";
  + import { Textarea } from "@/components/ui/textarea";
  + import { Checkbox } from "@/components/ui/checkbox";
  ```
- chat-3 Drives round 4 > TPO-drives-49 closed drive has immutable explanation, clone path and retriable read boundary

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'This drive is closed: nothing here ca…'
  - Expected
  + Received
  - This drive is closed: nothing here can be changed.
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  ```

## tests/unit/tpo-settings-primary-nav.test.ts (1 failing)
- TPO-settings-audit-01 legacy primary Settings sections > keeps the ten legacy sections in original group order alongside linked destinations

  ```
  AssertionError: expected [ 'Placement policy', 'People' ] to deeply equal [ 'Placement policy', 'People', …(1) ]
  - Expected
  + Received
  [
  "Placement policy",
  "People",
  -   "Students and companies",
  ]
  ```
