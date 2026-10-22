# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/faculty-profile-round10-4.test.ts (1 failing)
- names the invalid field so Faculty can correct it

  ```
  TypeError: .toMatch() expects to receive a string, but got object
  ❯ tests/unit/faculty-profile-round10-4.test.ts:6:79
  4|  expect(facultyProfileTextDraftIssue("personalDetails",{dateOfBirth:"2…
  5|  expect(facultyProfileTextDraftIssue("address",{currentAddress:"Hi"}))…
  6|  expect(facultyProfileTextDraftIssue("about",{description:"x".repeat(5…
  |                                                                               ^
  7| });
  8|
  ```

## tests/unit/learner-placements-chat7-drive-facts.test.ts (1 failing)
- learner drive fact parity > LEARNER-placements-16 preserves published facts and application stage on role cards

  ```
  AssertionError: expected '"use client";\n\nimport { useRef, use…' to contain 'className="mt-2 line-clamp-3'
  - Expected
  + Received
  - className="mt-2 line-clamp-3
  + "use client";
  +
  + import { useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```

## tests/unit/public-auth-chooser-graceful-gap.test.ts (2 failing)
- public account chooser and failure handling > PUB-auth-public-08 restores last used active college as radio default

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useEffec…' to contain 'setSelectedId(memberships.some'
  - Expected
  + Received
  - setSelectedId(memberships.some
  + "use client";
  +
  + import {
  +   useEffect,
  ```
- public account chooser and failure handling > GR-91 retry and recovery buttons are keyboard-accessible

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'focus-visible'
  - Expected
  + Received
  - focus-visible
  + "use client";
  +
  + import Link from "next/link";
  + import { Button } from "@/components/ui/button";
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
