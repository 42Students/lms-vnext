# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat15-hr-legacy-parity-54-55.test.ts (1 failing)
- HR legacy inventory B explicit UNKNOWN routes, source parity audit > HR-PARITY-55 legacy job Requests tab is mapped after the scoped hiring read

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'requestsTab&&requestData?.party==="CO…'
  - Expected
  + Received
  - requestsTab&&requestData?.party==="COMPANY"
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```

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

## tests/unit/chat16-tpo-unsubscribe-live-row-16.test.ts (2 failing)
- chat-16 TPO recipient unsubscribe live row decision > campaign-unsubscribe-service-16 validates purpose-bound HMAC before touching private database

  ```
  AssertionError: expected "vi.fn()" to be called once, but got 0 times
  ❯ tests/unit/chat16-tpo-unsubscribe-live-row-16.test.ts:49:34
  47|   await expect(unsubscribeTpoCampaignRecipient("untrusted"))
  48|    .resolves.toEqual({unsubscribed:true});
  49|   expect(unknown.db.transaction).toHaveBeenCalledOnce();
  |                                  ^
  50|  });
  51|  it("campaign-unsubscribe-service-17 refuses missing campaign recipien…
  ```
- chat-16 TPO recipient unsubscribe live row decision > campaign-unsubscribe-service-18 validates locked college/campaign/recipient identity before changes

  ```
  AssertionError: promise resolved "{ unsubscribed: true }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + {
  +   "unsubscribed": true,
  }
  ```

## tests/unit/chat2-engage-open-gap-decisions.test.ts (1 failing)
- Engage remaining safe and reachable controls > TPO-recruiters-36 has horizontally reachable stages and keyboard-trapped edit dialogs while retaining mobile actions

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useR…' to contain 'modal.showModal()'
  - Expected
  + Received
  - modal.showModal()
  + "use client";
  +
  + import { useId, useRef, type ReactNode, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat2-tpo-last-third-report-failures-joining-runtime.test.tsx (1 failing)
- chat-2 last-third failure and joining outcome report pages > TPO-joining-05 distinguishes pending or unrecorded acceptance from did-not-join events

  ```
  AssertionError: expected '<div data-tpo-presentation-report="tr…' to contain 'sm:grid-cols-2'
  Expected: "sm:grid-cols-2"
  Received: "<div data-tpo-presentation-report="true" class="min-w-0 space-y-4"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header
  ```

## tests/unit/chat3-closure-round13-six.test.ts (3 failing)
- chat-3 final six round13 audited functional closures > TPO-drives-05 displays real persisted lifecycle stages rather than static placeholder

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Where it is: {tpoDriveWhereItIs(job,d…'
  - Expected
  + Received
  - Where it is: {tpoDriveWhereItIs(job,data.asOf)}
  + import Link from "next/link";
  + import { Dropdown } from "@/components/ui/dropdown";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- chat-3 final six round13 audited functional closures > LEARNER-learning-misc-33 distinguishes unassigned, empty week and retriable error

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'No scheduled classes this week.'
  - Expected
  + Received
  - No scheduled classes this week.
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { CalendarGrid } from "@/components/ui/calendar-grid";
  + import calendarStyles from "@/components/placements/legacy-calendar-theme.module.css";
  ```
- chat-3 final six round13 audited functional closures > LEARNER-learning-misc-38 preserves separate no-course/no-record/error messages

  ```
  AssertionError: expected '"use client";\n\nimport { Disclosure …' to contain 'deliveryId ? "No attendance records" …'
  - Expected
  + Received
  - deliveryId ? "No attendance records" : "Select a course"
  + "use client";
  +
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  ```

## tests/unit/chat4-admin-college-session-history-journey.test.ts (1 failing)
- SA-colleges-admins-R01 administrator history tenancy and paging > checks persisted role on administrator session revocation and does not fabricate duplicate audits on retry

  ```
  AssertionError: expected 'export async function revokeCollegeAd…' to contain 'if(rows.rows.length===0)return {revok…'
  - Expected
  + Received
  - if(rows.rows.length===0)return {revoked:0}
  + export async function revokeCollegeAdminSessions(ctx:RequestContext,collegeId:unknown,userId:unknown){
  +  const target=await authorizedTarget(ctx,collegeId,userId);
  +  return getDb().transaction(async tx=>{
  +   await assertPersistedPlatformPermission(tx,ctx,"college.manage",{
  ```

## tests/unit/chat4-college-ux-round1.test.ts (1 failing)
- Chat-4 College UX round one > UX-college-01 preserves narrow-screen content and 44px navigation targets

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '<DataTable rows={lowAttendance.rows}'
  - Expected
  + Received
  - <DataTable rows={lowAttendance.rows}
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeEditDialog } from "@/components/admin/college-edit-dialog";
  + import { CollegeSetupChecklist } from "@/components/admin/college-setup-checklist";
  ```
