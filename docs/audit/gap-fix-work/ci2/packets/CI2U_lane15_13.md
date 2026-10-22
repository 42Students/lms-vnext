# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-batches-bulk-legacy-chat5.test.ts (2 failing)
- TPO batch remaining legacy controls > TPO-batches-43 offers reason presets and enforces a three-character ineligibility reason

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {Textarea} from "@/components/ui/textarea";
  + import {Select} from "@/components/ui/select";
  ```
- TPO batch remaining legacy controls > TPO-batches-62 restores old tab URL aliases without a conflicting dynamic path

  ```
  AssertionError: expected 'import { StackedMetricBar } from "@/c…' to contain 'redirect("/tpo/batches/"+encodeURICom…'
  - Expected
  + Received
  - redirect("/tpo/batches/"+encodeURIComponent(batchId)+"/"+aliases[selected])
  + import { StackedMetricBar } from "@/components/ui/stacked-metric-bar";
  + import batchStyles from "@/components/tpo/legacy-batch-eligibility.module.css";
  + import Link from "next/link";
  + import {tpoBatchReturnHref} from "@/modules/placements/tpo-batch-return-model";
  ```

## tests/unit/tpo-drive-workspace-chat5-round6.test.ts (2 failing)
- chat-5 Drive Workspace next 25+ OPEN gap evidence > TPO-drive-workspace-09 partial or implemented scope is recorded without inferring unsupported parity

  ```
  AssertionError: expected 'import { Dropdown } from "@/component…' to contain 'driveDay.job.company.name + " · " + d…'
  - Expected
  + Received
  - driveDay.job.company.name + " · " + driveDay.job.title
  + import { Dropdown } from "@/components/ui/dropdown";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import type { ReactNode } from "react";
  ```
- chat-5 Drive Workspace next 25+ OPEN gap evidence > TPO-drive-workspace-63 partial or implemented scope is recorded without inferring unsupported parity

  ```
  AssertionError: expected '"use client";\n\nimport { Disclosure …' to contain 'Force exclude'
  - Expected
  + Received
  - Force exclude
  + "use client";
  +
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {
  ```

## tests/unit/tpo-recruiter-access-model.test.ts (3 failing)
- TPO recruiter grant read model > preserves an active grant without inventing a revocation

  ```
  AssertionError: expected { displayName: 'Ananya Rao', …(12) } to deeply equal { displayName: 'Ananya Rao', …(9) }
  - Expected
  + Received
  @@ -2,11 +2,14 @@
  "capabilities": [],
  "companyName": "Example Company",
  "designation": null,
  "displayName": "Ananya Rao",
  ```
- TPO recruiter grant read model > retains historical revoked grants and both dates

  ```
  AssertionError: expected { displayName: 'Recruiter B', …(12) } to deeply equal { displayName: 'Recruiter B', …(9) }
  - Expected
  + Received
  @@ -2,11 +2,14 @@
  "capabilities": [],
  "companyName": "Archived Relationship Ltd",
  "designation": null,
  "displayName": "Recruiter B",
  ```
- TPO recruiter grant read model > shows a safe fallback for a missing display name

  ```
  AssertionError: expected [ Array(13) ] to deeply equal [ 'capabilities', 'companyName', …(8) ]
  - Expected
  + Received
  @@ -2,11 +2,14 @@
  "capabilities",
  "companyName",
  "designation",
  "displayName",
  ```

## tests/unit/tpo-team-search-verification.test.ts (1 failing)
- TPO-inbox-team-19 Team search implementation > TPO-inbox-team-19 keeps search in the URL, debounces after two characters and supports slash focus

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain '},200)'
  - Expected
  + Received
  - },200)
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import {useEffect,useRef} from "react";
  + import {useRouter} from "next/navigation";
  ```

## tests/unit/ux-chat14-hr-01.test.ts (1 failing)
- chat-14 HR UX rollout batch 01 > UX-hr-hr-company-reports-01 retains recruiter UX and safe markup contracts

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

## tests/ux-playbook-compatibility.test.tsx (1 failing)
- UX-PLAYBOOK compatibility and accessibility > UX-PLAYBOOK-15 original DataTable props still work

  ```
  AssertionError: expected '<div data-slot="data-table" class="mi…' to contain 'sm:table-row'
  Expected: "sm:table-row"
  Received: "<div data-slot="data-table" class="min-w-0"><div data-slot="scroll-cue" data-axis="x" data-scroll-start="false" data-scroll-end="false" class="relative min-w-0 min-w-0 md:rounded-[var(--lms-radius-md)] md:border md:border-[var(--lms-canvas-border)]"><div tabindex="-1" class="min-w-0 overf
  ```
