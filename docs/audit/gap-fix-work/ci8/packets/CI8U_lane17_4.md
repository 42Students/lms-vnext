# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/hr-today-action-queue-model.test.ts (1 failing)
- filters foreign-company and foreign-college drives before constructing review links

  ```
  AssertionError: expected '/hr/notifications?collegeId=college-a…' to contain '/recruiter/messages'
  Expected: "/recruiter/messages"
  Received: "/hr/notifications?collegeId=college-a&unreadOnly=true"
  ```

## tests/unit/public-auth-links-gap-closure.test.ts (1 failing)
- Public invite, share, marketing, privacy legacy gaps > PUB-auth-public-66 demo request has mailto action without collecting form data

  ```
  AssertionError: expected 'import type { Metadata } from "next";…' to contain 'mailto:hello@42lms.com'
  - Expected
  + Received
  - mailto:hello@42lms.com
  + import type { Metadata } from "next";
  + import { MarketingLayout } from "@/components/marketing/marketing-layout";
  +
  + const SITE = "https://42lms.com";
  ```
