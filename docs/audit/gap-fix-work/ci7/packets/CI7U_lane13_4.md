# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/graceful-root-screens.test.ts (1 failing)
- graceful route screens > GR-13 includes not-found paths for each role and public links

  ```
  AssertionError: expected 'import type { Metadata } from "next";…' to contain 'homeHref="/"'
  - Expected
  + Received
  - homeHref="/"
  + import type { Metadata } from "next";
  + import { GracefulScreen } from "@/components/public/graceful-screen";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { getShellNavigation } from "@/components/shell/shell-model";
  ```

## tests/unit/learner-placements-round2-legacy-navigation.test.ts (2 failing)
- Learner Placements legacy request/nav surfaces > LEARNER-placements-46 links announcements and personal updates separately

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' to contain 'href="#college-notices"'
  - Expected
  + Received
  - href="#college-notices"
  + import { Banner } from "@/components/ui/banner";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  ```
- Learner Placements legacy request/nav surfaces > LEARNER-placements-55 provides all three anchored placement cell sections

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' to contain 'id="registration"'
  - Expected
  + Received
  - id="registration"
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { LearnerPlacementOffers } from "@/components/placements/learner-placement-offers";
  ```

## tests/unit/recruiter-chat14-round3.test.ts (1 failing)
- chat-14 recruiter reassigned batch 3 > REC-home-drives-34 retains scoped returnTo and job title, status and applicant-count framing

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'title={workspace.job.title}'
  - Expected
  + Received
  - title={workspace.job.title}
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```

## tests/unit/tpo-drive-header.test.ts (1 failing)
- TPO-drive-workspace-03 header facts > distinguishes request, published, closed, cancelled and declined

  ```
  AssertionError: expected 'Open · Expired' to be 'Published' // Object.is equality
  Expected: "Published"
  Received: "Open · Expired"
  ```
