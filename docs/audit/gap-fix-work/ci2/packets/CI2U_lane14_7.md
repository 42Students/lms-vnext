# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-recruiter-mail-reminder-route-02.test.ts (2 failing)
- chat-16 authenticated recruiter email digest worker POST > HR-MAIL-REMINDERS-04 invokes one worker for an authenticated request without cache

  ```
  AssertionError: expected { skipped: true, …(2) } to deeply equal { examined: 2, sent: 1, enabled: true }
  - Expected
  + Received
  {
  -   "enabled": true,
  -   "examined": 2,
  -   "sent": 1,
  +   "reason": "STARTUP_GRACE",
  ```
- chat-16 authenticated recruiter email digest worker POST > HR-MAIL-REMINDERS-05 maps worker outages to a generic 503 without private details

  ```
  AssertionError: expected 200 to be 503 // Object.is equality
  - Expected
  + Received
  - 503
  + 200
  ```

## tests/unit/chat19-hr-page-contracts.test.ts (6 failing)
- HR page-level access, recovery and mobile contracts > UX-hr-profile-02 never renders employer data before an active recruiter context is established

  ```
  AssertionError: expected 'import { DataTable } from "@/componen…' to match /redirect\(/
  - Expected:
  /redirect\(/
  + Received:
  "import { DataTable } from \"@/components/ui/data-table\";
  import { NeedsDoingChips } from \"@/components/ui/needs-doing-chips\";
  import { z } from \"zod\";
  import { EmptyState } from \"@/components/ui/empty-state\";
  ```
- HR page-level access, recovery and mobile contracts > UX-hr-colleges-02 retired route redirects instead of exposing the old college directory

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'redirect("/hr/home")'
  - Expected
  + Received
  - redirect("/hr/home")
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {hasActiveRecruiter} from "@/modules/identity/context";
  ```
- HR page-level access, recovery and mobile contracts > HR-XA-01 offers and selection history keep all fields accessible without side scrolling on a phone

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'caption="Placement-cell selection his…'
  - Expected
  + Received
  - caption="Placement-cell selection history"
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```
- HR page-level access, recovery and mobile contracts > HR-XA-02 HR-XA-03 HR-XA-04 show recovery and readable back navigation after load failures

  ```
  AssertionError: expected '"use client";\n\nimport { Alert } fro…' to contain '<Button type="button" onClick={reset}…'
  - Expected
  + Received
  - <Button type="button" onClick={reset}>Try again</Button>
  + "use client";
  +
  + import { Alert } from "@/components/ui/alert";
  + import { Button } from "@/components/ui/button";
  ```
- HR page-level access, recovery and mobile contracts > UX-hr-job-details-02 invalid and withdrawn applicant deep links fail closed

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
- HR page-level access, recovery and mobile contracts > UX-hr-scroll-motion-02 uses one motion system without extra hard-coded duration

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' not to match /duration-[0-9]{2,4}/
  - Expected:
  /duration-[0-9]{2,4}/
  + Received:
  "import { EmptyState } from \"@/components/ui/empty-state\";
  import { ScrollCue } from \"@/components/ui/scroll-cue\";
  import Link from \"next/link\";
  import {RecruiterConversationReplyForm} from \"@/components/hr/recruiter-conversation-reply-form\";
  ```

## tests/unit/chat2-business-email-safety.test.ts (2 failing)
- Public recruiter verified company mailbox > TPO-campaigns-public-22 returns useful field-specific source messages

  ```
  AssertionError: expected 'College and university addresses can\…' to contain 'academic'
  Expected: "academic"
  Received: "College and university addresses can't be used for a company"
  ```
- Public recruiter verified company mailbox > TPO-campaigns-public-22 checks MX before issuing a code, with an explicit unavailable retry

  ```
  AssertionError: expected 'import "server-only";\n\nimport { cre…' to contain 'resolveMx(host)'
  - Expected
  + Received
  - resolveMx(host)
  + import "server-only";
  +
  + import { createHash, createHmac } from "node:crypto";
  + import {companyDomainAcceptsMail} from "../company-mail-domain-resolver";
  ```

## tests/unit/chat2-final-sprint-recruiter-messages.test.ts (7 failing)
- Final sprint recruiter conversations verification > REC-calendar-messages-profile-09 shows unread/threads toolbar and searches authorized message bodies

  ```
  AssertionError: expected 'import inboxStyles from "@/components…' to contain 'unread across'
  - Expected
  + Received
  - unread across
  + import inboxStyles from "@/components/hr/recruiter-conversations-legacy.module.css";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import { Tabs } from "@/components/ui/tabs";
  ```
- Final sprint recruiter conversations verification > REC-calendar-messages-profile-11 keeps the General discussion in the inbox with reply and controlled open action

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
- Final sprint recruiter conversations verification > REC-calendar-messages-profile-13 refreshes visible recruiter discussions at four seconds and on focus without GET writes

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
- Final sprint recruiter conversations verification > REC-calendar-messages-profile-18 includes current drive change requests and recruiter/placement sender attribution

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'aria-label="Drive change request upda…'
  - Expected
  + Received
  - aria-label="Drive change request updates"
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  + import Link from "next/link";
  + import {RecruiterConversationReplyForm} from "@/components/hr/recruiter-conversation-reply-form";
  ```
- Final sprint recruiter conversations verification > REC-calendar-messages-profile-11 independent final-sprint acceptance regression

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
- Final sprint recruiter conversations verification > REC-calendar-messages-profile-13 independent final-sprint acceptance regression

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
- Final sprint recruiter conversations verification > REC-calendar-messages-profile-15 independent final-sprint acceptance regression

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'setNotice("Could not send. "+feedback)'
  - Expected
  + Received
  - setNotice("Could not send. "+feedback)
  + "use client";
  + import {useEffect,useRef,useState,type FormEvent} from "react";
  + import {useRouter} from "next/navigation";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```

## tests/unit/chat2-safe-deviations-open-gap-decisions.test.ts (2 failing)
- Safety justified deviations from legacy TPO UI > TPO-campaigns-public-37 releases no identifying small-cohort aggregate and never invents a placed tally

  ```
  AssertionError: expected 'import "server-only";\nimport { and, …' to contain 'placedAt === "SELECTED" ? null'
  - Expected
  + Received
  - placedAt === "SELECTED" ? null
  + import "server-only";
  + import { and, eq, isNotNull, or, sql } from "drizzle-orm";
  + import { getDb } from "@/db/client";
  + import {
  ```
- Safety justified deviations from legacy TPO UI > TPO-inbox-team-42 uses directly linked accessible mobile conversation pages rather than an inaccessible miniature three-pane view

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'Internal conversations'
  - Expected
  + Received
  - Internal conversations
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/chat2-tpo-lead-modal-source.test.ts (1 failing)
- TPO recruiter contact modal and source parity > TPO-recruiters-36 traps Tab and supports Escape inside editable recruiter dialogs

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain '<Dialog open={editing}'
  - Expected
  + Received
  - <Dialog open={editing}
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
  + import { Banner } from "@/components/ui/banner";
  ```
