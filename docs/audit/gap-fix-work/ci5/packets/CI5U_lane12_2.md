# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat15-calendar-window-bounds.test.ts (1 failing)
- chat-15 bounded calendar retrieval > LEARNER-learning-misc-34 bounds academic schedule to IST visible month and week spillover

  ```
  AssertionError: expected '2099-04-25T18:30:00.000Z' to be '2099-03-31T18:30:00.000Z' // Object.is equality
  Expected: "2099-03-31T18:30:00.000Z"
  Received: "2099-04-25T18:30:00.000Z"
  ```

## tests/unit/chat16-inbound-triage-state-matrix-02.test.ts (2 failing)
- chat-16 inbound mail ledger transition and mutation gate > INBOUND-TRIAGE-04 validates the inbox metadata before it is presented

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
- chat-16 inbound mail ledger transition and mutation gate > INBOUND-TRIAGE-05 enforces a bounded inbox query and safe preview text

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat16-recruiter-mail-reminder-route-02.test.ts (1 failing)
- chat-16 authenticated recruiter email digest worker POST > HR-MAIL-REMINDERS-04 invokes one worker for an authenticated request without cache

  ```
  AssertionError: expected 503 to be 200 // Object.is equality
  - Expected
  + Received
  - 200
  + 503
  ```

## tests/unit/chat2-college-learner-calendar-break-08.test.ts (1 failing)
- TPO-BREAK-calendar-08 query access, ICS injection, scheduled dates and private learner data > college interview filter rejects array ambiguity, invalid UUIDs and page overflow

  ```
  AssertionError: expected { kind: 'ALL', status: 'ALL', …(6) } to deeply equal { kind: 'ALL', status: 'ALL', page: 1 }
  - Expected
  + Received
  {
  +   "appointmentPage": 1,
  +   "appointmentPageSize": 20,
  +   "appointmentSort": "DATE_ASC",
  +   "candidatePage": 1,
  ```

## tests/unit/chat2-topic-first-message.test.ts (1 failing)
- TPO Team topic creation with optional first message > TPO-inbox-team-17 TPO-inbox-team-29 persist first message in the same transaction and notify with authorized deep link

  ```
  AssertionError: expected 'import {NextResponse} from "next/serv…' to contain 'firstMessage:form?.get("firstMessage"…'
  - Expected
  + Received
  - firstMessage:form?.get("firstMessage")||undefined
  + import {NextResponse} from "next/server";
  + import {z} from "zod";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {isSameOriginRequest} from "@/auth/origin";
  ```

## tests/unit/chat2-tpo-unowned-work-parity.test.ts (1 failing)
- TPO unowned work assignment safety > TPO-inbox-team-33 exposes a guarded, accessible assigner only when the schema is ready

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'unowned?.ready?'
  - Expected
  + Received
  - unowned?.ready?
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/chat3-tpo-round12-parity-contracts.test.ts (1 failing)
- chat-3 TPO Drives source parity audit, 18 distinct gap IDs > TPO-drives-06 keeps applied count is displayed per drive

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '{job.appliedCount}'
  - Expected
  + Received
  - {job.appliedCount}
  + import Link from "next/link";
  + import { Dropdown } from "@/components/ui/dropdown";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/chat4-college-projects-reassignment-gap-closure.test.ts (1 failing)
- chat-4 college project mentorship bulk reassignment > COL-projects-R02 searches all mentors on server and retains bulk evidence

  ```
  AssertionError: expected 'import { Button } from "@/components/…' to contain '{ q: mentorSearch, limit: 100 }'
  - Expected
  + Received
  - { q: mentorSearch, limit: 100 }
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
