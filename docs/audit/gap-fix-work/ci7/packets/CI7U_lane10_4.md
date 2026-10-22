# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/faculty-report-pdf.test.ts (1 failing)
- Faculty monthly Attendance PDF > exports the current Section's marked and unknown outcomes as a valid PDF

  ```
  AssertionError: expected '%PDF-1.4\n1 0 obj\n<< /Type /Catalog …' to contain 'Unmarked: 3 excluded from percentage'
  - Expected
  + Received
  - Unmarked: 3 excluded from percentage
  + %PDF-1.4
  + 1 0 obj
  + << /Type /Catalog /Pages 2 0 R >>
  + endobj
  ```

## tests/unit/learner-placements-chat7-hero-priority.test.ts (1 failing)
- learner placements next-action hero > LEARNER-placements-05 reads accepted offers from scoped server source

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' to contain 'acceptedOffer={offerRows?offerRows.so…'
  - Expected
  + Received
  - acceptedOffer={offerRows?offerRows.some(row=>row.offer.status==="ACCEPTED"):null}
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  + import {LearnerGeneralRequests} from "@/components/placements/learner-general-requests";
  + import {placementTableExists} from "@/modules/placements/staged-tables";
  ```

## tests/unit/public-auth-login-gap-verification.test.ts (4 failing)
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
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'We couldn\'t find an account with tha…'
  - Expected
  + Received
  - We couldn't find an account with that email.
  + "use client";
  +
  + import { useEffect, useRef, useState } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- public sign-in verified gap closure > PUB-auth-public-05 uses 42LMS branding tenant title and legal footer

  ```
  AssertionError: expected 'import { headers } from "next/headers…' to contain 'branding?.collegeName ?? "42LMS"'
  - Expected
  + Received
  - branding?.collegeName ?? "42LMS"
  + import { headers } from "next/headers";
  + import type { Metadata } from "next";
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  ```
- public sign-in verified gap closure > PUB-auth-public-16 displays the college logo or initials monogram fallback

  ```
  AssertionError: expected 'import { headers } from "next/headers…' to contain 'collegeMonogram'
  - Expected
  + Received
  - collegeMonogram
  + import { headers } from "next/headers";
  + import type { Metadata } from "next";
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  ```

## tests/unit/tpo-company-create-model.test.ts (1 failing)
- TPO company directory create contract > requires explicit confirmation and a canonical name

  ```
  ZodError: [
  {
  "code": "custom",
  "path": [
  "primaryDomain"
  ],
  "message": "Add the company's website or a company email domain"
  }
  ```
