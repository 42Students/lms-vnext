# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-recruiter-email-digest-live-grant-16.test.ts (4 failing)
- chat-16 recruiter digest scheduler live authorization > email-bridge-digest-worker-16 is inert when a verified bridge is not enabled

  ```
  AssertionError: promise rejected "Error: [vitest] No "recruiterDigestReadin… { codeFrame: '…' }" instead of resolving
  ❯ tests/unit/chat16-recruiter-email-digest-live-grant-16.test.ts:60:10
  58|   await expect(dispatchRecruiterUnreadMessageDigests({
  59|    ...env,RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED:"false",
  60|   },now)).resolves.toEqual({examined:0,sent:0,enabled:false});
  |          ^
  61|   expect(getDb).not.toHaveBeenCalled();
  62|   expect(sendRecruiterMessageDigest).not.toHaveBeenCalled();
  ```
- chat-16 recruiter digest scheduler live authorization > email-bridge-digest-worker-17 denies weak secrets and auth template reuse before storage

  ```
  AssertionError: promise rejected "Error: [vitest] No "recruiterDigestReadin… { codeFrame: '…' }" instead of resolving
  ❯ tests/unit/chat16-recruiter-email-digest-live-grant-16.test.ts:70:68
  68|    {...env,RECRUITER_MESSAGE_DIGEST_TEMPLATE_KEY:"auth.otp"},
  69|   ]){
  70|    await expect(dispatchRecruiterUnreadMessageDigests(options,now))
  |                                                                    ^
  71|     .resolves.toMatchObject({examined:0,sent:0,enabled:false});
  72|   }
  ```
- chat-16 recruiter digest scheduler live authorization > email-bridge-digest-worker-18 denies a grant revoked after the initial due-list snapshot

  ```
  Error: [vitest] No "recruiterDigestReadiness" export is defined on the "@/modules/placements/recruiter-message-email-provider" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/placements/recruiter-message-email-provider"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- chat-16 recruiter digest scheduler live authorization > email-bridge-digest-worker-19 does not retrieve message body before in-transaction current grant check

  ```
  Error: [vitest] No "recruiterDigestReadiness" export is defined on the "@/modules/placements/recruiter-message-email-provider" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/placements/recruiter-message-email-provider"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```

## tests/unit/chat17-auth-http-hardening.test.ts (1 failing)
- WEAK-auth HTTP: guard ordering, errors and no PII logs > WEAK-auth-http-06 auth errors expose safe code/retry only and hide exception text

  ```
  AssertionError: expected { error: 'TOO_MANY_REQUESTS', …(2) } to deeply equal { error: 'TOO_MANY_REQUESTS', …(1) }
  - Expected
  + Received
  {
  "error": "TOO_MANY_REQUESTS",
  +   "message": "Too many OTP requests. Please try again later.",
  "retryAfterSeconds": 37,
  }
  ```

## tests/unit/chat19-sidebar-navigation-aliases.test.ts (1 failing)
- chat-19 recruiter sidebar active route aliases > highlights canonical menu rows on the legacy recruiter portal aliases

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat2-company-team-reachability.test.ts (1 failing)
- Company-scoped Team discussion navigation > TPO-companies-05 offers Open in Team from both canonical detail and company memory, not an unscoped name lookup

  ```
  AssertionError: expected '"use client";\nimport { PageBackLink …' to contain 'company.canonicalCompanyId?<Link'
  - Expected
  + Received
  - company.canonicalCompanyId?<Link
  + "use client";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Badge } from "@/components/ui/badge";
  ```

## tests/unit/chat2-public-placements-heading-parity.test.ts (2 failing)
- TPO public college placements legacy framing > TPO-campaigns-public-36 renders only the college's actual name, not an invented Placements at prefix

  ```
  AssertionError: expected 'import { headers } from "next/headers…' to contain '{college?.collegeName??"College place…'
  - Expected
  + Received
  - {college?.collegeName??"College placements"}
  + import { headers } from "next/headers";
  + import {notFound} from "next/navigation";
  + import { PublicRecruitFromUs } from "@/components/placements/public-recruit-from-us";
  + import { resolveRequestTenant } from "@/modules/auth/request-tenant";
  ```
- TPO public college placements legacy framing > TPO-campaigns-public-36 retains the verified Recruit from us form and thank-you copy

  ```
  AssertionError: expected '"use client";\nimport { useRef,useSta…' to contain 'aria-label="Recruit from us"'
  - Expected
  + Received
  - aria-label="Recruit from us"
  + "use client";
  + import { useRef,useState } from "react";
  + import { Input } from "@/components/ui/input";
  + import { Textarea } from "@/components/ui/textarea";
  ```

## tests/unit/chat2-tpo-interview-reschedule-route-ui.test.ts (1 failing)
- TPO-drive-workspace-44 guarded reschedule endpoint and error UX > TPO-drive-workspace-44 keeps entered fields and uses ConfirmDialog, not a blocking native prompt or raw error code

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'onConfirm={()=>{setConfirmOpen(false)…'
  - Expected
  + Received
  - onConfirm={()=>{setConfirmOpen(false);void submitConfirmed();}}
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  ```
