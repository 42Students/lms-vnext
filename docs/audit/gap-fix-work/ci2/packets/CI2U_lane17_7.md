# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-telegram-preview-graceful-r5.test.ts (1 failing)
- chat-16 Telegram digest without provider secrets > SA-placements-projects-116 previews digest offline while disabling only sends

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain '<button type="button" disabled={pendi…'
  - Expected
  + Received
  - <button type="button" disabled={pending} onClick={()=>setOpen(true)}
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  +
  ```

## tests/unit/chat19-hr-tabs-and-college-selector-skin.test.ts (3 failing)
- NORTH-STAR-CHAT19: recruiter legacy navigation and controls > renders distinct active and inactive underlined conversation filters

  ```
  AssertionError: expected 'import inboxStyles from "@/components…' to contain 'aria-label="Conversation kind"'
  - Expected
  + Received
  - aria-label="Conversation kind"
  + import inboxStyles from "@/components/hr/recruiter-conversations-legacy.module.css";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import { Tabs } from "@/components/ui/tabs";
  ```
- NORTH-STAR-CHAT19: recruiter legacy navigation and controls > uses a 9px legacy control radius for selected employer colleges

  ```
  AssertionError: expected 'import {NeedsDoingChips} from "@/comp…' to contain 'aria-current={grant.collegeId === res…'
  - Expected
  + Received
  - aria-current={grant.collegeId === result.grant.collegeId ? "page" : undefined}
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import {getDb} from "@/db/client";
  + import {placementCompanies} from "@/db/schema";
  + import {eq} from "drizzle-orm";
  ```
- NORTH-STAR-CHAT19: recruiter legacy navigation and controls > keeps the recruiter notification bell focus at the measured teal outline

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'focus-visible:outline-[var(--lms-prim…'
  - Expected
  + Received
  - focus-visible:outline-[var(--lms-primary)] disabled:opacity-50
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```

## tests/unit/chat2-campaign-open-increments.test.ts (1 failing)
- TPO campaigns and company page remaining audited increments > TPO-companies-20 routes the default list to legacy Engage Companies while preserving explicit named memory and scoped directory URLs

  ```
  AssertionError: expected 'import {TpoCompaniesSpreadsheet} from…' to contain 'redirect("/tpo/recruiters?view=compan…'
  - Expected
  + Received
  - redirect("/tpo/recruiters?view=companies")
  + import {TpoCompaniesSpreadsheet} from "@/components/tpo/tpo-companies-spreadsheet";
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  ```

## tests/unit/chat2-interview-reschedule-security.test.ts (1 failing)
- TPO-drive-workspace-44 interview scheduling and rescheduling security > TPO-drive-workspace-44 accepts only secure, credential-free virtual interview links

  ```
  TypeError: Invalid URL
  ❯ Object.z.object.meetingUrl.z.url.max.refine.message [as fn] src/modules/placements/tpo-interview-reschedule-model.ts:10:13
  8|  venue:z.string().trim().min(1).max(500).optional(),
  9|  meetingUrl:z.url({protocol:/^https$/}).max(2000).refine(value=>{
  10|   const url=new URL(value);
  |             ^
  11|   return !url.username&&!url.password;
  12|  },{message:"Use a secure meeting link without embedded credentials"})…
  ```

## tests/unit/chat2-team-member-and-alert-parity.test.ts (3 failing)
- chat-2 Team membership, context and event notifications > TPO-inbox-team-38 lets authorized college admins and TPO admins participate, with persisted college scope

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'member.roles.includes("COLLEGE_ADMIN")'
  - Expected
  + Received
  - member.roles.includes("COLLEGE_ADMIN")
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
- chat-2 Team membership, context and event notifications > TPO-inbox-team-37 shows permanent placement Team roles, not temporary drive-day coordinator labels

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'member.roles.includes("TPO_ADMIN")'
  - Expected
  + Received
  - member.roles.includes("TPO_ADMIN")
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
- chat-2 Team membership, context and event notifications > TPO-inbox-team-34 retains Away until and back-now updates on Team People

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'listTpoTeamAway'
  - Expected
  + Received
  - listTpoTeamAway
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/chat2-tpo-public-link-bounded-json.test.ts (1 failing)
- TPO-settings-audit-55 bounded recruiter and public join-link write boundaries > all public link and recruiter grant POST handlers check origin before bounded body

  ```
  AssertionError: src/app/api/placements/tpo/public-join-links/route.ts: expected 'import { NextResponse } from "next/se…' to match /status:\\s*403/
  - Expected:
  /status:\\s*403/
  + Received:
  "import { NextResponse } from \"next/server\";
  import { ZodError } from \"zod\";
  import { getCurrentRequestContext } from \"@/auth/request-context\";
  import { isSameOriginRequest } from \"@/auth/origin\";
  ```
