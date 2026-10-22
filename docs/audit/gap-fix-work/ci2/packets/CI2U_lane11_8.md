# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat2-tpo-round-uncovered-models-break-13.test.ts (1 failing)
- TPO-BREAK-round-model-13: non-silent round results and live schedule projections > TPO-drive-workspace-40 stages PASS internally, but directs all non-pass notes to learners

  ```
  AssertionError: expected 'Waitlist' to be 'On hold / waitlisted' // Object.is equality
  Expected: "On hold / waitlisted"
  Received: "Waitlist"
  ```

## tests/unit/chat3-faculty-live-classes-scaled-service.test.ts (1 failing)
- FAC-LIVE-SCALE-01 Faculty live classes bounded Section reads > preserves ordering of 20 Sections while never opening more than 8 reads at once

  ```
  AssertionError: expected 6 to be 8 // Object.is equality
  - Expected
  + Received
  - 8
  + 6
  ```

## tests/unit/chat3-tpo-supplemental-round14.test.ts (5 failing)
- TPO supplemental job metadata > TPO-drives-29/30/38 read and write supplemental details in the scoped job JSONB

  ```
  AssertionError: expected '"use client";\n\nimport { useState } …' not to contain 'target="_blank"'
  - Expected
  + Received
  - target="_blank"
  + "use client";
  +
  + import { useState } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- TPO supplemental job metadata > TPO-drives-41 blocks both native unload and in-app navigation while unsaved

  ```
  AssertionError: expected '"use client";\nimport {createElement,…' to contain 'window.confirm'
  - Expected
  + Received
  - window.confirm
  + "use client";
  + import {createElement,useCallback,useEffect,useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {ConfirmDialog} from "@/components/ui/confirm-dialog";
  ```
- TPO supplemental job metadata > TPO-drives-41 exposes an honest IST local-save timestamp distinct from server persistence

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useState…' to contain 'Local draft saved at '
  - Expected
  + Received
  - Local draft saved at
  + "use client";
  +
  + import {
  +   useState,
  ```
- TPO supplemental job metadata > TPO-drives-43 stores an uncertain create outcome after timeout instead of retrying blindly

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useState…' to contain 'disabled={pending || !activeSeason ||…'
  - Expected
  + Received
  - disabled={pending || !activeSeason || uncertainCreate}
  + "use client";
  +
  + import {
  +   useState,
  ```
- TPO supplemental job metadata > TPO-drives-43/52 quick create requires a duplicate check after unknown POST outcome

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'disabled={pending || unknownCreate ||…'
  - Expected
  + Received
  - disabled={pending || unknownCreate || !companyRelationshipId}
  + "use client";
  +
  + import { useEffect, useState, type FormEvent } from "react";
  + import { useRouter } from "next/navigation";
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

## tests/unit/chat4-college-ux-round5.test.ts (6 failing)
- Chat-4 college UX round five > UX-college-departments-01 makes the layout or actions more readable on narrow screens

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import Link from "next/link";
  + import { Alert } from "@/components/ui/alert";
  + import { isSuperAdmin } from "@/modules/identity/context";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- Chat-4 college UX round five > UX-college-domains-01 makes the layout or actions more readable on narrow screens

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { isSuperAdmin } from "@/modules/identity/context";
  + import {
  ```
- Chat-4 college UX round five > UX-college-electives-01 makes the layout or actions more readable on narrow screens

  ```
  AssertionError: expected 'import { collegeDirectoryValidationMe…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
  + import Link from "next/link";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- Chat-4 college UX round five > UX-college-electives-slotId-allocate-01 makes the layout or actions more readable on narrow screens

  ```
  AssertionError: expected '"use server";\nimport Link from "next…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + "use server";
  + import Link from "next/link";
  + import { redirect, notFound } from "next/navigation";
  + import { and, asc, eq, ilike, inArray, isNull, or } from "drizzle-orm";
  ```
- Chat-4 college UX round five > UX-college-electives-slotId-offerings-offeringId-roster-01 makes the layout or actions more readable on narrow screens

  ```
  AssertionError: expected '"use server";\nimport Link from "next…' to contain 'rows={detail.members}'
  - Expected
  + Received
  - rows={detail.members}
  + "use server";
  + import Link from "next/link";
  + import { notFound, redirect } from "next/navigation";
  + import { and, count, eq, ilike, isNull, or, sql } from "drizzle-orm";
  ```
- Chat-4 college UX round five > UX-college-faculty-assignment-01 makes the layout or actions more readable on narrow screens

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import Link from "next/link";
  + import { FACULTY_ASSIGNMENT_COPY, FACULTY_ASSIGNMENT_ROLE_LABELS, facultyAssignmentRoleLabel } from "@/modules/courses/college-courses-copy";
  + import { Alert } from "@/components/ui/alert";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/chat4-super-admin-session-hardening.test.ts (1 failing)
- Super Admin tenant sessions adversarial management > SA-colleges-sessions-RETRY-01 a zero-revocation retry never appends a duplicate security audit

  ```
  AssertionError: expected -1 to be greater than 9528
  ❯ tests/unit/chat4-super-admin-session-hardening.test.ts:28:16
  26|   expect(persisted).toBeGreaterThan(tx);
  27|   expect(update).toBeGreaterThan(persisted);
  28|   expect(noOp).toBeGreaterThan(update);
  |                ^
  29|   expect(audit).toBeGreaterThan(noOp);
  30|   expect(s).toContain("AND revoked_at IS NULL");
  ```
