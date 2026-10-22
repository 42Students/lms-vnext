# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat5-placements-ux-workflows.test.ts (2 failing)
- chat-5 placement selection accessibility and recovery > UX-tpo-placements-jobs-jobid-offers-offerid-02 never infers employer acceptance from letter delivery

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'inline-flex min-h-11 w-full items-cen…'
  - Expected
  + Received
  - inline-flex min-h-11 w-full items-center
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  ```
- chat-5 placement selection accessibility and recovery > PLACEMENTS-JOINING-CONFIRM-01 does not mutate before confirmation, and retains corrected draft

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'onOpenChange={setConfirmOpen}'
  - Expected
  + Received
  - onOpenChange={setConfirmOpen}
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  + import { Select } from "@/components/ui/select";
  ```

## tests/unit/chat6-superadmin-middle-third-adversarial.test.ts (2 failing)
- Chat-6 /admin middle-third read and application correctness > SA-admin-middle-applications-filters-02 rejects wrong-shape and cross-tenant filter IDs before querying

  ```
  AssertionError: expected { q: '', status: 'ALL', …(8) } to be null
  - Expected:
  null
  + Received:
  {
  "attention": "ALL",
  "page": 1,
  "q": "",
  ```
- Chat-6 /admin middle-third read and application correctness > SA-admin-middle-read-04 rejects missing college selection before rendering candidate-level data

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '<AdminScopedReadPage'
  - Expected
  + Received
  - <AdminScopedReadPage
  + import Link from "next/link";
  + import {and,eq,inArray,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {
  ```
