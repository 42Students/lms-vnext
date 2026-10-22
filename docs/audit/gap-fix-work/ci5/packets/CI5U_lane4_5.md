# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-placements-dashboard-parity.test.ts (1 failing)
- Learner placement dashboard route wiring > shows separate scheduled/attention and empty/error loading states

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Placement snapshot'
  - Expected
  + Received
  - Placement snapshot
  + import Link from "next/link";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import type { learnerPlacementDashboard } from "@/modules/placements/learner-dashboard-model";
  ```

## tests/unit/mentor-resource-audit-archive.test.ts (1 failing)
- keeps archive resource audit inside the project transaction with safe metadata

  ```
  AssertionError: expected '{"projectId":"project-a","resourceId"…' not to contain 'Reference'
  Expected: "Reference"
  Received: "{"projectId":"project-a","resourceId":"resource-a","resourceKey":"resource-a","actionType":"DELETE","beforeJson":null,"afterJson":{"title":"Reference =unsafe","sequence":null,"required":null,"visibility":null,"resourceType":null,"status":null,"pinned":null,"legacyResourceKind":null,"url":
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

## tests/unit/recruiter-chat14-round4-ownership-private-review.test.ts (4 failing)
- chat-14 recruiter ownership and private review gap closure > REC-home-drives-45 filters historical milestones only within TPO-shared applicants

  ```
  AssertionError: expected 'import "server-only";\nimport { and, …' to contain 'const stageCondition=and(where,filter…'
  - Expected
  + Received
  - const stageCondition=and(where,filters.stage==="ALL"?undefined:stageConditions[filters.stage])
  + import "server-only";
  + import { and, desc, eq, exists, gt, inArray, sql } from "drizzle-orm";
  + import { getDb } from "@/db/client";
  + import { collegeMemberships, placementApplications, placementApplicationScreenings,
  ```
- chat-14 recruiter ownership and private review gap closure > REC-home-drives-46 keeps inline legacy round controls and counts stage decisions

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Online test'
  - Expected
  + Received
  - Online test
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { Select } from "@/components/ui/select";
  ```
- chat-14 recruiter ownership and private review gap closure > REC-home-drives-41 degrades safely when the proposed private-review table is not installed

  ```
  AssertionError: expected 'import {NextResponse} from "next/serv…' to contain 'if(!hasActiveRecruiter(context))'
  - Expected
  + Received
  - if(!hasActiveRecruiter(context))
  + import {NextResponse} from "next/server";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {hasActiveRecruiter} from "@/modules/identity/context";
  + import {isSameOriginRequest} from "@/auth/origin";
  ```
- chat-14 recruiter ownership and private review gap closure > REC-calendar-messages-profile-12 confirms in-app draft navigation rather than discarding it silently

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'consequence="Your draft reply will be…'
  - Expected
  + Received
  - consequence="Your draft reply will be lost."
  + "use client";
  + import {useEffect,useRef,useState,type FormEvent} from "react";
  + import {useRouter} from "next/navigation";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```

## tests/unit/super-admin-broadcast-ui.test.ts (1 failing)
- Super Admin all and selected college publishing > renders selected-college chooser and consent-based publish confirmation

  ```
  AssertionError: expected '"use client";\nimport {useRef,useStat…' to contain 'Consent and publish'
  - Expected
  + Received
  - Consent and publish
  + "use client";
  + import {useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/tpo-applicants-zero-result-recovery.test.ts (1 failing)
- TPO empty applicant grid recovery > keeps filters and spreadsheet mounted even without matching records

  ```
  AssertionError: expected '"use client";\nimport Link from "next…' to contain 'TpoGridFilterPanel'
  - Expected
  + Received
  - TpoGridFilterPanel
  + "use client";
  + import Link from "next/link";
  + import type {TpoGridColumn} from "@/modules/placements/tpo-grid-model";
  + import {applicantStage} from "@/modules/placements/tpo-applicant-pipeline-model";
  ```

## tests/unit/tpo-drive-lifecycle.test.ts (1 failing)
- TPO drive publish / close / reopen transitions > closes a published drive; forbids reopening after applied results or offers

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/tpo-internal-thread-create-validation.test.ts (1 failing)
- bounds recipient and topic without client-controlled college

  ```
  AssertionError: expected { …(4) } to deeply equal { …(2) }
  - Expected
  + Received
  {
  +   "kind": "DIRECT",
  +   "participantMembershipIds": [],
  "recipientMembershipId": "11111111-1111-4111-8111-111111111111",
  "topic": "Drive logistics",
  ```
