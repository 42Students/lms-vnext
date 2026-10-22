# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat15-final-sprint-fac-assessments.test.ts (2 failing)
- chat-15 final sprint: faculty assessments audit decision verification > FAC-assessments-25 NOT-A-GAP: overview shows course, lesson, due-date and draft visibility

  ```
  AssertionError: expected '"use client";\nimport { Badge } from …' to contain 'Course: {item.courseName}'
  - Expected
  + Received
  - Course: {item.courseName}
  + "use client";
  + import { Badge } from "@/components/ui/badge";
  + import {PageHeader} from "@/components/ui/page-header";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- chat-15 final sprint: faculty assessments audit decision verification > FAC-assessments-26 NOT-A-GAP: a draft still has an explicit zero-submission review

  ```
  AssertionError: expected '"use client";\n\nimport { Select } fr…' to contain 'No submissions yet. Publish this assi…'
  - Expected
  + Received
  - No submissions yet. Publish this assignment
  + "use client";
  +
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  ```

## tests/unit/chat16-mentor-editor-guard-r5.test.ts (1 failing)
- chat-16 mentor editor safeguards > MEN-projects-meetings-75 guards sprint details across edit and confirmation dialogs

  ```
  AssertionError: expected '"use client";\n\nimport { type FormEv…' to contain 'onOpenChange={next=>{if(!next)guard.r…'
  - Expected
  + Received
  - onOpenChange={next=>{if(!next)guard.requestClose();}}
  + "use client";
  +
  + import { type FormEvent, useEffect, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```

## tests/unit/chat16-round3-two-unit-regressions.test.ts (1 failing)
- REC-calendar-messages-profile-21 Round 3 notification polling > REC-calendar-messages-profile-21 refreshes relative time after failed as well as successful network polls

  ```
  AssertionError: expected 'const load=useCallback(async()=>{\n  …' to contain '}catch{setError("Couldn\'t refresh yo…'
  - Expected
  + Received
  - }catch{setError("Couldn't refresh your notifications");}
  + const load=useCallback(async()=>{
  +   const request=loadGate.current.begin();
  +   let authorizationLost=false;
  +   try{
  ```

## tests/unit/chat2-company-memory-gap-parity.test.ts (1 failing)
- TPO Company Memory legacy parity > TPO-companies-09 maps stored placement status to readable legacy labels

  ```
  AssertionError: expected '"use client";\n\nimport dynamic from …' to contain 'statusLabel(drive.status)'
  - Expected
  + Received
  - statusLabel(drive.status)
  + "use client";
  +
  + import dynamic from "next/dynamic";
  + import {useRouter} from "next/navigation";
  ```

## tests/unit/chat2-tpo-last-third-page-baseline.test.ts (3 failing)
- chat-2 last-third TPO pages: role-scoped route and recovery baseline > UX-tpo-team-everyone-01 preserves messages on backend failure and paginates explicitly

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Alert } from "@/components/ui/alert";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  ```
- chat-2 last-third TPO pages: role-scoped route and recovery baseline > UX-tpo-prep-readiness-01 preserves saved settings when dependent courses cannot load

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Alert } from "@/components/ui/alert";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
  ```
- chat-2 last-third TPO pages: role-scoped route and recovery baseline > UX-tpo-requests-01 requires a current TPO actor and gives recoverable request errors

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + import { Select } from "@/components/ui/select";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {FilterChipLink} from "@/components/ui/filter-chip";
  ```

## tests/unit/chat2-unsubscribe-graceful.test.ts (1 failing)
- Public unsubscribe confirmations > TPO-campaigns-public-16 permits idempotent used signed tokens, but rejects unverified ones

  ```
  AssertionError: expected 'import "server-only";\nimport {create…' to contain 'if(outcome==="DENY")throw new Campaig…'
  - Expected
  + Received
  - if(outcome==="DENY")throw new CampaignUnsubscribeInvalid()
  + import "server-only";
  + import {createHash} from "node:crypto";
  + import {and,asc,eq,isNull,sql} from "drizzle-orm";
  + import {activityEvents,colleges,collegeMemberships,membershipRoles,users,inAppNotifications} from "@/db/schema";
  ```

## tests/unit/chat4-academics-groups-ledger.test.ts (2 failing)
- chat-4 college academics and group models: state, validation, concurrency > batchPromotionPlan distinguishes promote, graduate and unusable progression

  ```
  AssertionError: expected { action: 'PROMOTE', …(3) } to deeply equal { action: 'PROMOTE', …(3) }
  - Expected
  + Received
  {
  -   "academicYearStart": 2026,
  +   "academicYearStart": 2027,
  "action": "PROMOTE",
  "blockers": [],
  ```
- chat-4 college academics and group models: state, validation, concurrency > collegeSectionLifecycleSchema enforces exact version, action and destructive confirmation

  ```
  AssertionError: expected 'Archive class CSE-A? This hides the c…' to contain 'blocks archival'
  Expected: "blocks archival"
  Received: "Archive class CSE-A? This hides the class from active lists but retains its history for auditing. Move enrolled students and unlink teaching, schedules and course deliveries first."
  ```

## tests/unit/chat4-college-term-mapping-phone-actions.test.tsx (2 failing)
- COL-UX-TERM-MAPPINGS-04 keyboard/mobile curriculum mapping > retains the empty-state guidance instead of rendering a zero-row modal or phantom mapping

  ```
  Error: useToast must be used within ToastProvider
  ❯ useToast src/components/ui/toast.tsx:210:23
  208| export function useToast() {
  209|   const context = useContext(ToastContext);
  210|   if (!context) throw new Error("useToast must be used within ToastPro…
  |                       ^
  211|   return context;
  212| }
  ```
- COL-UX-TERM-MAPPINGS-04 keyboard/mobile curriculum mapping > renders one DataTable with all original actions, drag fallback and phone-visible order controls

  ```
  AssertionError: expected '"use client";\n\nimport { Select } fr…' to contain 'onDrop={event=>'
  - Expected
  + Received
  - onDrop={event=>
  + "use client";
  +
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  ```
