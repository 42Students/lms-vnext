# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-student-placement-lookup-runtime.test.ts (2 failing)
- Super Admin placement lookup — real service orchestration of bounded rows > SA-STUDENT-LOOKUP-PLACED-04 preserves joined history beyond the visible cap and excludes a 16th learner

  ```
  AssertionError: expected [ { …(8) }, { …(8) }, { …(8) }, …(7) ] to have a length of 15 but got 10
  - Expected
  + Received
  - 15
  + 10
  ```
- Super Admin placement lookup — real service orchestration of bounded rows > SA-STUDENT-LOOKUP-CAP-04 does not warn for exactly 15 learners or 100 application records

  ```
  AssertionError: expected [ { …(8) }, { …(8) }, { …(8) }, …(7) ] to have a length of 15 but got 10
  - Expected
  + Received
  - 15
  + 10
  ```

## tests/unit/chat13-superadmin-hiring-funnel.test.ts (1 failing)
- Super Admin Analytics > GR-71 displays filtered-empty reporting state and reset action

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'No hiring results match these filters.'
  - Expected
  + Received
  - No hiring results match these filters.
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
  ```

## tests/unit/chat15-course-state-and-staff-optout.test.ts (1 failing)
- chat15 learner recoverability and staff applications > LEARNER-course-detail-19 preserves lessons when assessment state fails and supports retry

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'Some course state could not be loaded'
  - Expected
  + Received
  - Some course state could not be loaded
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import type {ComponentProps} from "react";
  + import progressStyles from "./learner-course-progress.module.css";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/chat16-auth-form-ssr-accessibility-13.test.ts (1 failing)
- chat-16 OTP form real SSR accessibility and tenant channel contracts > AUTH-FORM-UX-01 renders reachable email and phone tabs with one active selected method

  ```
  AssertionError: expected '<div class="login-form w-full max-w-m…' to contain 'Continue'
  Expected: "Continue"
  Received: "<div class="login-form w-full max-w-md" data-step="contact" role="region" aria-label="Sign in to IIT Dharwad"><h1 class="m-0 text-[30px] font-semibold leading-10 tracking-tight text-[var(--lms-heading)]">Sign in</h1><p class="mt-1 text-sm text-muted-foreground leading-[22px]">Use your reg
  ```

## tests/unit/chat16-inbound-mail-status-route-16.test.ts (1 failing)
- chat-16 private inbound-mail status route > inbound-mail-route-17 maps an optimistic conflict to a 409 without a fake success

  ```
  AssertionError: expected 500 to be 409 // Object.is equality
  - Expected
  + Received
  - 409
  + 500
  ```

## tests/unit/chat16-public-auth-role-journeys-02.test.ts (2 failing)
- chat-16 public auth and invitation page journeys > UX-legacy-auth-02 retires old cross-domain handoff and privileged test login

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'redirect("/?auth=handoff-retired")'
  - Expected
  + Received
  - redirect("/?auth=handoff-retired")
  + import { redirect } from "next/navigation";
  + import { safeReturnTo } from "@/lib/return-to";
  +
  + /**
  ```
- chat-16 public auth and invitation page journeys > UX-campaign-unsubscribe-02 GET must never opt out without explicit POST

  ```
  AssertionError: expected 'import { Card } from "@/components/ui…' to contain 'Opening this link does not unsubscrib…'
  - Expected
  + Received
  - Opening this link does not unsubscribe you
  + import { Card } from "@/components/ui/card";
  + import {CampaignUnsubscribeConfirm} from "@/components/placements/campaign-unsubscribe-confirm";
  +
  + export default async function CampaignUnsubscribe({
  ```
