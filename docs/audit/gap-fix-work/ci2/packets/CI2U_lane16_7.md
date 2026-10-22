# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

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

## tests/unit/chat19-hr-surface-parity.test.ts (6 failing)
- NORTH-STAR chat-19: legacy recruiter page canvas > separates Today sections using dividers rather than nested full-size cards

  ```
  AssertionError: expected 'import {NeedsDoingChips} from "@/comp…' to contain 'aria-label="Recruiter tasks" classNam…'
  - Expected
  + Received
  - aria-label="Recruiter tasks" className="grid overflow-hidden rounded-[var(--lms-radius-card)] border border-border sm:grid-cols-2 xl:grid-cols-5"
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import { Badge } from "@/components/ui/badge";
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  ```
- NORTH-STAR chat-19: legacy recruiter page canvas > uses a single old-LMS counter strip for calendar and company reports

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'aria-label="Recruiter calendar summar…'
  - Expected
  + Received
  - aria-label="Recruiter calendar summary"
  + import { DateInput } from "@/components/ui/date-input";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { CalendarGrid } from "@/components/ui/calendar-grid";
  ```
- NORTH-STAR chat-19: legacy recruiter page canvas > keeps proposal rows on the table-like hairlines

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'className="divide-y divide-border bor…'
  - Expected
  + Received
  - className="divide-y divide-border border-y border-border"
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  ```
- NORTH-STAR chat-19: legacy recruiter page canvas > uses shared Input Select Button chrome for proposal filters

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '<Input name="q"'
  - Expected
  + Received
  - <Input name="q"
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  ```
- NORTH-STAR chat-19: legacy recruiter page canvas > uses shared form controls for recruiter hiring round creation and editing

  ```
  AssertionError: expected 7 to be 3 // Object.is equality
  - Expected
  + Received
  - 3
  + 7
  ```
- NORTH-STAR chat-19: legacy recruiter page canvas > keeps the mobile drawer icon-only triggers with balanced SVG markup

  ```
  AssertionError: expected 1 to be 2 // Object.is equality
  - Expected
  + Received
  - 2
  + 1
  ```

## tests/unit/chat2-campaign-history-legacy-copy.test.ts (1 failing)
- TPO legacy Emails history copy > TPO-campaigns-public-10 retains exact Emails, sent/skipped/failed and failure Retry copy

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' to contain 'item.skipped+" skipped"'
  - Expected
  + Received
  - item.skipped+" skipped"
  + import { Alert } from "@/components/ui/alert";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Dropdown } from "@/components/ui/dropdown";
  ```

## tests/unit/chat2-final-sprint-threads-profile-c.test.ts (1 failing)
- Final sprint recruiter threads and profile — group C > REC-calendar-messages-profile-30 keeps explicit confirmed college-specific self-revocation rather than silent access changes

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'window.confirm('
  - Expected
  + Received
  - window.confirm(
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```

## tests/unit/chat2-team-handover-36.test.ts (1 failing)
- Scoped Team ownership handover > TPO-inbox-team-36 exposes guarded handover from People, not an unguarded role-revocation button

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'window.confirm'
  - Expected
  + Received
  - window.confirm
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { useConfirmFlow } from "@/components/ui/use-confirm-flow";
  ```

## tests/unit/chat2-tpo-multi-notice-audience.test.ts (1 failing)
- TPO announcement targeting > TPO-inbox-team-44 lets users search multiple batches/branches and preserves selection through preview

  ```
  AssertionError: expected '"use client";\nimport {useState} from…' to contain 'multiple value={targets}'
  - Expected
  + Received
  - multiple value={targets}
  + "use client";
  + import {useState} from "react";
  + import {Input} from "@/components/ui/input";
  + import {Select} from "@/components/ui/select";
  ```
