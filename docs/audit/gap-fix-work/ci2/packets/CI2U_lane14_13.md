# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-batches-61-chat5.test.ts (1 failing)
- batch overview undo discovery > TPO-batches-61 shows a discoverable header undo with current decision tooltip

  ```
  AssertionError: expected -1 to be greater than 0
  ❯ tests/unit/tpo-batches-61-chat5.test.ts:9:18
  7|   const undo=s.indexOf("Undo last decision",header);
  8|   const sections=s.indexOf('<section aria-label="Batch eligibility sna…
  9|   expect(header).toBeGreaterThan(0);
  |                  ^
  10|   expect(undo).toBeGreaterThan(header);
  11|   expect(undo).toBeLessThan(sections);
  ```

## tests/unit/tpo-drive-workspace-chat5-next-round.test.ts (2 failing)
- Drive Workspace next-round graceful action and mobile parity > TPO-drive-workspace-72 uses a keyboard-accessible mobile section picker with desktop tabs intact

  ```
  AssertionError: expected '"use client";\nimport { Dropdown } fr…' to contain 'sm:hidden'
  - Expected
  + Received
  - sm:hidden
  + "use client";
  + import { Dropdown } from "@/components/ui/dropdown";
  + import { Select } from "@/components/ui/select";
  + import { Tabs } from "@/components/ui/tabs";
  ```
- Drive Workspace next-round graceful action and mobile parity > GR-35 GR-90 GR-91 uses an explicit check and announced error for offer confirmations

  ```
  AssertionError: expected '"use client";\nimport { Checkbox } fr…' to contain 'type="checkbox"'
  - Expected
  + Received
  - type="checkbox"
  + "use client";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Textarea } from "@/components/ui/textarea";
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

## tests/ux-color-contrast.test.ts (1 failing)
- UX-AUDIT B-01/B-05/B-06 canonical LMS AA pairings > UX-PLAYBOOK-12 both themes keep a white on-primary semantic on the solid teal button

  ```
  AssertionError: expected '@import "tailwindcss";\n@source not "…' to contain '--lms-link-text: #0e7c87'
  - Expected
  + Received
  - --lms-link-text: #0e7c87
  + @import "tailwindcss";
  + @source not "../../docs";
  + @source not "../../scripts";
  + @source not "../../tests";
  ```
