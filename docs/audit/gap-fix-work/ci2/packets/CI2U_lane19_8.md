# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat2-unsubscribe-graceful.test.ts (3 failing)
- Public unsubscribe confirmations > TPO-campaigns-public-16 shows a retryable inline error, not raw JSON form navigation

  ```
  AssertionError: expected 'import { Card } from "@/components/ui…' to contain '<CampaignUnsubscribeConfirm token={to…'
  - Expected
  + Received
  - <CampaignUnsubscribeConfirm token={token} cell={cell}/>
  + import { Card } from "@/components/ui/card";
  + import {CampaignUnsubscribeConfirm} from "@/components/placements/campaign-unsubscribe-confirm";
  +
  + export default async function CampaignUnsubscribe({
  ```
- Public unsubscribe confirmations > TPO-campaigns-public-R09 stays on the form if storage unavailable or delivery not confirmed

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'router.push(url.pathname+url.search)'
  - Expected
  + Received
  - router.push(url.pathname+url.search)
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {Button} from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  ```
- Public unsubscribe confirmations > TPO-campaigns-public-16 permits idempotent used signed tokens, but rejects unverified ones

  ```
  AssertionError: expected 'import {NextResponse} from "next/serv…' to contain 'if(!claim)return NextResponse.json({e…'
  - Expected
  + Received
  - if(!claim)return NextResponse.json({error:"INVALID_OR_EXPIRED_LINK"},{status:400})
  + import {NextResponse} from "next/server";
  + import {sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {isSameOriginRequest} from "@/auth/origin";
  ```

## tests/unit/chat3-round9-origin-and-portal-regression.test.ts (1 failing)
- Chat-3 Round 9 restored contracts > TPO-drives-29/30/38 external employer portal uses noopener noreferrer

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

## tests/unit/chat4-college-academic-responsive-data-table.test.tsx (3 failing)
- COL-UX-ACADEMIC-TABLE-01 responsive Semester and Batch directories > renders the actual semester with native accessible table headers and all legacy actions

  ```
  
  ```
- COL-UX-ACADEMIC-TABLE-01 responsive Semester and Batch directories > retains academic year, class count, status and Manage/Students links on batch cards

  ```
  
  ```
- COL-UX-ACADEMIC-TABLE-01 responsive Semester and Batch directories > keeps a truthful no-results recovery state rather than an inaccessible empty table

  ```
  Error: invariant expected app router to be mounted
  ❯ useRouter node_modules/next/src/client/components/navigation.ts:169:11
  ❯ CollegeDirectoryPageSize src/components/academics/college-directory-page-size.tsx:13:18
  11| /** Preserve legacy per-page preference, including all active URL filt…
  12| export function CollegeDirectoryPageSize({ current }: { current: numbe…
  13|   const router = useRouter();
  |                  ^
  14|   const [pending, startTransition] = useTransition();
  ```

## tests/unit/chat4-college-projects-canonical-page.test.ts (3 failing)
- PROJ-BREAK-COLLEGE-04-PAGE-06 stale College Admin project bookmarks > keeps active search, status, table view and chosen page size on archive-driven page clamp

  ```
  AssertionError: expected '/college/projects?q=capstone&status=A…' to be '/college/projects?q=capstone&status=A…' // Object.is equality
  Expected: "/college/projects?q=capstone&status=ACTIVE&view=table&pageSize=50&page=3"
  Received: "/college/projects?q=capstone&status=ACTIVE&pageSize=50&page=3"
  ```
- PROJ-BREAK-COLLEGE-04-PAGE-06 stale College Admin project bookmarks > keeps malformed and cross-tenant URL filters out before building any canonical redirect

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
- PROJ-BREAK-COLLEGE-04-PAGE-06 stale College Admin project bookmarks > redirects only after a scoped snapshot read and before an inconsistent list/pagination renders

  ```
  AssertionError: expected -1 to be greater than 0
  ❯ tests/unit/chat4-college-projects-canonical-page.test.ts:45:21
  43|   const canonical=source.indexOf("canonicalCollegeProjectsPageHref(que…
  44|   const list=source.indexOf("<ProjectAdminWorkspaceList");
  45|   expect(snapshots).toBeGreaterThan(0);
  |                     ^
  46|   expect(canonical).toBeGreaterThan(snapshots);
  47|   expect(list).toBeGreaterThan(canonical);
  ```

## tests/unit/chat4-independent-finding-sync-gate.test.ts (1 failing)
- SA-tenants-modules-46 inaccessible audit repository > SA-tenants-modules-46 does not fabricate successful imports without verified provider access

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'No sync was performed by opening this…'
  - Expected
  + Received
  - No sync was performed by opening this page.
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Banner } from "@/components/ui/banner";
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat4-superadmin-college-signin-page-states.test.tsx (1 failing)
- SA-colleges-signin-page-01 actual Super Admin page state and authorization > invalid college IDs 404 before scoped policy access

  ```
  AssertionError: promise resolved "{ …(10) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + <div
  +   className="min-w-0 space-y-4"
  + >
  ```
