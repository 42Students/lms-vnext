# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-superadmin-gap-register-reconcile-c.test.ts (1 failing)
- chat-13 Super Admin settings, access and tracker reconciliation > SA-tenants-modules-48 verifies current code, without asserting runtime activation

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'Release (critical & high)'
  - Expected
  + Received
  - Release (critical & high)
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Banner } from "@/components/ui/banner";
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat16-campaign-unsubscribe-ssr-pages-16.test.ts (1 failing)
- chat-16 public campaign unsubscribe server pages > UX-campaign-unsubscribe-page-17 preserves purpose-scoped placement cell copy, not global suppression claims

  ```
  AssertionError: expected '<main class="flex min-h-dvh w-full mi…' to contain 'The placement cell that wrote to you …'
  Expected: "The placement cell that wrote to you will not email you again."
  Received: "<main class="flex min-h-dvh w-full min-w-0 items-center justify-center bg-[#f5f7f9] p-4"><div class="w-full max-w-[440px]"><section data-slot="card" class="min-w-0 rounded-[var(--lms-radius-card)] border border-[var(--lms-canvas-border)] bg-[var(--lms-surface)] p-[var(--lms-space-4)] text
  ```

## tests/unit/chat16-public-recruit-enquiry-route-guards-16.test.ts (1 failing)
- chat-16 anonymous recruiter enquiry HTTP outage and scope safety > PUBLIC-ENQUIRY-FAIL-21 keeps public rate-limit and readiness distinctions

  ```
  AssertionError: expected { …(2) } to deeply equal { Object (error) }
  - Expected
  + Received
  {
  "error": "RECRUITER_ENQUIRIES_UNAVAILABLE",
  +   "message": "Recruitment enquiries are temporarily unavailable.",
  }
  ```

## tests/unit/chat19-unclaimed-hr-grid-parity.test.ts (2 failing)
- chat-19 four unclaimed HR grid adapters > hr-company-reports-grid.tsx uses shared spreadsheet semantics and has no local style forks

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' not to match /rounded-(?:full|lg|xl)|border-b-2|ari…/
  - Expected:
  /rounded-(?:full|lg|xl)|border-b-2|aria-pressed=/
  + Received:
  "\"use client\";
  import Link from \"next/link\";
  import {useRouter} from \"next/navigation\";
  import type {MouseEvent} from \"react\";
  ```
- chat-19 four unclaimed HR grid adapters > retains shared status badge and safe per-drive navigation on reports

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'import { StatusBadge } from "@/compon…'
  - Expected
  + Received
  - import { StatusBadge } from "@/components/ui/status-badge"
  + "use client";
  +
  + import Link from "next/link";
  + import {useRouter} from "next/navigation";
  ```

## tests/unit/chat2-recruiter-access-copy.test.ts (1 failing)
- Recruiter access and notification wording > REC-calendar-messages-profile-16 describes ended college access without exposing a foreign thread

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'if(error instanceof TpoMessagingError…'
  - Expected
  + Received
  - if(error instanceof TpoMessagingError)notFound()
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  + import Link from "next/link";
  + import {RecruiterConversationReplyForm} from "@/components/hr/recruiter-conversation-reply-form";
  ```

## tests/unit/chat2-tpo-recruiter-needs.test.ts (1 failing)
- TPO Engage legacy Needs doing > TPO-recruiters-07 shows only real nonzero legacy attention categories and count

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'Nothing right now.'
  - Expected
  + Received
  - Nothing right now.
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Tabs } from "@/components/ui/tabs";
  + import { FilterChip } from "@/components/ui/filter-chip";
  ```

## tests/unit/chat3-final-sprint-company-team-and-review.test.ts (3 failing)
- Chat-3 final sprint team and review contracts > TPO-companies-05 models follow, @mentions, #references, decisions and asks with author protections

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain 'Open in Team'
  - Expected
  + Received
  - Open in Team
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {Input} from "@/components/ui/input";
  + import {Select} from "@/components/ui/select";
  ```
- Chat-3 final sprint team and review contracts > TPO-companies-05 uses proposed schema, bounded messages and truthful unavailable migration state

  ```
  Error: ENOENT: no such file or directory, open '/home/runner/work/lms-vnext/lms-vnext/docs/proposed-migrations/chat3-tpo-company-team.sql'
  ❯ read tests/unit/chat3-final-sprint-company-team-and-review.test.ts:4:24
  2| import {readFileSync} from "node:fs";
  3| import {join} from "node:path";
  4| const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
  |                        ^
  5| describe("Chat-3 final sprint team and review contracts",()=>{
  6|  it("TPO-companies-05 company messages are bound to a real college rel…
  ```
- Chat-3 final sprint team and review contracts > TPO-companies-05 notifies only active same-college team followers, @team and explicit @members

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'notifyIds.delete(membership.id)'
  - Expected
  + Received
  - notifyIds.delete(membership.id)
  + import "server-only";
  + import {and,asc,desc,eq,inArray} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```

## tests/unit/chat4-college-faculty-bulk-service.test.ts (3 failing)
- COL-people-faculty-bulk-01 confirmed, tenant-scoped batch imports > forbids a forged request college before parsing or persisting foreign membership rows

  ```
  AssertionError: expected [Function] to throw error including 'COLLEGE_SCOPE_MISMATCH' but got '[\n  {\n    "expected": "string",\n  …'
  - Expected
  + Received
  - COLLEGE_SCOPE_MISMATCH
  + [
  +   {
  +     "expected": "string",
  +     "code": "invalid_type",
  ```
- COL-people-faculty-bulk-01 confirmed, tenant-scoped batch imports > normalizes Indian phone numbers, creates only faculty roles and skips duplicate mobiles

  ```
  ZodError: [
  {
  "expected": "string",
  "code": "invalid_type",
  "path": [
  "departmentId"
  ],
  "message": "Invalid input: expected string, received undefined"
  ```
- COL-people-faculty-bulk-01 confirmed, tenant-scoped batch imports > reports per-row identity collisions safely and continues later rows without leaking SQL

  ```
  ZodError: [
  {
  "expected": "string",
  "code": "invalid_type",
  "path": [
  "departmentId"
  ],
  "message": "Invalid input: expected string, received undefined"
  ```
