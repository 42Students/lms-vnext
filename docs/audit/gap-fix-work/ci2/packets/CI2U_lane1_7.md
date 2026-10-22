# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-public-unsubscribe-page-27.test.ts (3 failing)
- chat-16 public campaign opt-out page invalid/accepted/outage UX > UX-public-unsubscribe-01 GET with valid token renders explicit confirmation, never submits

  ```
  AssertionError: expected "vi.fn()" to be called with arguments: [ Array(1) ]
  Number of calls: 0
  ❯ tests/unit/chat16-public-unsubscribe-page-27.test.ts:28:42
  26|     vi.mocked(campaignUnsubscribeTokenKind).mockResolvedValue("PLACEME…
  27|     const html = renderToStaticMarkup(await page());
  28|     expect(campaignUnsubscribeTokenKind).toHaveBeenCalledWith(token);
  |                                          ^
  29|     expect(html).toContain("Stop these emails?");
  ```
- chat-16 public campaign opt-out page invalid/accepted/outage UX > UX-public-unsubscribe-02 unknown or expired token shows denial without opt-out mutation

  ```
  AssertionError: expected '<main class="flex min-h-dvh w-full mi…' to contain 'This confirmation link is invalid or …'
  Expected: "This confirmation link is invalid or expired."
  Received: "<main class="flex min-h-dvh w-full min-w-0 items-center justify-center bg-[#f5f7f9] p-4"><div class="w-full max-w-[440px]"><section data-slot="card" class="min-w-0 rounded-[var(--lms-radius-card)] border border-[var(--lms-canvas-border)] bg-[var(--lms-surface)] p-[var(--lms-space-4)] text
  ```
- chat-16 public campaign opt-out page invalid/accepted/outage UX > UX-public-unsubscribe-04 temporary lookup outage preserves consent and offers retry

  ```
  AssertionError: expected '<main class="flex min-h-dvh w-full mi…' to contain 'We couldn&#x27;t check this confirmat…'
  Expected: "We couldn&#x27;t check this confirmation link right now."
  Received: "<main class="flex min-h-dvh w-full min-w-0 items-center justify-center bg-[#f5f7f9] p-4"><div class="w-full max-w-[440px]"><section data-slot="card" class="min-w-0 rounded-[var(--lms-radius-card)] border border-[var(--lms-canvas-border)] bg-[var(--lms-surface)] p-[var(--lms-space-4)] text
  ```

## tests/unit/chat16-tpo-personal-notification-read-16.test.ts (2 failing)
- chat-16 own-college TPO inbox count and presentation privacy > TPO-notification-inbox-18 returns fixed labels and counts without rendering database-supplied notification body

  ```
  TypeError: Cannot read properties of undefined (reading 'from')
  ❯ src/modules/placements/tpo-my-notifications-service.ts:218:101
  216|   // enough for a stale request context to have once held placements.m…
  217|   await db.transaction(async tx=>{
  218|     const [college]=await tx.select({organizationId:colleges.organizat…
  |                                                                                                     ^
  219|       .from(colleges).where(eq(colleges.id,collegeId)).for("share").li…
  220|     if(!college||college.status!=="ACTIVE"||college.organizationId!==o…
  ```
- chat-16 own-college TPO inbox count and presentation privacy > TPO-notification-inbox-19 denies stale actor after retrieval if persisted TPO membership was revoked

  ```
  AssertionError: expected "vi.fn()" to be called with arguments: [ Anything, { …(2) }, …(2) ]
  Number of calls: 0
  ❯ tests/unit/chat16-tpo-personal-notification-read-16.test.ts:84:45
  82|   });
  83|   await expect(getTpoMyNotifications(ctx,{})).rejects.toThrow();
  84|   expect(assertPersistedPlatformPermission).toHaveBeenCalledWith(
  |                                             ^
  85|    expect.anything(),ctx,"placements.manage",{collegeId:college,organi…
  ```

## tests/unit/chat19-projects-recruiter-role-journey.test.ts (2 failing)
- HR/Recruiter Projects role journey > PROJ-HR-03 denies wrong-tenant, wrong-employer, unshared and deactivated candidates

  ```
  AssertionError: expected 'import "server-only";\nimport { and, …' to contain 'getRecruiterPlacementWorkspace(contex…'
  - Expected
  + Received
  - getRecruiterPlacementWorkspace(context, rawJobId)
  + import "server-only";
  + import { and, desc, eq, exists, gt, inArray, sql } from "drizzle-orm";
  + import { getDb } from "@/db/client";
  + import { collegeMemberships, placementApplications, placementApplicationScreenings,
  ```
- HR/Recruiter Projects role journey > PROJ-HR-04 stale applicant deep links cannot reveal withdrawn screening or different applicant project details

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'if (!hasActiveRecruiter(context))'
  - Expected
  + Received
  - if (!hasActiveRecruiter(context))
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```

## tests/unit/chat2-company-canonical-link.test.ts (1 failing)
- TPO-companies-R04 Company Memory path to canonical controls > shows canonical path when resolved

  ```
  AssertionError: expected '"use client";\nimport { PageBackLink …' to contain 'Company link and trusted settings'
  - Expected
  + Received
  - Company link and trusted settings
  + "use client";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Badge } from "@/components/ui/badge";
  ```

## tests/unit/chat2-notices-retraction-update.test.ts (1 failing)
- TPO announcement delivery retraction and edit notifications > TPO-inbox-team-51 supports versioned edits and optional scoped re-notification

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' to contain 'if(input.notifyChanged && editEvent)'
  - Expected
  + Received
  - if(input.notifyChanged && editEvent)
  + import "server-only";
  + import {and,eq,isNull} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```

## tests/unit/chat2-tpo-campaign-compose-route.test.ts (1 failing)
- TPO-campaigns-public-01 campaign composer and POST > never claims delivery from draft save

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'No message is sent'
  - Expected
  + Received
  - No message is sent
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  ```
