# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/mentor-projects-chat7-round6-workflows.test.ts (1 failing)
- chat-7 mentor workflows round 6 > MEN-projects-meetings-R06 shows an honest zero-release state pending sprint creation improvements

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'No sprints yet. Add the sprints'
  - Expected
  + Received
  - No sprints yet. Add the sprints
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/projects-mentor-attention-risk-chat14.test.ts (2 failing)
- chat-14 mentor attention risk and workflow policies > calculates overload above 150% of nonnegative per-mentor average

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
- chat-14 mentor attention risk and workflow policies > never rounds unfinished sprint progress to 100 percent

  ```
  AssertionError: expected { total: 1000, completed: 999, …(3) } to deeply equal { total: 1000, completed: 999, …(3) }
  - Expected
  + Received
  {
  "blocked": 0,
  "completed": 999,
  -   "completionPercent": 99,
  +   "completionPercent": 100,
  ```

## tests/unit/recruiter-chat14-message-email-bridge-contract.test.ts (1 failing)
- REC-calendar-messages-profile-R01 mail bridge deployment and scope > REC-calendar-messages-profile-R01 persists reminder cooldown and reply token hashes only after provider success

  ```
  AssertionError: expected 'import "server-only";\nimport {create…' to contain 'if(!accepted)return false'
  - Expected
  + Received
  - if(!accepted)return false
  + import "server-only";
  + import {createHash} from "node:crypto";
  + import {and,count,desc,eq,isNull,lt,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
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

## tests/unit/t-s2-08-publication-navigation.test.ts (1 failing)
- T-S2-08 public publishing remains a scoped TPO setting > keeps the new setting reachable

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/tpo-drive-day-checkin-model.test.ts (1 failing)
- TPO confirmed Drive Day attendance > accepts only a confirmed check-in or no-show without forged college

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/tpo-inbox-team-graceful-round3.test.ts (9 failing)
- Chat-2 graceful messaging and TPO action acceptance > TPO-inbox-team-18 projects the opposite participant and kind, not just a thread ID

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'row.counterpartName'
  - Expected
  + Received
  - row.counterpartName
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
- Chat-2 graceful messaging and TPO action acceptance > TPO-inbox-team-39 preserves text and shows friendly inline failures rather than raw codes

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  ```
- Chat-2 graceful messaging and TPO action acceptance > TPO-inbox-team-52 GR-35 names consequences before destructive notice deletion, without window.confirm

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'aria-modal="true"'
  - Expected
  + Received
  - aria-modal="true"
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {Button} from "@/components/ui/button";
  + import {Dialog} from "@/components/ui/dialog";
  ```
- Chat-2 graceful messaging and TPO action acceptance > GR-90 and GR-91 announce errors and offer a keyboard-reachable Cancel action

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  ```
- Chat-2 graceful messaging and TPO action acceptance > TPO-inbox-team-67 counts only recent unread personal notifications

  ```
  AssertionError: expected 'import "server-only";\n\nimport { ran…' to contain 'tpoUnreadCutoff(new Date())'
  - Expected
  + Received
  - tpoUnreadCutoff(new Date())
  + import "server-only";
  +
  + import { randomUUID } from "node:crypto";
  + import { and, count, eq, inArray, isNull } from "drizzle-orm";
  ```
- Chat-2 graceful messaging and TPO action acceptance > TPO-inbox-team-68 provides calm loading and failure screens with Retry

  ```
  AssertionError: expected '"use client";\n\nimport { Button } fr…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  +
  + import { Button } from "@/components/ui/button";
  + import { ErrorState } from "@/components/ui/error-state";
  ```
- Chat-2 graceful messaging and TPO action acceptance > TPO-inbox-team-54 and GR-90 never surface a read-cell API error code

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import {useCallback,useEffect,useRef,useState} from "react";
  ```
- Chat-2 graceful messaging and TPO action acceptance > TPO-inbox-team-19 GR-71/72/73/76 preserves Team search and shows Retry instead of false empty

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'status:"FAILED" as const'
  - Expected
  + Received
  - status:"FAILED" as const
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
- Chat-2 graceful messaging and TPO action acceptance > TPO-inbox-team-45 GR-71/72/73 preserves audience preview filters when one section fails

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'const previewRequest='
  - Expected
  + Received
  - const previewRequest=
  + import { DateInput } from "@/components/ui/date-input";
  + import { Tabs } from "@/components/ui/tabs";
  + import {StatusBadge} from "@/components/ui/status-badge";
  + import {TpoNoticeMessageCount} from "@/components/tpo/tpo-notice-message-count";
  ```

## tests/unit/tpo-team-activity-notices-chat2.test.ts (1 failing)
- Team inbox activity and participant notices > TPO-inbox-team-18 orders private conversations by last real message and shows last activity in IST

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'Last activity ·'
  - Expected
  + Received
  - Last activity ·
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
