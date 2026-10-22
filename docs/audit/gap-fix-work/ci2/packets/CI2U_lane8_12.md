# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-placements-chat7-followup.test.ts (1 failing)
- Chat-7 learner placements follow-up > LEARNER-placements-04 never masks missing actionable tasks

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-label="Waiting on you"'
  - Expected
  + Received
  - aria-label="Waiting on you"
  + import Link from "next/link";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import type { learnerPlacementDashboard } from "@/modules/placements/learner-dashboard-model";
  ```

## tests/unit/learner-withdrawal-source-contract.test.ts (2 failing)
- Learner withdrawal UX and backend write contracts > requires explicit reason-bearing confirmation in the existing Applications drawer

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'Confirm application withdrawal'
  - Expected
  + Received
  - Confirm application withdrawal
  + "use client";
  +
  + import Link from "next/link";
  + import { useCallback, useEffect, useRef, useState } from "react";
  ```
- Learner withdrawal UX and backend write contracts > rechecks same origin, Zod and persisted active role/college within audited transaction

  ```
  AssertionError: expected 'import {\n  and,\n  asc,\n  desc,\n  …' to contain 'learnerWithdrawalReasonSchema.optiona…'
  - Expected
  + Received
  - learnerWithdrawalReasonSchema.optional().parse(reasonInput)
  + import {
  +   and,
  +   asc,
  +   desc,
  ```

## tests/unit/outbound-provider-sid-hygiene.test.ts (4 failing)
- SMS provider opaque receipt hygiene > rejects unsafe provider SID

  ```
  
  ```
- SMS provider opaque receipt hygiene > rejects unsafe provider SID

  ```
  
  ```
- SMS provider opaque receipt hygiene > rejects unsafe provider SID

  ```
  
  ```
- SMS provider opaque receipt hygiene > rejects unsafe provider SID

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/public-auth-chooser-graceful-gap.test.ts (2 failing)
- public account chooser and failure handling > PUB-auth-public-08 restores last used active college as radio default

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useEffec…' to contain 'setSelectedId(memberships.some'
  - Expected
  + Received
  - setSelectedId(memberships.some
  + "use client";
  +
  + import {
  +   useEffect,
  ```
- public account chooser and failure handling > GR-91 retry and recovery buttons are keyboard-accessible

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'focus-visible'
  - Expected
  + Received
  - focus-visible
  + "use client";
  +
  + import Link from "next/link";
  + import { Button } from "@/components/ui/button";
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

## tests/unit/super-admin-colleges-navigation-parity.test.ts (2 failing)
- College setup links across responsive views > renders scoped tenant setup links in desktop and mobile

  ```
  AssertionError: expected 0 to be greater than or equal to 1
  ❯ tests/unit/super-admin-colleges-navigation-parity.test.ts:6:51
  4| describe("College setup links across responsive views",()=>{
  5|  it("renders scoped tenant setup links in desktop and mobile",()=>{
  6|   expect((src.match(/Tenant setup/g)||[]).length).toBeGreaterThanOrEqu…
  |                                                   ^
  7|   expect(src).toContain('mobilePriority: "action"');
  8|   expect(src).toContain("<DataTable columns={columns} rows={visible}");
  ```
- College setup links across responsive views > has both branding and readiness in mobile cards

  ```
  AssertionError: expected ',\n    header: "Actions",\n    classN…' to contain 'Tenant setup'
  - Expected
  + Received
  - Tenant setup
  + ,
  +     header: "Actions",
  +     className: "text-right",
  +     cell: (college) => (
  ```
