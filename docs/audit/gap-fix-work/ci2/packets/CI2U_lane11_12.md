# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-placements-chat7-not-open-groups.test.ts (1 failing)
- legacy learner drive browse sections > LEARNER-placements-15 groups unavailable cards without hiding recorded applications

  ```
  AssertionError: expected '"use client";\n\nimport { useCallback…' to contain 'item.canApply||item.application!==nul…'
  - Expected
  + Received
  - item.canApply||item.application!==null||item.deadlinePassed
  + "use client";
  +
  + import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
  + import {Disclosure} from "@/components/ui/disclosure";
  ```

## tests/unit/mentor-project-order.test.ts (1 failing)
- uses stable id for matching titles and times

  ```
  AssertionError: expected 0 to be less than 0
  ❯ tests/unit/mentor-project-order.test.ts:5:97
  3| it("sorts by latest update",()=>expect([...p].sort((a,b)=>c(a,b,"RECEN…
  4| it("supports title order with archived last",()=>expect([...p].sort((a…
  5| it("uses stable id for matching titles and times",()=>expect(c({...p[0…
  |                                                                                                 ^
  ```

## tests/unit/placement-report-model.test.ts (2 failing)
- placement report aggregations > counts distinct placed learners instead of counting offers as people

  ```
  AssertionError: expected 33.3 to be 33 // Object.is equality
  - Expected
  + Received
  - 33
  + 33.3
  ```
- placement report aggregations > returns truthful empty and denominator-zero results

  ```
  AssertionError: expected { drives: +0, liveDrives: +0, …(22) } to match object { drives: +0, registered: +0, …(6) }
  (16 matching properties omitted from actual)
  - Expected
  + Received
  @@ -2,9 +2,9 @@
  "applications": 0,
  "averagePackageInr": null,
  "drives": 0,
  ```

## tests/unit/public-auth-round3-gap-verification.test.ts (2 failing)
- Public login and session round-three verified closure > PUB-auth-public-14 leaves unusable OTP screen open with immediate resend

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'This code can\'t be used any more. As…'
  - Expected
  + Received
  - This code can't be used any more. Ask for a new one to continue.
  + "use client";
  +
  + import { useEffect, useRef, useState } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- Public login and session round-three verified closure > PUB-auth-public-18 never caches domain lookup outages as unknown tenants

  ```
  AssertionError: expected 'import { headers } from "next/headers…' to contain 'We couldn&apos;t confirm this college…'
  - Expected
  + Received
  - We couldn&apos;t confirm this college right now
  + import { headers } from "next/headers";
  + import type { Metadata } from "next";
  + import { redirect } from "next/navigation";
  + import { safeReturnTo } from "@/lib/return-to";
  ```

## tests/unit/recruiter-home-drives-chat7-tab-legacy.test.ts (2 failing)
- Recruiter Home Drives legacy recruiter tabs > REC-home-drives-55 orders overview, applicant, round, offer, request and discussion tabs

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain '["overview", "applicants", "rounds", …'
  - Expected
  + Received
  - ["overview", "applicants", "rounds", "offers"]
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```
- Recruiter Home Drives legacy recruiter tabs > REC-home-drives-20 preserves the originating Drives filters on workspace tabs

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

## tests/unit/super-admin-legacy-wording.test.ts (1 failing)
- Super Admin legacy label fixes that do not orphan pages (superAdminNavigationMenuFlat) > page headings use the legacy titles

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'title="Overview"'
  - Expected
  + Received
  - title="Overview"
  + import Link from "next/link";
  + import {getSuperAdminCollegeAtGlance} from "@/modules/colleges/admin-college-at-glance-service";
  + import {CollegeAtGlancePanel} from "@/components/admin/college-at-glance-panel";
  + import {getSuperAdminTodayBoard} from "@/modules/colleges/admin-today-attention-service";
  ```
