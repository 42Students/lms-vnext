# CI unit-test packet (round 9)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-inbox-team-graceful-round3.test.ts (6 failing)
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
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'type="button" onClick={dismiss}'
  - Expected
  + Received
  - type="button" onClick={dismiss}
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {Button} from "@/components/ui/button";
  + import {Dialog} from "@/components/ui/dialog";
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
