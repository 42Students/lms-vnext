# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

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

## tests/unit/ux-chat14-mentor-quality-04b.test.ts (5 failing)
- chat-14 mentor UX quality batch 04b > UX-mentor-projects-projectId-02 preserves link contrast and shared interaction contracts

  ```
  AssertionError: expected 'import { MentorProjectsUnavailable } …' to contain 'focus-visible:outline-[var(--lms-teal…'
  - Expected
  + Received
  - focus-visible:outline-[var(--lms-teal-deep)]
  + import { MentorProjectsUnavailable } from "@/components/projects/mentor-projects-unavailable";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
  + import Link from "next/link";
  ```
- chat-14 mentor UX quality batch 04b > UX-mentor-projects-projectId-activity-history-02 preserves link contrast and shared interaction contracts

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
- chat-14 mentor UX quality batch 04b > UX-mentor-projects-projectId-board-review-02 preserves link contrast and shared interaction contracts

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { StatTile } from "@/components/ui/stat-tile";
  ```
- chat-14 mentor UX quality batch 04b > UX-mentor-projects-projectId-closeout-02 preserves link contrast and shared interaction contracts

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'focus-visible:outline-[var(--lms-teal…'
  - Expected
  + Received
  - focus-visible:outline-[var(--lms-teal-deep)]
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {StatusBadge} from "@/components/ui/status-badge";
  ```
- chat-14 mentor UX quality batch 04b > UX-mentor-projects-projectId-deliveries-submissionId-review-02 preserves link contrast and shared interaction contracts

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'focus-visible:outline-[var(--lms-teal…'
  - Expected
  + Received
  - focus-visible:outline-[var(--lms-teal-deep)]
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {Disclosure} from "@/components/ui/disclosure";
  ```
