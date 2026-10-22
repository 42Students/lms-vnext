# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-superadmin-interview-graceful.test.ts (1 failing)
- Interview card containment, download safety and fallback decisions > GR-91 provides a keyboard-reachable retry button with a visible focus ring

  ```
  AssertionError: expected '"use client";\nimport {Component,type…' to contain 'focus-visible:ring-2'
  - Expected
  + Received
  - focus-visible:ring-2
  + "use client";
  + import {Component,type ReactNode} from "react";
  + import {Button} from "@/components/ui/button";
  + type Props={children:ReactNode};
  ```

## tests/unit/chat16-final-col-placements-02.test.ts (2 failing)
- COL-placements-02 application details drawer > COL-placements-02 uses authenticated college-scoped application details rather than row-only PII

  ```
  AssertionError: expected '"use client";\nimport {Dialog} from "…' to contain 'Mobile:'
  - Expected
  + Received
  - Mobile:
  + "use client";
  + import {Dialog} from "@/components/ui/dialog";
  + import {ConfirmDialog} from "@/components/ui/confirm-dialog";
  + import {Button} from "@/components/ui/button";
  ```
- COL-placements-02 application details drawer > COL-placements-02 does not fabricate scores or public resume URLs

  ```
  AssertionError: expected '"use client";\nimport {Dialog} from "…' to contain 'detail.resume.available&&detail.resum…'
  - Expected
  + Received
  - detail.resume.available&&detail.resume.url
  + "use client";
  + import {Dialog} from "@/components/ui/dialog";
  + import {ConfirmDialog} from "@/components/ui/confirm-dialog";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat16-reassigned-mentor-parity.test.ts (1 failing)
- chat-16 reassigned mentor legacy parity > MEN-projects-meetings-69 keeps meeting load failure inline with a Retry action

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain '<MentorCalendarLoadFailure/>'
  - Expected
  + Received
  - <MentorCalendarLoadFailure/>
  + import { PageHeader } from "@/components/ui/page-header";
  + import {Button} from "@/components/ui/button";
  + import Link from "next/link";
  + import {MentorProjectsUnavailable} from "@/components/projects/mentor-projects-unavailable";
  ```

## tests/unit/chat2-LEARNER-placements-19-real-pagination.test.ts (1 failing)
- LEARNER-placements-19 — reviewer correction: no 20-item pagination gap > LEARNER-placements-19 binds the 20-item limit to the live filter and page controls

  ```
  AssertionError: expected '"use client";\n\nimport { useCallback…' to contain 'aria-label="Drive results pages"'
  - Expected
  + Received
  - aria-label="Drive results pages"
  + "use client";
  +
  + import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
  + import {Disclosure} from "@/components/ui/disclosure";
  ```

## tests/unit/chat2-recruiter-profile-and-lead-parity.test.ts (1 failing)
- Recruiter legacy profile and lead company parity > REC-calendar-messages-profile-28 uses exact profile titles and help text

  ```
  AssertionError: expected 'import { DataTable } from "@/componen…' to contain 'Manage your recruiter details.'
  - Expected
  + Received
  - Manage your recruiter details.
  + import { DataTable } from "@/components/ui/data-table";
  + import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";
  + import { z } from "zod";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```

## tests/unit/chat2-tpo-recruiters-needs-toggle.test.ts (1 failing)
- Engage attention and legacy counters > TPO-recruiters-07 allows Needs doing strip to collapse without losing the active filters

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'Nothing right now.'
  - Expected
  + Received
  - Nothing right now.
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Tabs } from "@/components/ui/tabs";
  + import { FilterChip } from "@/components/ui/filter-chip";
  ```

## tests/unit/chat3-sa-academics-batch-roster-privacy.test.ts (1 failing)
- SA-ACADEMICS-BATCH-COUNT-01 scoped active batch learner census > SA-ACADEMICS-BATCH-EMPTY-03 skips private learner reads when no scoped Sections exist

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/chat4-college-faculty-csv-behaviour.test.ts (4 failing)
- College faculty CSV preview, duplicate and partial-failure behavioural coverage > COL-faculty-CSV-01 preview validates real names, E.164, email, faculty type without provisioning identities

  ```
  AssertionError: expected { preview: true, valid: +0, …(3) } to match object { preview: true, valid: 1, …(2) }
  (1 matching property omitted from actual)
  - Expected
  + Received
  {
  -   "invalid": 0,
  +   "invalid": 1,
  "preview": true,
  ```
- College faculty CSV preview, duplicate and partial-failure behavioural coverage > COL-faculty-CSV-03 rejects duplicate contacts, invalid role type, bad cell count and invalid phone

  ```
  AssertionError: expected +0 to be 1 // Object.is equality
  - Expected
  + Received
  - 1
  + 0
  ```
- College faculty CSV preview, duplicate and partial-failure behavioural coverage > COL-faculty-CSV-05 a confirmed import uses the same College Admin tenant and exactly one faculty role

  ```
  AssertionError: expected { preview: false, valid: +0, …(3) } to match object { preview: false, valid: 1, …(2) }
  (2 matching properties omitted from actual)
  - Expected
  + Received
  {
  -   "invalid": 0,
  +   "invalid": 1,
  "preview": false,
  ```
- College faculty CSV preview, duplicate and partial-failure behavioural coverage > COL-faculty-CSV-06 dependency failures never display raw identity exceptions or hide partial onboarding

  ```
  AssertionError: expected [ { row: 2, status: 'INVALID', …(1) } ] to match object [ { status: 'FAILED' } ]
  (2 matching properties omitted from actual)
  - Expected
  + Received
  [
  {
  -     "status": "FAILED",
  +     "status": "INVALID",
  ```
