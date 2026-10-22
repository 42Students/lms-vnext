# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat12-company-depth-round6.test.ts (1 failing)
- Chat12 company depth and URL filters > TPO-students-51 keeps roster actions always visible on phone

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain '<TpoSpreadsheetGrid mobilePrimaryKeys='
  - Expected
  + Received
  - <TpoSpreadsheetGrid mobilePrimaryKeys=
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Select} from "@/components/ui/select";
  ```

## tests/unit/chat12-round21-verification-history.test.ts (1 failing)
- TPO-requests-verification-29 returns the latest 50 named audit events and full private review facts

  ```
  AssertionError: expected '"use client";\nimport {apiFetch,Frien…' to contain 'Roll no.: {row.rollNumber}'
  - Expected
  + Received
  - Roll no.: {row.rollNumber}
  + "use client";
  + import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
  + import {useEffect,useState} from "react";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```

## tests/unit/chat12-timed-debar-round3.test.ts (1 failing)
- TPO timed debarments wired to DB08 > GR-04 / GR-35 guards network/HTML failure and requires confirm dialog before saving debarment

  ```
  AssertionError: expected '"use client";\nimport {Textarea} from…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import {Textarea} from "@/components/ui/textarea";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  ```

## tests/unit/chat12-verification-reasons-round3.test.ts (1 failing)
- chat-12 Verification legacy send-back reason selector > TPO-requests-verification-27 permits a custom-only reason but prevents an empty send-back

  ```
  AssertionError: expected '"use client";\nimport {apiFetch,Frien…' to contain '<option value="">Or write what needs …'
  - Expected
  + Received
  - <option value="">Or write what needs to change</option>
  + "use client";
  + import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
  + import {useEffect,useState} from "react";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```

## tests/unit/chat13-cohort-creation-outcomes-gap56.test.ts (2 failing)
- SA-placements-projects-56 truthful per-student creation results > SA-placements-projects-56 exposes a per-learner table and exports all confirmed results

  ```
  AssertionError: expected '"use client";\nimport { EmptyState } …' to contain 'rows={outcome.individualResults}'
  - Expected
  + Received
  - rows={outcome.individualResults}
  + "use client";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { useEffect, useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```
- SA-placements-projects-56 version-bound preflight > SA-placements-projects-56 cannot confirm an old college, class, template or roster preview

  ```
  AssertionError: expected '"use client";\nimport { EmptyState } …' to contain 'if(!currentPreflight)return;'
  - Expected
  + Received
  - if(!currentPreflight)return;
  + "use client";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { useEffect, useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```

## tests/unit/chat13-offer-letter-attention.test.ts (2 failing)
- Super Admin needs attention and application offer letters > SA-placements-projects-05 groups the four legacy flags with category rows and overflow expansion

  ```
  AssertionError: expected '"use client";\nimport Link from "next…' to contain '/applications?stage='
  - Expected
  + Received
  - /applications?stage=
  + "use client";
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  + import {useState} from "react";
  ```
- Super Admin needs attention and application offer letters > SA-placements-projects-21 attaches offer letters through a scoped mutating request

  ```
  AssertionError: expected '"use client";\nimport {Dialog} from "…' to contain 'Attach Offer Letter'
  - Expected
  + Received
  - Attach Offer Letter
  + "use client";
  + import {Dialog} from "@/components/ui/dialog";
  + import {ConfirmDialog} from "@/components/ui/confirm-dialog";
  + import {Button} from "@/components/ui/button";
  ```
