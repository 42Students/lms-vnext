# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-superadmin-booked-interviews.test.ts (1 failing)
- Super Admin candidate-level interview conflicts > SA-placements-projects-47 bounded candidate interview CSV, per-row .ics and four headline metrics

  ```
  AssertionError: expected '"use client";\nimport { Checkbox } fr…' to contain 'Date.parse(row.endsAt)-Date.parse(row…'
  - Expected
  + Received
  - Date.parse(row.endsAt)-Date.parse(row.startsAt)
  + "use client";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import {SuperAdminInterviewEdit} from "@/components/admin/super-admin-interview-edit";
  + import {useMemo,useState,useTransition} from "react";
  ```

## tests/unit/chat14-final-tpo-drives-31.test.ts (1 failing)
- chat-14 final sprint > TPO-drives-31 supports add/update from the TPO page and does not mix with live drive reminders

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Recorded outside (history)'
  - Expected
  + Received
  - Recorded outside (history)
  + import Link from "next/link";
  + import { Dropdown } from "@/components/ui/dropdown";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/chat15-placement-event-producers.test.ts (1 failing)
- LEARNER-placements-R04 persisted event producers > LEARNER-placements-R04 sends only to currently active college learner roles honoring preferences

  ```
  AssertionError: expected 'import "server-only";\nimport {and,de…' to contain 'usersToNotify.slice(start,start+250)'
  - Expected
  + Received
  - usersToNotify.slice(start,start+250)
  + import "server-only";
  + import {and,desc,eq,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {collegeMemberships,membershipRoles,learnerProfiles,placementApplications,placementCandidatePreferences,placementJobs,users} from "@/db/schema";
  ```

## tests/unit/chat16-inbound-mail-admin-journeys-10.test.ts (2 failing)
- chat-16 Super Admin inbound mail adversarial actions and boundaries > HR-BREAK-INBOUND-02 validates all inputs before attempting to read private mail

  ```
  AssertionError: promise resolved "{ available: true, items: [], …(4) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + {
  +   "available": true,
  +   "hasMore": false,
  ```
- chat-16 Super Admin inbound mail adversarial actions and boundaries > HR-BREAK-INBOUND-05 denies stale CAS writes and includes tenant-safe expected version/status

  ```
  TypeError: getDb(...).transaction is not a function
  ❯ Module.changeInboundMailStatusForAdmin src/modules/inbound-mail/admin-service.ts:124:17
  122|  if(!await drizzleInboundMailAdminRepository.tableExists())
  123|   return {kind:"UNAVAILABLE" as const};
  124|  return getDb().transaction(async tx=>{
  |                 ^
  125|   const [updated]=await tx.update(inboundMailMessagesStaged)
  126|    .set({
  ```

## tests/unit/chat16-otp-provider-ports-16.test.ts (1 failing)
- chat-16 transactional OTP provider ports (mock network only) > messaging-otp-email-17 posts one bounded transactional template request, never a campaign

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/chat16-public-recruit-enquiry-route-guards-16.test.ts (3 failing)
- chat-16 anonymous recruiter enquiry HTTP outage and scope safety > PUBLIC-ENQUIRY-FAIL-19 does not leak a failed mail provider or database exception

  ```
  AssertionError: expected 400 to be 503 // Object.is equality
  - Expected
  + Received
  - 503
  + 400
  ```
- chat-16 anonymous recruiter enquiry HTTP outage and scope safety > PUBLIC-ENQUIRY-FAIL-20 preserves success and passes only verified proxy IPs

  ```
  AssertionError: expected { error: 'CODE_REQUIRED', …(1) } to deeply equal { received: true }
  - Expected
  + Received
  {
  -   "received": true,
  +   "error": "CODE_REQUIRED",
  +   "message": "Enter the code",
  }
  ```
- chat-16 anonymous recruiter enquiry HTTP outage and scope safety > PUBLIC-ENQUIRY-FAIL-21 keeps public rate-limit and readiness distinctions

  ```
  AssertionError: expected 400 to be 503 // Object.is equality
  - Expected
  + Received
  - 503
  + 400
  ```
