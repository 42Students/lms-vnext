# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-super-admin-hiring-export-route.test.ts (1 failing)
- SA-HIRING-EXPORT-13 protected Super Admin CSV route > serves a valid bounded export with private no-cache headers and zero modifications

  ```
  AssertionError: expected 500 to be 200 // Object.is equality
  - Expected
  + Received
  - 200
  + 500
  ```

## tests/unit/chat13-superadmin-student-lookup.test.ts (4 failing)
- Super Admin placement lookup > SA-placements-projects-09 supports tenant-scoped name, roll, email search and application outcomes

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'lookupCollegeStudentPlacement(ctx,que…'
  - Expected
  + Received
  - lookupCollegeStudentPlacement(ctx,query)
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  ```
- Super Admin placement lookup > GR-71 lookup has actionable no-match and no-college states

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'No matching college students.'
  - Expected
  + Received
  - No matching college students.
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  ```
- Super Admin placement lookup > GR-73 lookup query persists during search

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'defaultValue={q}'
  - Expected
  + Received
  - defaultValue={q}
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  ```
- Super Admin placement lookup > GR-76 lookup validates search length and explains no matches

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'minLength={3} maxLength={150}'
  - Expected
  + Received
  - minLength={3} maxLength={150}
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  ```

## tests/unit/chat15-final-sprint-tpo-batches-44.test.ts (1 failing)
- TPO-batches-44 batch learner actions > TPO-batches-44 provides all five named ready-message templates on the scoped batch page

  ```
  AssertionError: expected [ 'Register', 'Upload resume', …(4) ] to include 'Register for placements'
  ❯ tests/unit/chat15-final-sprint-tpo-batches-44.test.ts:10:19
  8|   const labels=Object.values(tpoStudentNudgeLabels);
  9|   for(const name of ["Register for placements","Upload resume","Comple…
  10|    expect(labels).toContain(name);
  |                   ^
  11|   const page=src("src/app/(authenticated)/tpo/batches/[batchId]/studen…
  12|   expect(page).toContain("TpoStudentNudgePanel");
  ```

## tests/unit/chat16-campaign-unsubscribe-ssr-pages-16.test.ts (3 failing)
- chat-16 public campaign unsubscribe server pages > UX-campaign-unsubscribe-page-16 never persists suppression on GET and shows a separate explicit confirmation

  ```
  AssertionError: expected "vi.fn()" to be called once with arguments: [ 'signed-token-value' ]
  Number of calls: 0
  ❯ tests/unit/chat16-campaign-unsubscribe-ssr-pages-16.test.ts:26:40
  24|  it("UX-campaign-unsubscribe-page-16 never persists suppression on GET…
  25|   const html=renderToStaticMarkup(await page());
  26|   expect(campaignUnsubscribeTokenKind).toHaveBeenCalledExactlyOnceWith…
  |                                        ^
  27|   expect(html).toContain("Opening this link does not unsubscribe you");
  ```
- chat-16 public campaign unsubscribe server pages > UX-campaign-unsubscribe-page-18 invalid or expired tokens never render any enabled confirmation

  ```
  AssertionError: expected '<main class="flex min-h-dvh w-full mi…' to contain 'This confirmation link is invalid or …'
  Expected: "This confirmation link is invalid or expired. No preference was changed."
  Received: "<main class="flex min-h-dvh w-full min-w-0 items-center justify-center bg-[#f5f7f9] p-4"><div class="w-full max-w-[440px]"><section data-slot="card" class="min-w-0 rounded-[var(--lms-radius-card)] border border-[var(--lms-canvas-border)] bg-[var(--lms-surface)] p-[var(--lms-space-4)] text
  ```
- chat-16 public campaign unsubscribe server pages > UX-campaign-unsubscribe-page-19 transient verifier errors render Retry without exposing provider data

  ```
  AssertionError: expected '<main class="flex min-h-dvh w-full mi…' to contain 'We couldn&#x27;t check this confirmat…'
  Expected: "We couldn&#x27;t check this confirmation link right now."
  Received: "<main class="flex min-h-dvh w-full min-w-0 items-center justify-center bg-[#f5f7f9] p-4"><div class="w-full max-w-[440px]"><section data-slot="card" class="min-w-0 rounded-[var(--lms-radius-card)] border border-[var(--lms-canvas-border)] bg-[var(--lms-surface)] p-[var(--lms-space-4)] text
  ```

## tests/unit/chat16-mentor-draft-recovery-round3.test.ts (2 failing)
- chat-16 mentor editor draft recovery > MEN-projects-meetings-75 requires confirmation before discarding task and sprint drafts

  ```
  AssertionError: expected '"use client";\n\nimport { useState } …' to contain 'You have unsaved project changes. Lea…'
  - Expected
  + Received
  - You have unsaved project changes. Leave this page and discard them?
  + "use client";
  +
  + import { useState } from "react";
  + import { Select } from "@/components/ui/select";
  ```
- chat-16 mentor editor draft recovery > MEN-projects-meetings-76 keeps task, sprint, meeting and delivery errors friendly

  ```
  AssertionError: expected 'export function ScheduleProjectMeetin…' to contain 'Could not schedule this meeting. Revi…'
  - Expected
  + Received
  - Could not schedule this meeting. Review its latest details and try again.
  + export function ScheduleProjectMeetingControl({
  +   projectId,
  +   projectUpdatedAt,
  +   meeting,
  ```

## tests/unit/chat16-public-join-delivery-recovery-29.test.ts (1 failing)
- chat-16 public recruiter OTP accepted before optional company hint > REC-JOIN-DELIVERY-10 returns success after delivered challenge even when optional company lookup fails

  ```
  PublicJoinCodeError: PUBLIC_JOIN_INVALID_LINK
  ❯ Module.requestPublicJoinCode src/modules/placements/public-join/send-code-service.ts:85:11
  83|     !companyJoinEmailCandidate(email,[availableLink.domain??"",
  84|       ...preflightVerified.map(item=>item.domain)])))
  85|     throw new PublicJoinCodeError("INVALID_LINK");
  |           ^
  86|   // The token is checked before DNS to avoid an anonymous domain orac…
  87|   // Legacy company-domain checks query the registrable company domain…
  ```
