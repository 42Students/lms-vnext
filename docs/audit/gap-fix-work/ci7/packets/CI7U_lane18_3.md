# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat6-superadmin-mentor-role-round3.test.ts (1 failing)
- Mentor faculty role parity > SA-academics-people-115 recognizes real mentor memberships and filters faculty by mentor role

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'placeholder="Professor, Mentor…"'
  - Expected
  + Received
  - placeholder="Professor, Mentor…"
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
  ```

## tests/unit/chat7-mentor-meeting-draft-lifecycle.test.ts (2 failing)
- MEN-projects-meetings-27 meeting draft lifecycle > MEN-projects-meetings-27 makes draft private and never notifies learners when cancelled

  ```
  AssertionError: expected 'import {\n  and,\n  asc,\n  eq,\n  in…' to contain 'inArray(projectMeetings.status, ["DRA…'
  - Expected
  + Received
  - inArray(projectMeetings.status, ["DRAFT", "REQUESTED", "SCHEDULED","RESCHEDULED"])
  + import {
  +   and,
  +   asc,
  +   eq,
  ```
- MEN-projects-meetings-27 meeting draft lifecycle > MEN-projects-meetings-27 does not announce manager-only facilitator changes

  ```
  AssertionError: expected 'import {\n  and,\n  asc,\n  eq,\n  in…' to contain 'targetStatus==="RESCHEDULED" && exist…'
  - Expected
  + Received
  - targetStatus==="RESCHEDULED" && existing && existing.status!=="RESCHEDULED"
  + import {
  +   and,
  +   asc,
  +   eq,
  ```

## tests/unit/chat9-owner-decision-scope-parity.test.ts (1 failing)
- Owner-approved improvements over obsolete legacy workflows > COL-projects-05 preserves recoverable archive and restore instead of a competing delete implementation

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'href="/college/projects?status=ARCHIV…'
  - Expected
  + Received
  - href="/college/projects?status=ARCHIVED"
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  +
  ```

## tests/unit/college-mentor-round7-gap-verification.test.ts (1 failing)
- chat-11 college and mentor interaction contracts > COL-academic-setup-19 retains owner-approved archive and dependency blocking

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useRef,\…' to contain 'Retry delete'
  - Expected
  + Received
  - Retry delete
  + "use client";
  +
  + import {
  +   useRef,
  ```
