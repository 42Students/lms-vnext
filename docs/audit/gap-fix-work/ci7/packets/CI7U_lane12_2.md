# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-tracker-findings-sync-r6.test.ts (1 failing)
- chat-16 independent audit findings sync evidence > SA-placements-projects-120 shows only persisted sync history, never synthetic GitHub sync success

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'refusedCount:row.refusedFiles.length'
  - Expected
  + Received
  - refusedCount:row.refusedFiles.length
  + import "server-only";
  + import {and,asc,count,desc,eq,ilike,inArray,or,sql,type SQL} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {db10AuditFindings,db10AuditFindingEvents,db10AuditFindingSyncs,db10AuditFindingFiles} from "@/db/schema/db10-audit-findings.draft";
  ```

## tests/unit/chat2-tpo-recruiter-leads-copy.test.ts (1 failing)
- TPO recruiter leads visible legacy parity > TPO-recruiters-40 restores edit-action heading and legacy Save label

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'Log activity'
  - Expected
  + Received
  - Log activity
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
  + import { Banner } from "@/components/ui/banner";
  ```

## tests/unit/chat4-college-verification-misc-gap-closure.test.ts (1 failing)
- chat-4 College Verification and Misc verification > COL-verification-misc-02 retains source-backed legacy behavior

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Retry'
  - Expected
  + Received
  - Retry
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeProfileRetained } from "@/components/college/college-profile-retained";
  ```

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
