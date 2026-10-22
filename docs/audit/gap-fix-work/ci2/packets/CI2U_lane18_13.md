# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

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

## tests/unit/tpo-drive-workspace-s2-evidence-contracts.test.ts (3 failing)
- Drive workspace S2 source-to-UI contracts > TPO-drive-workspace-04 shows the export, company share and run-again actions in More

  ```
  AssertionError: expected 'import { Dropdown } from "@/component…' to contain 'More ▾'
  - Expected
  + Received
  - More ▾
  + import { Dropdown } from "@/components/ui/dropdown";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import type { ReactNode } from "react";
  ```
- Drive workspace S2 source-to-UI contracts > TPO-drive-workspace-27 provides an authorized modal and per-selection review queue

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'modal.showModal()'
  - Expected
  + Received
  - modal.showModal()
  + "use client";
  +
  + import { useEffect, useId, useRef, type ReactNode, type RefObject, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- Drive workspace S2 source-to-UI contracts > TPO-drive-workspace-63 retains applicant-level inclusion actions without cross-college mutation

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

## tests/unit/tpo-recruiters-08-stage-fallback.test.ts (1 failing)
- TPO-recruiters-08 legacy inferred execution stages > includes every same-company drive even when legacy names map to multiple relationships

  ```
  AssertionError: expected 'NEW' to be 'RECRUITED' // Object.is equality
  Expected: "RECRUITED"
  Received: "NEW"
  ```

## tests/unit/tpo-verification-review-surface.test.ts (1 failing)
- TPO-requests-verification-19 > keeps exact legacy TPO verification title, subtitle and actions

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'legacyTpoCopy?"Verification":"Profile…'
  - Expected
  + Received
  - legacyTpoCopy?"Verification":"Profile verification"
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { DataTable } from "@/components/ui/data-table";
  + import {useEffect,useMemo,useState} from "react";
  ```

## tests/unit/ux-chat14-mentor-quality-04a.test.ts (5 failing)
- chat-14 mentor UX quality batch 04a > UX-mentor-landing-02 retains accessible link and shared action contracts

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
  ```
- chat-14 mentor UX quality batch 04a > UX-mentor-activity-02 retains accessible link and shared action contracts

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { Pagination } from "@/components/ui/pagination";
  + import { PageSizeSelect } from "@/components/ui/page-size-select";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  ```
- chat-14 mentor UX quality batch 04a > UX-mentor-calendar-02 retains accessible link and shared action contracts

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { PageHeader } from "@/components/ui/page-header";
  + import {Button} from "@/components/ui/button";
  + import Link from "next/link";
  + import {MentorProjectsUnavailable} from "@/components/projects/mentor-projects-unavailable";
  ```
- chat-14 mentor UX quality batch 04a > UX-mentor-notifications-02 retains accessible link and shared action contracts

  ```
  AssertionError: expected 'import { Suspense } from "react";\nim…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { Suspense } from "react";
  + import { Select } from "@/components/ui/select";
  + import {Button} from "@/components/ui/button";
  + import {listMyProjectInstances} from "@/modules/projects/member-service";
  ```
- chat-14 mentor UX quality batch 04a > UX-mentor-projects-02 retains accessible link and shared action contracts

  ```
  AssertionError: expected 'import { Suspense } from "react";\nim…' to contain 'focus-visible:outline-[var(--lms-teal…'
  - Expected
  + Received
  - focus-visible:outline-[var(--lms-teal-deep)]
  + import { Suspense } from "react";
  + import { getMentorProjectTeamSizes } from "@/modules/projects/mentor-project-team-size-service";
  + import { getMentorProjectWorkCounts } from "@/modules/projects/mentor-project-work-service";
  + import { mentorTaskProgress, matchesMentorProjectWork } from "@/modules/projects/mentor-project-work-model";
  ```
