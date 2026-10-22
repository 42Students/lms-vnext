# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-published-drive-edit-runtime-conflict.test.ts (3 failing)
- SA-placements-projects-13-409 real service conflict classification > classifies a stale selected-college version as typed 409 before update or audit

  ```
  AssertionError: expected ZodError: [
  {
  "expected": "string",… { …(2) } to match object { code: 'PLACEMENT_JOB_STALE' }
  (2 matching properties omitted from actual)
  - Expected
  + Received
  - {
  -   "code": "PLACEMENT_JOB_STALE",
  ```
- SA-placements-projects-13-409 real service conflict classification > accepts offset-equivalent version instants rather than inventing a stale conflict

  ```
  AssertionError: expected ZodError: [
  {
  "expected": "string",… { …(2) } to match object { Object (code) }
  (2 matching properties omitted from actual)
  - Expected
  + Received
  - {
  -   "code": "PLACEMENT_JOB_INVALID_DEADLINE",
  ```
- SA-placements-projects-13-409 real service conflict classification > blocks a recently revoked actor before any drive selection or mutation

  ```
  AssertionError: expected [Function] to throw error including 'FORBIDDEN' but got '[\n  {\n    "expected": "string",\n  …'
  - Expected
  + Received
  - FORBIDDEN
  + [
  +   {
  +     "expected": "string",
  +     "code": "invalid_type",
  ```

## tests/unit/chat13-superadmin-drive-pipeline.test.ts (1 failing)
- Super Admin per-drive pipeline > SA-placements-projects-18 binds every read to an authorized job and submitted applications

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain '<SuperAdminDrivePipeline rows={pipeli…'
  - Expected
  + Received
  - <SuperAdminDrivePipeline rows={pipeline} />
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Banner } from "@/components/ui/banner";
  + import { ErrorState } from "@/components/ui/error-state";
  ```

## tests/unit/chat15-assessment-legacy-copy.test.ts (1 failing)
- chat-15 reassigned learner assessment legacy copy > LEARNER-learning-misc-29 shows quiz and Submitted pills with the submitted quiz names

  ```
  AssertionError: expected '"use client";\nimport { StatTile } fr…' to contain 'Submitted</summary>'
  - Expected
  + Received
  - Submitted</summary>
  + "use client";
  + import { StatTile } from "@/components/ui/stat-tile";
  + import styles from "./learner-assessment-metrics.module.css";
  + import { AssessmentMetricGlyph } from "./learner-assessment-metric-glyph";
  ```

## tests/unit/chat15-recruiter-tracker-route-matrix-41.test.ts (6 failing)
- UX-CHAT15-ROUTES-41 HR, recruiter and tracker access and state matrix > HR-ROUTE-GATE-41 placements/jobs/[jobId] checks authenticated active recruiter before private reads

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'redirect("/dashboard")'
  - Expected
  + Received
  - redirect("/dashboard")
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```
- UX-CHAT15-ROUTES-41 HR, recruiter and tracker access and state matrix > HR-ROUTE-GATE-41 profile checks authenticated active recruiter before private reads

  ```
  AssertionError: expected 'import { DataTable } from "@/componen…' to contain 'redirect("/dashboard")'
  - Expected
  + Received
  - redirect("/dashboard")
  + import { DataTable } from "@/components/ui/data-table";
  + import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";
  + import { z } from "zod";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```
- UX-CHAT15-ROUTES-41 HR, recruiter and tracker access and state matrix > HR-ALIAS-LEGACY-41 old recruiter root and college selector do not expose independent workspaces

  ```
  AssertionError: expected 'import {redirect} from "next/navigati…' to contain 'redirect("/hr/home")'
  - Expected
  + Received
  - redirect("/hr/home")
  + import {redirect} from "next/navigation";
  + /** Preserve the legacy recruiter entrypoint while using the canonical Today workspace. */
  + export default function RecruiterIndex(){redirect("/recruiter/home");}
  +
  ```
- UX-CHAT15-ROUTES-41 HR, recruiter and tracker access and state matrix > HR-FILTER-RECOVERY-41 activity, messages, drives, rounds and company reports expose recoverable invalid filters

  ```
  AssertionError: expected 'import inboxStyles from "@/components…' to contain 'Invalid conversation filters.'
  - Expected
  + Received
  - Invalid conversation filters.
  + import inboxStyles from "@/components/hr/recruiter-conversations-legacy.module.css";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import { Tabs } from "@/components/ui/tabs";
  ```
- UX-CHAT15-ROUTES-41 HR, recruiter and tracker access and state matrix > TRACKER-ADMIN-ROLE-41 logs denies ordinary reporters before private database lookup

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'redirect("/dashboard")'
  - Expected
  + Received
  - redirect("/dashboard")
  + import Link from "next/link";
  + import type { Metadata } from "next";
  + import { Tabs } from "@/components/ui/tabs";
  +
  ```
- UX-CHAT15-ROUTES-41 HR, recruiter and tracker access and state matrix > TRACKER-REPORTER-41 reporter self pages enforce live session and do not expose admin issue lists

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' to contain 'redirect("/dashboard")'
  - Expected
  + Received
  - redirect("/dashboard")
  + import { Banner } from "@/components/ui/banner";
  + import { ErrorState } from "@/components/ui/error-state";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/chat16-inbound-mail-double-submit-16.test.ts (1 failing)
- chat-16 inbound-mail exactly-once browser action guards > inbound-mail-double-submit-18 wires the same-tick gate into client CAS and releases it on failure

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'disabled={busy}'
  - Expected
  + Received
  - disabled={busy}
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import Link from "next/link";
  + import {useRouter} from "next/navigation";
  ```

## tests/unit/chat16-outbound-provider-adapters-16.test.ts (3 failing)
- chat-16 isolated outbound provider adapters > messaging-provider-17 sends only a configured campaign email and reports provider acceptance, not delivery

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
- chat-16 isolated outbound provider adapters > messaging-provider-22 sends normalized recipient addresses rather than caller-supplied whitespace or case

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
- chat-16 isolated outbound provider adapters > messaging-provider-19 fails closed for upstream 429 and rejected requests without ambiguous POST retry

  ```
  AssertionError: expected "vi.fn()" to be called 2 times, but got 0 times
  ❯ tests/unit/chat16-outbound-provider-adapters-16.test.ts:94:21
  92|   await expect(provider.send(email)).resolves.toBe(false);
  93|   await expect(provider.send(email)).resolves.toBe(false);
  94|   expect(fetchMock).toHaveBeenCalledTimes(2);
  |                     ^
  95|  });
  96|  it("messaging-provider-20 requires a registered SMS DLT configuration…
  ```
