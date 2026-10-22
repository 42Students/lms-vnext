# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-recruiter-email-digest-live-grant-16.test.ts (1 failing)
- chat-16 recruiter digest scheduler live authorization > email-bridge-digest-worker-16 is inert when a verified bridge is not enabled

  ```
  AssertionError: expected { examined: +0, sent: +0, …(3) } to deeply equal { examined: +0, sent: +0, …(1) }
  - Expected
  + Received
  {
  "enabled": false,
  "examined": 0,
  +   "operatorAlert": "Recruiter email bridge is not ready: BRIDGE_DISABLED",
  +   "readinessReason": "BRIDGE_DISABLED",
  ```

## tests/unit/chat2-tpo-multi-notice-audience.test.ts (1 failing)
- TPO announcement targeting > TPO-inbox-team-44 lets users search multiple batches/branches and preserves selection through preview

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'query.data.targetIds?.map(id'
  - Expected
  + Received
  - query.data.targetIds?.map(id
  + import { DateInput } from "@/components/ui/date-input";
  + import { Tabs } from "@/components/ui/tabs";
  + import {StatusBadge} from "@/components/ui/status-badge";
  + import {TpoNoticeMessageCount} from "@/components/tpo/tpo-notice-message-count";
  ```

## tests/unit/chat4-college-structure-responsive-data-table.test.tsx (2 failing)
- COL-UX-STRUCTURE-TABLE-02 responsive Classes and Electives directories > keeps class academic period, capacity, current roster and accessible schedule/lifecycle actions

  ```
  AssertionError: expected '<div class="min-w-0 space-y-[var(--lm…' to contain 'Class directory scrollable columns'
  - Expected
  + Received
  - Class directory scrollable columns
  ##[error]AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'md:min-h-9'
  Expected
  + Received
  md:min-h-9
  ```
- COL-UX-STRUCTURE-TABLE-02 responsive Classes and Electives directories > retains academic choices, confirmed learners and elective actions on a phone-readable table

  ```
  TypeError: Cannot read properties of undefined (reading 'id')
  ❯ CollegeSlotManager tests/unit/chat4-college-structure-responsive-data-table.test.tsx:19:71
  17|  const {createElement}=await import("react");
  18|  return {CollegeSlotManager:(props:{row:{id:string}})=>
  19|   createElement("button",{type:"button","data-slot-manager":props.row.…
  |                                                                       ^
  20| });
  21| vi.mock("@/components/electives/college-elective-offering-manager",asy…
  ```

## tests/unit/chat5-next-batch-states.test.ts (1 failing)
- Chat5 next batch states > TPO-batches-17 renders accessible batch card skeleton and retry without falsely reporting changed decisions

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Couldn&apos;t refresh batches'
  - Expected
  + Received
  - Couldn&apos;t refresh batches
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
