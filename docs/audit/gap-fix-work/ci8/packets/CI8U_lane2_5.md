# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/recruiter-chat14-round4-ownership-private-review.test.ts (1 failing)
- chat-14 recruiter ownership and private review gap closure > REC-home-drives-46 keeps inline legacy round controls and counts stage decisions

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

## tests/unit/tpo-verification-review-surface.test.ts (1 failing)
- TPO-requests-verification-19 > keeps exact legacy TPO verification title, subtitle and actions

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'legacyTpoCopy?"Verification":"Profile…'
  - Expected
  + Received
  - legacyTpoCopy?"Verification":"Profile verification"
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { DataTable } from "@/components/ui/data-table";
  + import {useEffect,useMemo,useState} from "react";
  ```
