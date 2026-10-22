# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-team-search-verification.test.ts (1 failing)
- TPO-inbox-team-19 Team search implementation > TPO-inbox-team-19 keeps search in the URL, debounces after two characters and supports slash focus

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain '<TpoTeamSearch value={search}/>'
  - Expected
  + Received
  - <TpoTeamSearch value={search}/>
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/ux-chat14-hr-02.test.ts (2 failing)
- chat-14 HR UX rollout batch 02 > UX-hr-hr-drives-jobId-rounds-editor-remove-roundId-01 guards recruiter responsive page source

  ```
  AssertionError: expected 'import {PageBackLink} from "@/compone…' to contain 'min-w-0 max-w-full'
  - Expected
  + Received
  - min-w-0 max-w-full
  + import {PageBackLink} from "@/components/ui/page-back-link";
  + import {notFound,redirect} from "next/navigation";
  + import {z} from "zod";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```
- chat-14 HR UX rollout batch 02 > UX-hr-hr-placements-jobs-jobId-01 guards recruiter responsive page source

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain '<DataTable'
  - Expected
  + Received
  - <DataTable
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```
