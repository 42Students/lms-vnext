# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-tpo-notification-preferences-write-16.test.ts (4 failing)
- chat-16 TPO personal notification preferences live mutation authorization > TPO-notifications-preferences-18 rechecks persisted active TPO inside the locked college transaction

  ```
  AssertionError: expected [Function] to throw error including 'placements.manage' but got 'NOT_READY'
  Expected: "placements.manage"
  Received: "NOT_READY"
  ```
- chat-16 TPO personal notification preferences live mutation authorization > TPO-notifications-preferences-19 refuses stale versions without rewriting preferences or audit

  ```
  AssertionError: expected [Function] to throw error including 'STALE' but got 'NOT_READY'
  Expected: "STALE"
  Received: "NOT_READY"
  ```
- chat-16 TPO personal notification preferences live mutation authorization > TPO-notifications-preferences-21 treats an identical stale retry as a no-op, without duplicate activity

  ```
  AssertionError: promise rejected "Error: NOT_READY { code: 'NOT_READY' }" instead of resolving
  ❯ tests/unit/chat16-tpo-notification-preferences-write-16.test.ts:84:60
  82|   const previous=new Date("2026-10-18T09:00:00Z");
  83|   const f=mockDb({...input,updatedAt:previous});
  84|   await expect(saveMyTpoNotificationPreferences(tpo,input)).resolves.t…
  |                                                            ^
  85|    saved:true,version:"2026-10-18T09:00:00.000Z",
  86|   });
  ```
- chat-16 TPO personal notification preferences live mutation authorization > TPO-notifications-preferences-20 makes one versioned first write and scoped audit event

  ```
  Error: NOT_READY
  ❯ src/modules/placements/tpo-my-notification-preferences-write.ts:30:46
  28|   const [locked]=await tx.select({id:colleges.id,status:colleges.statu…
  29|    .where(eq(colleges.id,collegeId)).for("update").limit(1);
  30|   if(!locked||locked.status!=="ACTIVE")throw new TpoPreferenceSaveErro…
  |                                              ^
  31|   // Lock and reconstruct the actor's real roles inside the transactio…
  32|   // a suspended/reassigned TPO cannot update preferences from a stale…
  ```

## tests/unit/chat19-north-star-legacy-sidebar.test.ts (5 failing)
- NORTH-STAR-SIDEBAR-01: old LMS 96px rail, hover push and icons > follows exactly the old measured rail transition and active/hover colors

  ```
  AssertionError: expected '/*\n * Legacy sidebar shell (docs/des…' to contain 'background:#eff8fa'
  - Expected
  + Received
  - background:#eff8fa
  + /*
  +  * Legacy sidebar shell (docs/design/old-lms-shell.css).
  +  * Desktop: 96px rail -> 256px on hover/focus, content PUSHES right.
  +  * Mobile uses the existing focus-trapped drawer and always shows labels.
  ```
- NORTH-STAR-SIDEBAR-01: old LMS 96px rail, hover push and icons > matches all measured sidebar link, heading, badge and logo values from the old CSS

  ```
  AssertionError: expected '/*\n * Legacy sidebar shell (docs/des…' to contain 'border-right:1px solid #f1f4f9'
  - Expected
  + Received
  - border-right:1px solid #f1f4f9
  + /*
  +  * Legacy sidebar shell (docs/design/old-lms-shell.css).
  +  * Desktop: 96px rail -> 256px on hover/focus, content PUSHES right.
  +  * Mobile uses the existing focus-trapped drawer and always shows labels.
  ```
- NORTH-STAR-SIDEBAR-01: old LMS 96px rail, hover push and icons > uses the legacy thin TPO scrollbar only on expanded rails

  ```
  AssertionError: expected '/*\n * Legacy sidebar shell (docs/des…' to contain '.lms-sidebar-item-icon svg {display:b…'
  - Expected
  + Received
  - .lms-sidebar-item-icon svg {display:block;width:20px;height:20px;}
  + /*
  +  * Legacy sidebar shell (docs/design/old-lms-shell.css).
  +  * Desktop: 96px rail -> 256px on hover/focus, content PUSHES right.
  +  * Mobile uses the existing focus-trapped drawer and always shows labels.
  ```
- NORTH-STAR-SIDEBAR-01: old LMS 96px rail, hover push and icons > hides expanded headings and labels in collapsed desktop mode, keeps mobile labels

  ```
  AssertionError: expected '"use client";\n\nimport {Fragment,use…' to contain 'scopedShellNavigation(items,pathname)'
  - Expected
  + Received
  - scopedShellNavigation(items,pathname)
  + "use client";
  +
  + import {Fragment,useEffect,useState} from "react";
  + import {apiFetch} from "@/lib/api-fetch";
  ```
- NORTH-STAR-SIDEBAR-01: old LMS 96px rail, hover push and icons > uses the exact historic 42LMS logomark and preserves the mobile focus-trapped drawer

  ```
  AssertionError: expected 'import { Suspense, type ReactNode } f…' to contain 'className="lms-shell-page min-h-dvh"'
  - Expected
  + Received
  - className="lms-shell-page min-h-dvh"
  + import { Suspense, type ReactNode } from "react";
  + import {
  +   hasMembershipRole,
  +   isSuperAdmin,
  ```

## tests/unit/chat2-college-recruiter-interview-service-denials.test.ts (1 failing)
- chat-2 college and recruiter interview service zero-read denials > COL-interviews-security-02 directory schema rejects tenant override, bad paging, unknown modes ahead of auth and DB

  ```
  AssertionError: expected { q: '', status: 'ALL', …(5) } to match object { status: 'ALL', mode: 'ALL', …(3) }
  (2 matching properties omitted from actual)
  - Expected
  + Received
  {
  "mode": "ALL",
  "page": 1,
  -   "sort": "UPCOMING",
  ```

## tests/unit/chat2-ledger-tpo-round-result.test.ts (2 failing)
- TPO-drive-workspace-37/40/42 placement round lifecycle ledger > locks reordering for finished drives and every round with execution artifacts

  ```
  AssertionError: expected 'The order is locked because this driv…' to contain 'two rounds'
  Expected: "two rounds"
  Received: "The order is locked because this drive has ended."
  ```
- TPO-drive-workspace-37/40/42 placement round lifecycle ledger > preserves legacy outcome semantics and blocks premature application

  ```
  AssertionError: expected 'Pass' to be 'Shortlisted for next round' // Object.is equality
  Expected: "Shortlisted for next round"
  Received: "Pass"
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

## tests/unit/chat2-tpo-recruiter-edit-conflict.test.ts (1 failing)
- TPO recruiter editor duplicate conflict recovery > TPO-recruiters-30 preserves edit values and links the college-scoped duplicate lead on 409

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'className="font-semibold text-primary…'
  - Expected
  + Received
  - className="font-semibold text-primary-text underline">Open {duplicateLead.name}
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
  + import { Banner } from "@/components/ui/banner";
  ```
