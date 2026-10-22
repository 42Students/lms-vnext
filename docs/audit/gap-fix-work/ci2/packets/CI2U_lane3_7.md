# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-reassigned-mentor-parity.test.ts (4 failing)
- chat-16 reassigned mentor legacy parity > MEN-projects-meetings-56 reorders only owned active resources in two collision-safe phases

  ```
  AssertionError: expected 'import {\n  and,\n  asc,\n  eq,\n  is…' to contain 'requireProjectLifecycleAccess(context…'
  - Expected
  + Received
  - requireProjectLifecycleAccess(context,projectIdInput)
  + import {
  +   and,
  +   asc,
  +   eq,
  ```
- chat-16 reassigned mentor legacy parity > MEN-projects-meetings-61 shows human-readable labels, category, and legacy empty states

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'No project activity yet. Task moves, …'
  - Expected
  + Received
  - No project activity yet. Task moves, sprint updates and resource changes will appear here.
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Input } from "@/components/ui/input";
  ```
- chat-16 reassigned mentor legacy parity > MEN-projects-meetings-69 keeps meeting load failure inline with a Retry action

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'listMyMentorCalendarMeetings(context)…'
  - Expected
  + Received
  - listMyMentorCalendarMeetings(context).catch(()=>null)
  + import { PageHeader } from "@/components/ui/page-header";
  + import {Button} from "@/components/ui/button";
  + import Link from "next/link";
  + import {MentorProjectsUnavailable} from "@/components/projects/mentor-projects-unavailable";
  ```
- chat-16 reassigned mentor legacy parity > MEN-projects-meetings-74 preserves redirect-only legacy Mentor URLs

  ```
  AssertionError: expected 'import {redirect} from "next/navigati…' to contain 'redirect("/mentor")'
  - Expected
  + Received
  - redirect("/mentor")
  + import {redirect} from "next/navigation";
  +
  + /** MEN-projects-meetings-74: legacy mentor bookmark compatibility. */
  + export default function MentorLegacyRedirect(){
  ```

## tests/unit/chat16-tracker-evidence-decision-r6.test.ts (2 failing)
- chat-16 tracker privacy-first evidence design > SA-placements-projects-103 rejects unsafe embedded evidence schemes while preserving a link-based report

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'Direct clipboard paste and unscanned …'
  - Expected
  + Received
  - Direct clipboard paste and unscanned attachments are not accepted.
  + "use client";
  +
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  ```
- chat-16 tracker privacy-first evidence design > SA-placements-projects-103 never displays arbitrary API exception messages in the report form

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'caught instanceof FriendlyFetchError …'
  - Expected
  + Received
  - caught instanceof FriendlyFetchError ? caught.message : friendlyApiError({})
  + "use client";
  +
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat19-shell-sidebar-clone.test.ts (2 failing)
- chat-19 legacy sidebar structural guardrails > retains the exact legacy collapsed and hover widths and easing

  ```
  AssertionError: expected '/*\n * Legacy sidebar shell (docs/des…' to contain 'box-shadow:inset 3px 0 #26bac7'
  - Expected
  + Received
  - box-shadow:inset 3px 0 #26bac7
  + /*
  +  * Legacy sidebar shell (docs/design/old-lms-shell.css).
  +  * Desktop: 96px rail -> 256px on hover/focus, content PUSHES right.
  +  * Mobile uses the existing focus-trapped drawer and always shows labels.
  ```
- chat-19 legacy sidebar structural guardrails > keeps mobile drawer controls accessible and its scroll surface padded

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain '!px-3 !pt-2 !pb-[calc(24px+env(safe-a…'
  - Expected
  + Received
  - !px-3 !pt-2 !pb-[calc(24px+env(safe-area-inset-bottom,0px))]
  + "use client";
  +
  + import { useEffect, useState } from "react";
  + import { usePathname } from "next/navigation";
  ```

## tests/unit/chat2-company-friendly-retry-21.test.ts (1 failing)
- Company Memory user-safe load failures > TPO-companies-21 identifies a genuinely missing company and provides retry without raw DB09 details

  ```
  AssertionError: expected '"use client";\nimport { PageBackLink …' to contain '"Company details are unavailable righ…'
  - Expected
  + Received
  - "Company details are unavailable right now. Try again."
  + "use client";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Badge } from "@/components/ui/badge";
  ```

## tests/unit/chat2-public-join-error-copy.test.ts (1 failing)
- TPO-campaigns-public-R02 explicit join failure copy > differentiates wrong, expired, locked and removed

  ```
  AssertionError: expected 'Your access was removed by the placem…' to contain 'removed your access'
  Expected: "removed your access"
  Received: "Your access was removed by the placement cell. Contact the placement cell to request a review or appeal."
  ```

## tests/unit/chat2-tpo-drive-detail-workflows.test.ts (1 failing)
- TPO drive detail navigation > keeps the drive overview and operational drive-day entry

  ```
  AssertionError: expected '/tpo/placements/jobs/id/applicants-pi…' to be '/tpo/placements/jobs/id' // Object.is equality
  Expected: "/tpo/placements/jobs/id"
  Received: "/tpo/placements/jobs/id/applicants-pipeline"
  ```
