# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-super-admin-academic-copy.test.ts (2 failing)
- Super Admin Academic Setup legacy copy and defaults > SA-academics-people-28 creates a 50-seat lecture hall with legacy labels and field defaults

  ```
  AssertionError: expected '"use client";\n\nimport { useRouter }…' to contain 'roomType: "LECTURE_HALL"'
  - Expected
  + Received
  - roomType: "LECTURE_HALL"
  + "use client";
  +
  + import { useRouter } from "next/navigation";
  + import Link from "next/link";
  ```
- Super Admin Academic Setup legacy copy and defaults > SA-academics-people-37 restores legacy department and lecture-hall empty list copy

  ```
  AssertionError: expected '"use client";\n\nimport { Select } fr…' to contain 'No departments found. Create a colleg…'
  - Expected
  + Received
  - No departments found. Create a college first, then add departments.
  + "use client";
  +
  + import { Select } from "@/components/ui/select";
  + import { DEPARTMENT_COPY } from "@/modules/admin-ui/department-copy";
  ```

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

## tests/unit/chat15-final-sprint-fac-assessments.test.ts (2 failing)
- chat-15 final sprint: faculty assessments audit decision verification > FAC-assessments-25 NOT-A-GAP: overview shows course, lesson, due-date and draft visibility

  ```
  AssertionError: expected '"use client";\nimport { Badge } from …' to contain 'Course: {item.courseName}'
  - Expected
  + Received
  - Course: {item.courseName}
  + "use client";
  + import { Badge } from "@/components/ui/badge";
  + import {PageHeader} from "@/components/ui/page-header";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- chat-15 final sprint: faculty assessments audit decision verification > FAC-assessments-26 NOT-A-GAP: a draft still has an explicit zero-submission review

  ```
  AssertionError: expected '"use client";\n\nimport { Select } fr…' to contain 'No submissions yet. Publish this assi…'
  - Expected
  + Received
  - No submissions yet. Publish this assignment
  + "use client";
  +
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  ```

## tests/unit/chat16-auth-guard-tenant-behavior-21.test.ts (1 failing)
- chat-16 shared OTP admission guard HTTP and tenant isolation > AUTH-GUARD-04 disabled or unknown college host never falls back to platform login

  ```
  AssertionError: expected 'private, no-store' to be 'no-store' // Object.is equality
  Expected: "no-store"
  Received: "private, no-store"
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

## tests/unit/chat16-public-campaign-unsubscribe-body-bounds-26.test.ts (1 failing)
- chat-16 public campaign opt-out body limit and POST-only persistence > PUBLIC-UNSUB-SIZE-27 rejects invalid UTF-8 and malformed forms before privileged lookups

  ```
  AssertionError: expected 303 to be 400 // Object.is equality
  - Expected
  + Received
  - 400
  + 303
  ```
