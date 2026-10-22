# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tracker-report-sa-placements-projects-100.test.ts (2 failing)
- SA-placements-projects-100 report intake contract > rejects spoofed actor fields, invalid location and unknown type

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
- SA-placements-projects-100 report intake contract > preserves exact validation messages

  ```
  AssertionError: expected 'description is required' to be 'Describe what went wrong.' // Object.is equality
  Expected: "Describe what went wrong."
  Received: "description is required"
  ```

## tests/unit/ux-chat14-mentor-quality-04c.test.ts (5 failing)
- chat-14 mentor UX quality batch 04c > UX-mentor-projects-projectId-meetings-meetingId-notes-02 checks accessible visible link text and controls

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
- chat-14 mentor UX quality batch 04c > UX-mentor-projects-projectId-resources-directory-02 checks accessible visible link text and controls

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
- chat-14 mentor UX quality batch 04c > UX-mentor-projects-projectId-review-completeness-02 checks accessible visible link text and controls

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain 'focus-visible:outline-[var(--lms-teal…'
  - Expected
  + Received
  - focus-visible:outline-[var(--lms-teal-deep)]
  + import { Pagination } from "@/components/ui/pagination";
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {EmptyState} from "@/components/ui/empty-state";
  ```
- chat-14 mentor UX quality batch 04c > UX-mentor-projects-projectId-review-overview-02 checks accessible visible link text and controls

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Pagination } from "@/components/ui/pagination";
  + import { Select } from "@/components/ui/select";
  ```
- chat-14 mentor UX quality batch 04c > UX-mentor-projects-projectId-risk-readiness-02 checks accessible visible link text and controls

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Pagination } from "@/components/ui/pagination";
  + import { Select } from "@/components/ui/select";
  ```
