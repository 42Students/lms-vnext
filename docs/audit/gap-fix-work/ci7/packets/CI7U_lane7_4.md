# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/faculty-profile-error-model.test.ts (1 failing)
- Faculty profile optimistic conflict recovery > offers explicit reload only for a verified stale version

  ```
  AssertionError: expected 'Profile was updated elsewhere. Please…' to contain 'Reload'
  Expected: "Reload"
  Received: "Profile was updated elsewhere. Please refresh and try again."
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

## tests/unit/projects-phase2-workspace-copy-audit.test.ts (1 failing)
- Phase 2 exact old-LMS Projects headings and empty states > uses legacy Team and Resources copy, not implementation language

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'Project people'
  - Expected
  + Received
  - Project people
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/tpo-batches-chat5-next-round.test.ts (1 failing)
- TPO Batches next-round source and behavioral gap closure > TPO-batches-40 uses the expected legacy import heading and confirm button

  ```
  AssertionError: expected '"use client";\nimport { Tabs } from "…' to contain 'disabled={busy||preview.ready===0||un…'
  - Expected
  + Received
  - disabled={busy||preview.ready===0||unresolved>0||!acknowledged}
  + "use client";
  + import { Tabs } from "@/components/ui/tabs";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { Checkbox } from "@/components/ui/checkbox";
  ```
