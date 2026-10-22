# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-project-tab-href-model.test.ts (1 failing)
- learner Project tab transitions > keeps validated filters but not transient modal/older-page cursor

  ```
  AssertionError: expected '/learn/projects/11111111-1111-4111-81…' not to contain 'taskId='
  Expected: "taskId="
  Received: "/learn/projects/11111111-1111-4111-8111-111111111111?tab=team&taskSearch=review&taskStatus=BLOCKED&activityCategory=TASKS&taskId=11111111-1111-4111-8111-111111111111&activityBeforeTime=2026-10-15"
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

## tests/unit/pub-auth-public-41-invite-send.test.ts (1 failing)
- PUB-auth-public-41 REC-calendar-messages-profile-38 invitation send-code > limits code requests per token and college

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/recruiter-home-drives-chat7-acceptance.test.ts (3 failing)
- Recruiter Home Drives source contracts > REC-home-drives-26 preserves the verified recruiter drive behavior

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'Off campus'
  - Expected
  + Received
  - Off campus
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { useToast } from "@/components/ui/toast";
  ```
- Recruiter Home Drives source contracts > REC-home-drives-35 preserves the verified recruiter drive behavior

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'Joining'
  - Expected
  + Received
  - Joining
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```
- Recruiter Home Drives source contracts > REC-home-drives-42 uses the native modal drawer for URL-selected applicant review

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'modal.showModal()'
  - Expected
  + Received
  - modal.showModal()
  + "use client";
  +
  + import { useEffect, useId, useRef, type ReactNode, type RefObject, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/super-admin-db10-private-api-cache.test.ts (1 failing)
- private DB10 admin reads > returns no-store on src/app/api/announcements/admin/route.ts

  ```
  AssertionError: expected 'import { NextResponse } from "next/se…' to match /return NextResponse\.json\((page|issu…/
  - Expected:
  /return NextResponse\.json\((page|issue),\s*\{\s*headers:\s*\{\s*"cache-control":\s*"private, no-store"/
  + Received:
  "import { NextResponse } from \"next/server\";
  import { getCurrentRequestContext } from \"@/auth/request-context\";
  import { isSameOriginRequest } from \"@/auth/origin\";
  import { announcementApiError } from \"@/lib/announcement-api-error\";
  ```

## tests/unit/tpo-batches-43-chat5.test.ts (1 failing)
- TPO learner override parity > TPO-batches-43 shows the exact six private ineligibility reasons and guarded Undo

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain '>Other</button>'
  - Expected
  + Received
  - >Other</button>
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {Textarea} from "@/components/ui/textarea";
  + import {Select} from "@/components/ui/select";
  ```

## tests/unit/tpo-drive-workspace-72-chat5.test.ts (1 failing)
- TPO drive mobile action layout > TPO-drive-workspace-72 renders collapsed mobile Actions and responsive applicant cards

  ```
  AssertionError: expected 'import { Dropdown } from "@/component…' to contain 'aria-label="Drive actions"'
  - Expected
  + Received
  - aria-label="Drive actions"
  + import { Dropdown } from "@/components/ui/dropdown";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import type { ReactNode } from "react";
  ```

## tests/unit/tpo-policy-validation.test.ts (1 failing)
- DB09-A V162 TPO placement settings validation > allows legacy placement counting stages and partial rule updates

  ```
  ZodError: [
  {
  "code": "invalid_value",
  "values": [
  "OFFER_RELEASED",
  "OFFER_ACCEPTED"
  ],
  "path": [
  ```
