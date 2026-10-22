# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-placements-37-schedule.test.ts (1 failing)
- LEARNER-placements-37 schedule details > LEARNER-placements-37 exposes persisted join and test URLs only after HTTPS checks

  ```
  AssertionError: expected 'import { Tabs } from "@/components/ui…' to contain 'Join online round'
  - Expected
  + Received
  - Join online round
  + import { Tabs } from "@/components/ui/tabs";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  ```

## tests/unit/learner-projects-gap-verification.test.ts (5 failing)
- learner/projects verified gap closure > LEARNER-projects-03 blocks are labelled and linked to Board blocked tasks

  ```
  AssertionError: expected 'import { z } from "zod";\nimport Link…' to contain '?tab=board&taskStatus=BLOCKED'
  - Expected
  + Received
  - ?tab=board&taskStatus=BLOCKED
  + import { z } from "zod";
  + import Link from "next/link";
  + import { Banner } from "@/components/ui/banner";
  + import { redirect } from "next/navigation";
  ```
- learner/projects verified gap closure > LEARNER-projects-04 maps legacy status labels and exposes blocked attention

  ```
  AssertionError: expected 'import { z } from "zod";\nimport Link…' to contain 'query.attention!=="BLOCKED"'
  - Expected
  + Received
  - query.attention!=="BLOCKED"
  + import { z } from "zod";
  + import Link from "next/link";
  + import { Banner } from "@/components/ui/banner";
  + import { redirect } from "next/navigation";
  ```
- learner/projects verified gap closure > LEARNER-projects-10 archived learner workspace has exact read-only copy

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'This workspace is archived, so it is …'
  - Expected
  + Received
  - This workspace is archived, so it is read-only.
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- learner/projects verified gap closure > LEARNER-projects-16 Overview uses legacy learner section names

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain '"Project team"'
  - Expected
  + Received
  - "Project team"
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- learner/projects verified gap closure > LEARNER-projects-30 comments validate nonempty note and expose comment kind

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useS…' to contain 'if(!body.trim())return;'
  - Expected
  + Received
  - if(!body.trim())return;
  + "use client";
  + import {useEffect,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/messaging-receipt-history-model.test.ts (1 failing)
- bounds page size and does not accept arbitrary filters

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/projects-phase2-restore-action.test.ts (1 failing)
- PR-S2-10 archived project recovery action > wires an optimistic timestamp-bearing restoration from admin summary

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'if (status === "ARCHIVED")'
  - Expected
  + Received
  - if (status === "ARCHIVED")
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/recruiter-chat14-round3.test.ts (4 failing)
- chat-14 recruiter reassigned batch 3 > REC-home-drives-34 retains scoped returnTo and job title, status and applicant-count framing

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain '← Back to Drives'
  - Expected
  + Received
  - ← Back to Drives
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```
- chat-14 recruiter reassigned batch 3 > REC-home-drives-46 represents persisted round status and schedule without inventing slots

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'Date to be decided'
  - Expected
  + Received
  - Date to be decided
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```
- chat-14 recruiter reassigned batch 3 > REC-home-drives-50 uses readable, scoped offer columns and employment outcomes

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'Candidate'
  - Expected
  + Received
  - Candidate
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```
- chat-14 recruiter reassigned batch 3 > REC-home-drives-45 gives an honest empty state when the placement cell has not shared applicants

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'The placement cell has not shared the…'
  - Expected
  + Received
  - The placement cell has not shared the applicants yet
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```

## tests/unit/scheduled-job-runner.test.ts (1 failing)
- DB10 worker executor with existing fenced lease > acquires and verifies storage-backed ownership before job start

  ```
  AssertionError: expected [ 'acquire', 'check', 'work', …(3) ] to deeply equal [ 'acquire', 'check', 'work', …(2) ]
  - Expected
  + Received
  @@ -2,6 +2,7 @@
  "acquire",
  "check",
  "work",
  "renew",
  ```
