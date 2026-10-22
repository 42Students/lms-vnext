# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-super-admin-history-modal-ux.test.ts (2 failing)
- SA-ADMIN-HISTORY-MODAL-10 accessible college import history > restores focus after Close or native Escape, and maintains modal focus trapping

  ```
  AssertionError: expected '"use client";\n\nimport { useState } …' to contain 'const dialogRef=useRef<HTMLDialogElem…'
  - Expected
  + Received
  - const dialogRef=useRef<HTMLDialogElement>(null)
  + "use client";
  +
  + import { useState } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- SA-ADMIN-HISTORY-MODAL-10 accessible college import history > uses one vertical modal scroller and leaves horizontal table scrolling to the shared DataTable

  ```
  AssertionError: expected '"use client";\n\nimport { useState } …' to contain 'max-h-[calc(100dvh-2rem)] overflow-hi…'
  - Expected
  + Received
  - max-h-[calc(100dvh-2rem)] overflow-hidden
  + "use client";
  +
  + import { useState } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat13-ux-cross-audit-tpo-loading.test.ts (4 failing)
- UX-cross-tpo-second-C13-026-7 slow loading and recovery

  ```
  AssertionError: expected 'import {PageHeader} from "@/component…' to contain 'GracefulPageLoading'
  - Expected
  + Received
  - GracefulPageLoading
  + import {PageHeader} from "@/components/ui/page-header";
  + import {Skeleton} from "@/components/ui/skeleton";
  + export default function LoadingTpoDriveEdit(){
  +  return <div aria-busy="true" className="min-w-0 space-y-4">
  ```
- UX-cross-tpo-second-C13-026-12 slow loading and recovery

  ```
  AssertionError: expected 'import { GracefulPageLoading } from "…' to contain 'Loading your page...'
  - Expected
  + Received
  - Loading your page...
  + import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
  +
  + export default function Loading() {
  +   return <GracefulPageLoading label="Loading applicant share preview" shape="directory" />;
  ```
- UX-cross-tpo-second-C13-026-18 slow loading and recovery

  ```
  AssertionError: expected 'export default function TpoProfileLoa…' to contain 'GracefulPageLoading'
  - Expected
  + Received
  - GracefulPageLoading
  + export default function TpoProfileLoading(){
  +  return <section aria-busy="true" className="min-w-0 space-y-4">
  +   <h1 className="text-xl font-semibold">Your Profile</h1>
  +   <p role="status" className="sr-only">Loading your TPO profile…</p>
  ```
- UX-cross-tpo-second-C13-026-22 slow loading and recovery

  ```
  AssertionError: expected 'import {GracefulPageLoading} from "@/…' to contain 'Loading TPO reports'
  - Expected
  + Received
  - Loading TPO reports
  + import {GracefulPageLoading} from "@/components/ui/graceful-page-loading";
  + export default function TpoReportsLoading(){return <GracefulPageLoading label="Refreshing report…"/>;}
  +
  ```

## tests/unit/chat15-hr-recorded-outside-page-51.test.tsx (1 failing)
- HR-RECORDED-QUERY-51: archived/external drive page session and URL boundaries > one granted college can display a bounded external record form without publishing a job

  ```
  AssertionError: expected '<div class="min-w-0 max-w-full space-…' to contain 'Historical employer-college record on…'
  Expected: "Historical employer-college record only."
  Received: "<div class="min-w-0 max-w-full space-y-4 md:space-y-6"><h1>Record an outside-platform drive</h1><section class="min-w-0 max-w-4xl"><section data-college="123e4567-e89b-42d3-a456-426614174001">Outside-drive form</section></section></div>"
  ```

## tests/unit/chat16-final-col-placements-10.test.ts (1 failing)
- COL-placements-10 needs attention > COL-placements-10 retains four legacy attention categories and stage-specific drilldowns

  ```
  AssertionError: expected '"use client";\nimport Link from "next…' to contain 'tab:"OFFERED"'
  - Expected
  + Received
  - tab:"OFFERED"
  + "use client";
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  + import {useState} from "react";
  ```

## tests/unit/chat16-mentor-tracker-contract-round2.test.ts (2 failing)
- chat-16 reassigned mentor acceptance, round 2 > MEN-projects-meetings-53 displays persisted metadata in both resource editors

  ```
  AssertionError: expected '"use client";\n\nimport {\n  type For…' to contain 'resourceType:metadata.resourceType'
  - Expected
  + Received
  - resourceType:metadata.resourceType
  + "use client";
  +
  + import {
  +   type FormEvent,
  ```
- chat-16 reassigned Tracker acceptance, round 2 > SA-placements-projects-118 keeps logs Super Admin-only, not a password bypass

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

## tests/unit/chat16-public-marketing-forbidden-pages-16.test.tsx (4 failing)
- chat-16 public and auth-adjacent page rendering > UX-chat16-public-home-01 offers functional, named destinations without requiring an account

  ```
  AssertionError: expected { Object (absolute) } to be '42 LMS | Talent development' // Object.is equality
  - Expected:
  "42 LMS | Talent development"
  + Received:
  {
  "absolute": "42 LMS — Learning, Projects and Placements",
  }
  ```
- chat-16 public and auth-adjacent page rendering > UX-chat16-public-universities-02 provides a campus-specific overview and next step

  ```
  AssertionError: expected 'For Universities — 42 LMS' to be 'Universities | 42 LMS' // Object.is equality
  Expected: "Universities | 42 LMS"
  Received: "For Universities — 42 LMS"
  ```
- chat-16 public and auth-adjacent page rendering > UX-chat16-public-enterprises-03 reaches hiring and learning overviews without login

  ```
  AssertionError: expected { Object (absolute) } to be 'Enterprises | 42 LMS' // Object.is equality
  - Expected:
  "Enterprises | 42 LMS"
  + Received:
  {
  "absolute": "For Enterprises — 42 LMS",
  }
  ```
- chat-16 public and auth-adjacent page rendering > UX-chat16-public-demo-04 retains explicit contact and no hidden form submission

  ```
  AssertionError: expected 'Request a Demo — 42 LMS' to be 'Request a demo | 42 LMS' // Object.is equality
  Expected: "Request a demo | 42 LMS"
  Received: "Request a Demo — 42 LMS"
  ```
