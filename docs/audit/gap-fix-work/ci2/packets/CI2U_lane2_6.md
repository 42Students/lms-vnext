# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-placements-admin-report-models.test.ts (1 failing)
- Super Admin placement analytics: behavior, tenant scope and honest statutory export > SA-ACCREDITATION-02 reports only accepted offers and known branches without guessing certification rates

  ```
  AssertionError: expected +0 to be 1 // Object.is equality
  - Expected
  + Received
  - 1
  + 0
  ```

## tests/unit/chat13-superadmin-drive-delete.test.ts (1 failing)
- Super Admin drive delete impact preview > SA-placements-projects-12 requires same-origin confirmation and a typed reason

  ```
  AssertionError: expected '"use client";\nimport {useState,type …' to contain 'Confirm delete (archive)'
  - Expected
  + Received
  - Confirm delete (archive)
  + "use client";
  + import {useState,type FormEvent} from "react";
  + import {useRouter} from "next/navigation";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat14-final-tpo-drives-52.test.ts (1 failing)
- chat-14 final sprint > TPO-drives-52 shared form autosaves drafts and keeps eligibility/publish confirmation

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useState…' to contain '"Create draft"'
  - Expected
  + Received
  - "Create draft"
  + "use client";
  +
  + import {
  +   useState,
  ```

## tests/unit/chat15-reassigned-learner-parity.test.ts (2 failing)
- chat-15 reassigned learner course and placement parity > LEARNER-course-detail-14 roadmap rows expose content kind and due labels

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useS…' to contain '{caption ?? kind}'
  - Expected
  + Received
  - {caption ?? kind}
  + "use client";
  +
  + import { useId, useState, type ReactNode } from "react";
  + import { Dialog } from "@/components/ui/dialog";
  ```
- chat-15 reassigned learner course and placement parity > LEARNER-placements-03 placement tabs render content without extra PageHeader

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

## tests/unit/chat16-inbound-mail-admin-versioning-16.test.ts (3 failing)
- chat-16 inbound mail admin versioned triage service > inbound-mail-write-19 reports a version or status race as stale, never success

  ```
  AssertionError: promise rejected "TypeError: (0 , __vite_ssr_import_2__.get…" instead of resolving
  ❯ tests/unit/chat16-inbound-mail-admin-versioning-16.test.ts:64:64
  62|  it("inbound-mail-write-19 reports a version or status race as stale, …
  63|   const mocks=updateDb([]);
  64|   await expect(changeInboundMailStatusForAdmin(admin,mutation)).resolv…
  |                                                                ^
  65|   expect(mocks.update).toHaveBeenCalledTimes(1);
  66|   expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({stat…
  ```
- chat-16 inbound mail admin versioned triage service > inbound-mail-write-21 allows NEW to TRIAGED with optimistic version lock

  ```
  AssertionError: promise rejected "TypeError: (0 , __vite_ssr_import_2__.get…" instead of resolving
  ❯ tests/unit/chat16-inbound-mail-admin-versioning-16.test.ts:71:86
  69|  it("inbound-mail-write-21 allows NEW to TRIAGED with optimistic versi…
  70|   const mocks=updateDb([{id,status:"TRIAGED",version:3}]);
  71|   await expect(changeInboundMailStatusForAdmin(admin,{...mutation,stat…
  |                                                                                      ^
  72|    .resolves.toEqual({kind:"UPDATED",id,status:"TRIAGED",version:3});
  73|   expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({stat…
  ```
- chat-16 inbound mail admin versioned triage service > inbound-mail-write-20 returns the persisted state and version after a guarded update

  ```
  AssertionError: promise rejected "TypeError: (0 , __vite_ssr_import_2__.get…" instead of resolving
  ❯ tests/unit/chat16-inbound-mail-admin-versioning-16.test.ts:83:64
  81|  it("inbound-mail-write-20 returns the persisted state and version aft…
  82|   const mocks=updateDb([{id,status:"RESOLVED",version:3}]);
  83|   await expect(changeInboundMailStatusForAdmin(admin,mutation)).resolv…
  |                                                                ^
  84|    kind:"UPDATED",id,status:"RESOLVED",version:3,
  85|   });
  ```

## tests/unit/chat16-otp-template-merge-sanitization-45.test.ts (1 failing)
- chat-16 ZeptoMail OTP profile merge-variable hardening > AUTH-OTP-MERGE-46 sends canonical OTP recipient and sanitized template variables only

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
