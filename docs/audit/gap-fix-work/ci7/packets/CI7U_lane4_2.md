# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-public-auth-role-journeys-02.test.ts (2 failing)
- chat-16 public auth and invitation page journeys > UX-legacy-auth-02 retires old cross-domain handoff and privileged test login

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'redirect("/login")'
  - Expected
  + Received
  - redirect("/login")
  + import { redirect } from "next/navigation";
  +
  + /** Legacy Super Admin bookmark: the shared sign-in handles privileged second factor. */
  + export default function LegacySuperAdminLoginPage() {
  ```
- chat-16 public auth and invitation page journeys > UX-campaign-unsubscribe-02 GET must never opt out without explicit POST

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'if(pendingRef.current)return'
  - Expected
  + Received
  - if(pendingRef.current)return
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {Button} from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  ```

## tests/unit/chat2-public-join-states.test.ts (2 failing)
- Public recruiter invitation parity > TPO-campaigns-public-R03 labels already joined versus first join from server outcome

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'setSignInEmail(result.signInEmail)'
  - Expected
  + Received
  - setSignInEmail(result.signInEmail)
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  +
  + import authStyles from "@/components/public/public-auth-skin.module.css";
  ```
- Public recruiter invitation parity > TPO-campaigns-public-R07 permits approved company subdomains but rejects lookalikes

  ```
  AssertionError: expected 'import {publicWorkEmailIssue,publicWo…' to contain 'matchesCompanyDomain'
  - Expected
  + Received
  - matchesCompanyDomain
  + import {publicWorkEmailIssue,publicWorkEmailIssueCopy} from "@/modules/placements/public-work-email-policy";
  + import {publicRecruiterWorkEmailSchema} from "@/modules/placements/public-college-join-model";
  + /** REC-calendar-messages-profile-R04/39/45: identify recoverable public join errors
  +  * without leaking email existence, verifying the user client-side, or claiming success. */
  ```

## tests/unit/chat4-college-contacts-and-groups-input-hardening.test.ts (1 failing)
- College Admin contact directory and study-group export boundaries > COL-CONTACTS-BOUNDARY-01 rejects exponent, hex, signed, whitespace and fractional URL page controls

  ```
  ZodError: [
  {
  "code": "invalid_union",
  "errors": [
  [
  {
  "expected": "number",
  "code": "invalid_type",
  ```

## tests/unit/chat4-superadmin-organizations-page-journey.test.tsx (1 failing)
- SA-organizations-page-01 real directory permission, filters and restore states > denies duplicate and unknown URL keys before any private tenant directory read

  ```
  AssertionError: expected '<div class="min-w-0 space-y-4 md:spac…' to contain 'Invalid organization directory filters'
  Expected: "Invalid organization directory filters"
  Received: "<div class="min-w-0 space-y-4 md:space-y-6"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header-title-size:20px] md:[-
  ```
