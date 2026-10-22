# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-recruiter-mail-inbound-route-01.test.ts (1 failing)
- chat-16 inbound recruiter mail POST guard > HR-MAIL-ROUTE-04 forwards the unmodified body and supplied signature

  ```
  AssertionError: expected { accepted: true, …(2) } to deeply equal { accepted: true, replayed: false }
  - Expected
  + Received
  {
  "accepted": true,
  +   "outcome": "NOT_OURS",
  "replayed": false,
  }
  ```

## tests/unit/chat19-college-hiring-funnel-mobile.test.tsx (2 failing)
- UX-SPILL-COL-FUNNEL-01: college hiring report phone and zero-state rendering > renders all ten stage metrics and names via shared responsive DataTable cards

  ```
  
  ```
- UX-SPILL-COL-FUNNEL-01: college hiring report phone and zero-state rendering > an authorized empty portfolio has explicit no-data copy but no invented employer row

  ```
  Error: invariant expected app router to be mounted
  ❯ useRouter node_modules/next/src/client/components/navigation.ts:169:11
  ❯ CollegeHiringFunnel src/components/placements/college-hiring-funnel.tsx:23:15
  21|  data:Funnel;selectedSeasonId:string|null;selectedJobId:string|null;
  22| }){
  23|  const router=useRouter();
  |               ^
  24|  const q=data.query;
  ```

## tests/unit/chat2-UX-tpo-overlay-coverage.test.ts (5 failing)
- UX-tpo-overlay component coverage: accessible dialogs, names and guarded actions > UX-tpo-overlay-tpo-new-followup-modal.tsx keeps a named shared overlay and scoped interaction

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Discard this unfinished follow-up?'
  - Expected
  + Received
  - Discard this unfinished follow-up?
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { Input } from "@/components/ui/input";
  ```
- UX-tpo-overlay component coverage: accessible dialogs, names and guarded actions > UX-tpo-overlay-tpo-public-join-link-card.tsx keeps a named shared overlay and scoped interaction

  ```
  AssertionError: expected '"use client";\nimport { Checkbox } fr…' to contain 'PUBLIC_JOIN_LINK_COPY.replaceExplanat…'
  - Expected
  + Received
  - PUBLIC_JOIN_LINK_COPY.replaceExplanation
  + "use client";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  ```
- UX-tpo-overlay component coverage: accessible dialogs, names and guarded actions > UX-tpo-overlay-tpo-student-quick-panel.tsx keeps a named shared overlay and scoped interaction

  ```
  AssertionError: expected '"use client";\nimport {Button} from "…' to contain 'Retry loading student details'
  - Expected
  + Received
  - Retry loading student details
  + "use client";
  + import {Button} from "@/components/ui/button";
  + import {Tabs} from "@/components/ui/tabs";
  + import {Drawer} from "@/components/ui/drawer";
  ```
- UX-tpo-overlay component coverage: accessible dialogs, names and guarded actions > UX-tpo-overlay-tpo-students-bulk-debar.tsx keeps a named shared overlay and scoped interaction

  ```
  AssertionError: expected '"use client";\nimport { Textarea } fr…' to contain 'Confirm bulk debarment'
  - Expected
  + Received
  - Confirm bulk debarment
  + "use client";
  + import { Textarea } from "@/components/ui/textarea";
  + import { Select } from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  ```
- UX-tpo-overlay component coverage: accessible dialogs, names and guarded actions > UX-tpo-overlay shared modal title/focus/escape and safe viewport cues have direct evidence

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useR…' to contain 'showModal()'
  - Expected
  + Received
  - showModal()
  + "use client";
  +
  + import { useId, useRef, type ReactNode, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat2-final-sprint-conversations-b.test.ts (2 failing)
- Final sprint recruiter conversation parity — group B > REC-calendar-messages-profile-11 exposes in-place general conversation with history and reply

  ```
  AssertionError: expected 'import inboxStyles from "@/components…' to contain 'Message the placement cell · General'
  - Expected
  + Received
  - Message the placement cell · General
  + import inboxStyles from "@/components/hr/recruiter-conversations-legacy.module.css";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import { Tabs } from "@/components/ui/tabs";
  ```
- Final sprint recruiter conversation parity — group B > REC-calendar-messages-profile-13 refreshes recruiter inbox and detail every four seconds while visible

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'window.setInterval(update,4000)'
  - Expected
  + Received
  - window.setInterval(update,4000)
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat2-round-edit-concurrency.test.ts (2 failing)
- TPO-drive-workspace-37 optimistic round draft edits > TPO-drive-workspace-37 refuses an overlapping editor's stale compare-and-swap without emitting an event

  ```
  AssertionError: expected TypeError: tx.select is not a function to match object { Object (code) }
  - Expected
  + Received
  - {
  -   "code": "PLACEMENT_ROUND_NOT_EDITABLE",
  + TypeError {
  +   "message": "tx.select is not a function",
  }
  ```
- TPO-drive-workspace-37 optimistic round draft edits > TPO-drive-workspace-37 persists an accepted edit and writes exactly one round event

  ```
  TypeError: tx.select is not a function
  ❯ src/modules/placements/round-service.ts:248:34
  246|   const expectedUpdatedAt = current.round.updatedAt.toISOString();
  247|   return db.transaction(async (tx) => {
  248|     const [lockedJob] = await tx.select({ status: placementJobs.status…
  |                                  ^
  249|       .from(placementJobs).where(eq(placementJobs.id, current.job.id))
  250|       .for("update").limit(1);
  ```

## tests/unit/chat2-tpo-last-third-route-matrix.test.ts (1 failing)
- UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > TPO route-wide loading and error boundaries render recovery, not raw exceptions

  ```
  AssertionError: expected '"use client";\n\nimport { Button } fr…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  +
  + import { Button } from "@/components/ui/button";
  + import { ErrorState } from "@/components/ui/error-state";
  ```
