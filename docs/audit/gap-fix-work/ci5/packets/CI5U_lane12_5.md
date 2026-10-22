# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-schedule-parity.test.ts (1 failing)
- learner class schedule parity surface > keeps the dedicated learner calendar route and shell destination

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'aria-label="Next upcoming classes"'
  - Expected
  + Received
  - aria-label="Next upcoming classes"
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { CalendarGrid } from "@/components/ui/calendar-grid";
  + import calendarStyles from "@/components/placements/legacy-calendar-theme.module.css";
  ```

## tests/unit/outbound-messaging-providers.test.ts (1 failing)
- messaging provider adapter > uses the registered campaign template instead of OTP

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
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

## tests/unit/recruiter-invite-otp-policy.test.ts (1 failing)
- T-S1-03 invitation OTP safety > enforces 5/link and 300/college hourly send caps

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/super-admin-settings-invalid-early-return.test.ts (1 failing)
- Super Admin Settings filter read fence > authorizes before errors, validates before database reads

  ```
  AssertionError: expected -1 to be greater than 0
  ❯ tests/unit/super-admin-settings-invalid-early-return.test.ts:10:16
  8|   const parse=page.indexOf("parseAdminInventoryQuery(raw)");
  9|   const load=page.indexOf("getSuperAdminPlatformSettings(context)");
  10|   expect(auth).toBeGreaterThan(0);
  |                ^
  11|   expect(auth).toBeLessThan(parse);
  12|   expect(parse).toBeLessThan(load);
  ```

## tests/unit/tpo-batches-chat5-next-round.test.ts (5 failing)
- TPO Batches next-round source and behavioral gap closure > TPO-batches-52 displays learner decision, source and five registration choices as human terms

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'batchRegistrationLabel(s.registration…'
  - Expected
  + Received
  - batchRegistrationLabel(s.registration.choice)
  + import {Button} from "@/components/ui/button";
  + import {Disclosure} from "@/components/ui/disclosure";
  + import {Badge} from "@/components/ui/badge";
  + import {DataTable} from "@/components/ui/data-table";
  ```
- TPO Batches next-round source and behavioral gap closure > TPO-batches-40 uses the expected legacy import heading and confirm button

  ```
  AssertionError: expected '"use client";\nimport { Tabs } from "…' to contain '>Confirm matched decisions</button>'
  - Expected
  + Received
  - >Confirm matched decisions</button>
  + "use client";
  + import { Tabs } from "@/components/ui/tabs";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { Checkbox } from "@/components/ui/checkbox";
  ```
- TPO Batches next-round source and behavioral gap closure > GR-04 GR-30 GR-32 prevent raw errors and double submissions in batch decision editor

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {Textarea} from "@/components/ui/textarea";
  + import {Select} from "@/components/ui/select";
  ```
- TPO Batches next-round source and behavioral gap closure > TPO-batches-50 has a complete keyboard-safe loading and recovery state

  ```
  AssertionError: expected 'import { GracefulPageLoading } from "…' to contain 'aria-busy="true"'
  - Expected
  + Received
  - aria-busy="true"
  + import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
  + import { PageHeader } from "@/components/ui/page-header";
  + export default function Loading(){return <div className="min-w-0 space-y-4"><PageHeader title="Batch students"/><GracefulPageLoading label="Loading batch students" shape="directory"/></div>}
  +
  ```
- TPO Batches next-round source and behavioral gap closure > GR-35 GR-90 avoids native confirmation and exposes an alert for failed batch undo

  ```
  AssertionError: expected '"use client";\nimport { Checkbox } fr…' to contain 'type="checkbox"'
  - Expected
  + Received
  - type="checkbox"
  + "use client";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  ```

## tests/unit/tpo-drive-workspace-s2-evidence-contracts.test.ts (3 failing)
- Drive workspace S2 source-to-UI contracts > TPO-drive-workspace-04 shows the export, company share and run-again actions in More

  ```
  AssertionError: expected 'import { Dropdown } from "@/component…' to contain 'More ▾'
  - Expected
  + Received
  - More ▾
  + import { Dropdown } from "@/components/ui/dropdown";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import type { ReactNode } from "react";
  ```
- Drive workspace S2 source-to-UI contracts > TPO-drive-workspace-27 provides an authorized modal and per-selection review queue

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'modal.showModal()'
  - Expected
  + Received
  - modal.showModal()
  + "use client";
  +
  + import { useEffect, useId, useRef, type ReactNode, type RefObject, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- Drive workspace S2 source-to-UI contracts > TPO-drive-workspace-63 retains applicant-level inclusion actions without cross-college mutation

  ```
  AssertionError: expected '"use client";\n\nimport { Disclosure …' to contain 'Force'
  - Expected
  + Received
  - Force
  + "use client";
  +
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {
  ```

## tests/unit/tpo-recruiters-13-invite-readiness.test.ts (1 failing)
- TPO-recruiters-13 PUB-auth-public-40 cannot issue dead-end invitations > requires a work email and linked college company before rotating the token

  ```
  AssertionError: expected -1 to be greater than -1
  ❯ tests/unit/tpo-recruiters-13-invite-readiness.test.ts:7:17
  5|   const service=readFileSync("src/modules/placements/tpo-recruiter-inv…
  6|   const pivot=service.indexOf("if(!lead.emailNorm||!lead.companyRelati…
  7|   expect(pivot).toBeGreaterThan(-1);
  |                 ^
  8|   expect(pivot).toBeLessThan(service.indexOf("let credential;",pivot));
  9|  });
  ```
