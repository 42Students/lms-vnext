# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-placements-14-drive-filter-copy.test.ts (1 failing)
- LEARNER-placements-14 drive filter copy > LEARNER-placements-14 uses the legacy search prompt, deadline sort and clear action

  ```
  AssertionError: expected '"use client";\n\nimport { useCallback…' to contain 'Search by title, company, location…'
  - Expected
  + Received
  - Search by title, company, location…
  + "use client";
  +
  + import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
  + import {Disclosure} from "@/components/ui/disclosure";
  ```

## tests/unit/learner-project-tab-href-model.test.ts (1 failing)
- learner Project tab transitions > keeps validated filters but not transient modal/older-page cursor

  ```
  AssertionError: expected '/learn/projects/11111111-1111-4111-81…' not to contain 'taskId='
  Expected: "taskId="
  Received: "/learn/projects/11111111-1111-4111-8111-111111111111?tab=team&taskSearch=review&taskStatus=BLOCKED&activityCategory=TASKS&taskId=11111111-1111-4111-8111-111111111111&activityBeforeTime=2026-10-15"
  ```

## tests/unit/messaging-history-page-state.test.ts (1 failing)
- parses pagination with registered bounds

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/projects-phase2-progress-percentage.test.ts (2 failing)
- PR-S3: no premature 100% project progress > caps rounded, incomplete progress and preserves exact completion

  ```
  AssertionError: expected 100 to be 99 // Object.is equality
  - Expected
  + Received
  - 99
  + 100
  ```
- PR-S3: no premature 100% project progress > uses the same policy for learner, mentor sprint and mentor task

  ```
  AssertionError: expected 100 to be 99 // Object.is equality
  - Expected
  + Received
  - 99
  + 100
  ```

## tests/unit/recruiter-chat14-round2.test.ts (3 failing)
- chat-14 recruiter reassignment batch 2 > REC-home-drives-16 sorts placement-cell unanswered requests before recent or deadline rows

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'border-warning bg-surface-secondary'
  - Expected
  + Received
  - border-warning bg-surface-secondary
  + import Link from "next/link";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import type { listOwnRecruiterPlacementJobs } from "@/modules/placements/recruiter-service";
  ```
- chat-14 recruiter reassignment batch 2 > REC-home-drives-32 protects all unsent drafts with an accessible discard confirmation

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'title="Discard this drive draft?"'
  - Expected
  + Received
  - title="Discard this drive draft?"
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { useToast } from "@/components/ui/toast";
  ```
- chat-14 recruiter reassignment batch 2 > REC-calendar-messages-profile-23 avoids marking older unseen notifications as read

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'state.items.filter(item=>item.unread)…'
  - Expected
  + Received
  - state.items.filter(item=>item.unread).length>=state.unread
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```

## tests/unit/sa-tenants-modules-27-descendant-policy.test.ts (1 failing)
- SA-tenants-modules-27 academic descendant editing guards > requires explicit expected state and excludes placements while resolver ignores it

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
