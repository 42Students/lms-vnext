# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/t-s2-04-campaign-send-policy.test.ts (1 failing)
- T-S2-04 campaign send policy > produces a bounded, PII-free preview with stable contact deduplication

  ```
  AssertionError: expected { recipientIds: [ 'a' ], …(3) } to deeply equal { recipientIds: [ 'a' ], …(1) }
  - Expected
  + Received
  @@ -1,9 +1,11 @@
  {
  +   "eligibleCount": 1,
  "recipientIds": [
  "a",
  ```

## tests/unit/tpo-chat5-open-gap-partial-evidence.test.ts (2 failing)
- chat-5 OPEN gap regression baselines > TPO-drive-workspace-63 partial baseline — further implementation required

  ```
  AssertionError: expected '"use client";\n\nimport { Disclosure …' to contain 'Force'
  - Expected
  + Received
  - Force
  + "use client";
  +
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {
  ```
- chat-5 OPEN gap regression baselines > TPO-batches-34 partial baseline — further implementation required

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'Roll number:'
  - Expected
  + Received
  - Roll number:
  + import {Button} from "@/components/ui/button";
  + import {Disclosure} from "@/components/ui/disclosure";
  + import {Badge} from "@/components/ui/badge";
  + import {DataTable} from "@/components/ui/data-table";
  ```

## tests/unit/tpo-home-02-need-line.test.ts (1 failing)
- TPO-home-02 exact legacy needs-you line > the server page renders the computed line from live seven-row data

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' to contain '{tpoHomeNeedsLine(rows)}'
  - Expected
  + Received
  - {tpoHomeNeedsLine(rows)}
  + import { Badge } from "@/components/ui/badge";
  + import Link from "next/link";
  + import {TpoHomeReturnRefresh} from "@/components/tpo/tpo-home-return-refresh";
  + import {eq} from "drizzle-orm";
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

## tests/unit/ux-admin-chat9-batch-01.test.ts (3 failing)
- chat-9 last-third admin UX rollout, batch 01 > UX-admin-placements-student-lookup-01 preserves authorized route and accessible UX surface

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '<DataTable'
  - Expected
  + Received
  - <DataTable
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  ```
- chat-9 last-third admin UX rollout, batch 01 > UX-admin-programs-01 preserves authorized route and accessible UX surface

  ```
  AssertionError: expected 'import { AcademicSetupSteps } from "@…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  ```
- chat-9 last-third admin UX rollout, batch 01 > UX-admin-projects-01 preserves authorized route and accessible UX surface

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {
  ```

## tests/unit/ux-chat14-mentor-quality-04e.test.ts (6 failing)
- chat-14 mentor UX quality batch 04e > UX-mentor-review-history-02 preserves mentor route accessibility and original copy

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Pagination } from "@/components/ui/pagination";
  + import { Tabs } from "@/components/ui/tabs";
  ```
- chat-14 mentor UX quality batch 04e > UX-mentor-reviews-02 preserves mentor route accessibility and original copy

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { Pagination } from "@/components/ui/pagination";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Select } from "@/components/ui/select";
  + import { PageSizeSelect } from "@/components/ui/page-size-select";
  ```
- chat-14 mentor UX quality batch 04e > UX-mentor-sprint-progress-02 preserves mentor route accessibility and original copy

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Pagination } from "@/components/ui/pagination";
  + import { Select } from "@/components/ui/select";
  ```
- chat-14 mentor UX quality batch 04e > UX-mentor-task-review-history-02 preserves mentor route accessibility and original copy

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Pagination } from "@/components/ui/pagination";
  + import { Select } from "@/components/ui/select";
  ```
- chat-14 mentor UX quality batch 04e > UX-mentor-task-reviews-02 preserves mentor route accessibility and original copy

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { Pagination } from "@/components/ui/pagination";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  ```
- chat-14 mentor UX quality batch 04e > UX-mentor-team-coverage-02 preserves mentor route accessibility and original copy

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Pagination } from "@/components/ui/pagination";
  + import { Select } from "@/components/ui/select";
  ```
