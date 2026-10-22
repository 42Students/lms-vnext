# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-placements-chat7-legacy-headings-r7.test.ts (1 failing)
- chat-7 learner Placements legacy tabs and hero > LEARNER-placements-03 has no duplicate heading below shared tab strip

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' not to contain '<PageHeader'
  - Expected
  + Received
  - <PageHeader
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Alert } from "@/components/ui/alert";
  + import { PageLoading } from "@/components/ui/page-loading";
  + import {StatusBadge,applicationStatusTone} from "@/components/ui/status-badge";
  ```

## tests/unit/mentor-meetings-chat7-schedule-legacy.test.ts (1 failing)
- Chat-7 mentor meeting legacy parity > MEN-projects-meetings-28 uses the exact legacy ceremony names and save wording

  ```
  AssertionError: expected '"use client";\n\nimport { type FormEv…' to contain 'title: meeting'
  - Expected
  + Received
  - title: meeting
  + "use client";
  +
  + import { type FormEvent, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```

## tests/unit/placement-report-accreditation.test.ts (1 failing)
- accreditation evidence CSV > counts unique placed learners while preserving offer records

  ```
  AssertionError: expected +0 to be 1 // Object.is equality
  - Expected
  + Received
  - 1
  + 0
  ```

## tests/unit/public-auth-login-gap-verification.test.ts (9 failing)
- public sign-in verified gap closure > PUB-auth-public-03 restores registered contact, code and resend labels

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'Get the code by email'
  - Expected
  + Received
  - Get the code by email
  + "use client";
  +
  + import { useEffect, useRef, useState } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- public sign-in verified gap closure > PUB-auth-public-04 uses exact legacy guidance for wrong and expired OTP

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'This code can\'t be used any more. As…'
  - Expected
  + Received
  - This code can't be used any more. Ask for a new one to continue.
  + "use client";
  +
  + import { useEffect, useRef, useState } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- public sign-in verified gap closure > PUB-auth-public-05 uses 42LMS branding tenant title and legal footer

  ```
  AssertionError: expected 'import { headers } from "next/headers…' to contain 'title:"Sign in · "+'
  - Expected
  + Received
  - title:"Sign in · "+
  + import { headers } from "next/headers";
  + import type { Metadata } from "next";
  + import { redirect } from "next/navigation";
  + import { safeReturnTo } from "@/lib/return-to";
  ```
- public sign-in verified gap closure > PUB-auth-public-13 restores an unexpired one-time-code attempt after refresh

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'window.sessionStorage.setItem(ATTEMPT…'
  - Expected
  + Received
  - window.sessionStorage.setItem(ATTEMPT_KEY
  + "use client";
  +
  + import { useEffect, useRef, useState } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- public sign-in verified gap closure > PUB-auth-public-16 displays the college logo or initials monogram fallback

  ```
  AssertionError: expected 'import { headers } from "next/headers…' to contain 'branding?.logoUrl'
  - Expected
  + Received
  - branding?.logoUrl
  + import { headers } from "next/headers";
  + import type { Metadata } from "next";
  + import { redirect } from "next/navigation";
  + import { safeReturnTo } from "@/lib/return-to";
  ```
- public sign-in verified gap closure > PUB-auth-public-17 shows unknown-college recovery instructions and main sign-in link

  ```
  AssertionError: expected 'import { headers } from "next/headers…' to contain 'This address isn&apos;t set up yet'
  - Expected
  + Received
  - This address isn&apos;t set up yet
  + import { headers } from "next/headers";
  + import type { Metadata } from "next";
  + import { redirect } from "next/navigation";
  + import { safeReturnTo } from "@/lib/return-to";
  ```
- public sign-in verified gap closure > PUB-auth-public-25 retains secure superadmin-login legacy bookmark redirect

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'redirect("/")'
  - Expected
  + Received
  - redirect("/")
  + import { redirect } from "next/navigation";
  +
  + /** Legacy Super Admin bookmark: the shared sign-in handles privileged second factor. */
  + export default function LegacySuperAdminLoginPage() {
  ```
- public sign-in verified gap closure > PUB-auth-public-33 recruiter=email legacy invitation opens email first

  ```
  AssertionError: expected 'import { headers } from "next/headers…' to contain 'recruiterValue==="email"&&signin.emai…'
  - Expected
  + Received
  - recruiterValue==="email"&&signin.email?"EMAIL":signin.primary
  + import { headers } from "next/headers";
  + import type { Metadata } from "next";
  + import { redirect } from "next/navigation";
  + import { safeReturnTo } from "@/lib/return-to";
  ```
- public sign-in verified gap closure > PUB-auth-public-37 safely retires legacy handoff tokens by redirecting to fresh login

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

## tests/unit/recruiter-home-drives-chat7-r7.test.ts (2 failing)
- chat-7 recruiter home and drives round 7 > REC-home-drives-34 confirms the audited source behavior

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain '← Back to Drives'
  - Expected
  + Received
  - ← Back to Drives
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```
- chat-7 recruiter home and drives round 7 > REC-home-drives-50 confirms the audited source behavior

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'Reply by'
  - Expected
  + Received
  - Reply by
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```

## tests/unit/super-admin-db10-private-api-cache.test.ts (1 failing)
- private DB10 admin reads > returns no-store on src/app/api/announcements/admin/route.ts

  ```
  AssertionError: expected 'import { NextResponse } from "next/se…' to match /return NextResponse\.json\((page|issu…/
  - Expected:
  /return NextResponse\.json\((page|issue),\s*\{\s*headers:\s*\{\s*"cache-control":\s*"private, no-store"/
  + Received:
  "import { NextResponse } from \"next/server\";
  import { getCurrentRequestContext } from \"@/auth/request-context\";
  import { isSameOriginRequest } from \"@/auth/origin\";
  import { announcementApiError } from \"@/lib/announcement-api-error\";
  ```
