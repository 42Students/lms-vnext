# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-team-read-on-open-chat2.test.ts (1 failing)
- TPO Team opens as read without GET mutations > TPO-inbox-team-20 leaves manual retry available when the read pointer cannot be saved

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useS…' to contain 'Use the button below to retry.'
  - Expected
  + Received
  - Use the button below to retry.
  + "use client";
  + import {useEffect,useState} from "react";
  + import {Button} from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  ```

## tests/unit/ux-chat14-high-risk-contracts.test.ts (2 failing)
- chat-14 mentor and HR UX critical page contracts > UX-hr-placements-jobs-jobId-02 distinguishes authorized applicant review, selection and offers

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
- chat-14 mentor and HR UX critical page contracts > UX-hr-company-reports-02 preserves phone cards and accessible desktop data reports

  ```
  AssertionError: expected 'import { SummaryStrip } from "@/compo…' to contain '<DataTable'
  - Expected
  + Received
  - <DataTable
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { Tabs } from "@/components/ui/tabs";
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-report-funnel.module.css";
  ```

## tests/ux-playbook-primitives.test.tsx (3 failing)
- UX playbook shared behaviour > UX-PLAYBOOK-05 exposes mobile cards and semantic desktop table

  ```
  AssertionError: expected '<div data-slot="data-table" class="mi…' to contain 'sm:table-row'
  Expected: "sm:table-row"
  Received: "<div data-slot="data-table" class="min-w-0"><div data-slot="scroll-cue" data-axis="x" data-scroll-start="false" data-scroll-end="false" class="relative min-w-0 min-w-0 md:rounded-[var(--lms-radius-md)] md:border md:border-[var(--lms-canvas-border)]"><div tabindex="-1" class="min-w-0 overf
  ```
- UX playbook shared behaviour > RV-05 B-02 keeps hidden fields in More details without audited column mapping

  ```
  AssertionError: expected '<div data-slot="data-table" class="mi…' to contain 'More details'
  Expected: "More details"
  Received: "<div data-slot="data-table" class="min-w-0"><div data-slot="scroll-cue" data-axis="x" data-scroll-start="false" data-scroll-end="false" class="relative min-w-0 min-w-0 md:rounded-[var(--lms-radius-md)] md:border md:border-[var(--lms-canvas-border)]"><div tabindex="-1" class="min-w-0 overf
  ```
- UX playbook shared behaviour > RV-05 B-02 requires positive per-row detail authority to hide a field

  ```
  AssertionError: expected '<div data-slot="data-table" class="mi…' to contain 'More details'
  Expected: "More details"
  Received: "<div data-slot="data-table" class="min-w-0"><div data-slot="scroll-cue" data-axis="x" data-scroll-start="false" data-scroll-end="false" class="relative min-w-0 min-w-0 md:rounded-[var(--lms-radius-md)] md:border md:border-[var(--lms-canvas-border)]"><div tabindex="-1" class="min-w-0 overf
  ```
