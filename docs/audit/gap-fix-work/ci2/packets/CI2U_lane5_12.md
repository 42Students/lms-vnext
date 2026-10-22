# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-placements-53-college-rules.test.ts (1 failing)
- LEARNER-placements-53 authoritative placement rules > LEARNER-placements-53 reports saved college limits and truthful held-offer uplift

  ```
  AssertionError: expected [ …(6) ] to include 'Offers you can hold: up to 1 active o…'
  ❯ tests/unit/learner-placements-53-college-rules.test.ts:8:23
  6|  it("LEARNER-placements-53 reports saved college limits and truthful h…
  7|   const view=learnerCollegePlacementRulePoints(rules,[{kind:"OFFER",st…
  8|   expect(view.points).toContain("Offers you can hold: up to 1 active o…
  |                       ^
  9|   expect(view.points.some(point=>point.includes("48 hours"))).toBe(tru…
  10|   expect(view.personal).toContain("₹6 LPA");
  ```

## tests/unit/learner-quiz-shuffle-model.test.ts (1 failing)
- LEARNER-learning-misc-26 learner-question and option shuffle > does not shuffle when both flags are off and leaves scoring identity unchanged

  ```
  AssertionError: expected [ { id: 'q0', …(5) }, …(9) ] to deeply equal [ { id: 'q0', …(5) }, …(9) ]
  - Expected
  + Received
  @@ -1,47 +1,40 @@
  [
  {
  "id": "q0",
  "options": [
  ```

## tests/unit/notification-providers.test.ts (2 failing)
- Exotel SMS provider > fails closed without credentials, with a bad number or a bad code

  ```
  AssertionError: expected "vi.fn()" to not be called at all, but actually been called 1 times
  Received:
  1st vi.fn() call:
  Array [
  "https://api.exotel.com/v1/Accounts/42students1/Sms/send.json",
  Object {
  "body": URLSearchParams {},
  "headers": Headers {},
  ```
- ZeptoMail provider > sends the OTP template with the legacy merge fields

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/projects-phase2-workspace-copy-audit.test.ts (2 failing)
- Phase 2 exact old-LMS Projects headings and empty states > uses legacy Team and Resources copy, not implementation language

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'Project people'
  - Expected
  + Received
  - Project people
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- Phase 2 exact old-LMS Projects headings and empty states > keeps one route-level tab strip for each role

  ```
  AssertionError: expected 'import { Tabs } from "@/components/ui…' to contain 'if (basePath === "/college/projects" …'
  - Expected
  + Received
  - if (basePath === "/college/projects" || basePath === "/admin/projects") return null;
  + import { Tabs } from "@/components/ui/tabs";
  + import styles from "./legacy-project-tabs.module.css";
  + import { PROJECT_ADMIN_SECTIONS } from "@/modules/projects/project-admin-navigation-model";
  +
  ```

## tests/unit/recruiter-chat14-unconfirmed-decisions.test.ts (2 failing)
- chat-14 UNCONFIRMED recruiter owner decisions > REC-home-drives-09 treats pending invitations as unverified until an OTP-secured join

  ```
  AssertionError: expected 'import { recruiterAccessMonthsOrDefau…' to contain 'if (grant && grant.status === "REVOKE…'
  - Expected
  + Received
  - if (grant && grant.status === "REVOKED")
  + import { recruiterAccessMonthsOrDefault } from "@/modules/placements/recruiter-access-defaults";
  + import "server-only";
  +
  + import { createHash } from "node:crypto";
  ```
- chat-14 UNCONFIRMED recruiter owner decisions > REC-calendar-messages-profile-46 reuses verified existing-account join and never silently auto-accepts

  ```
  AssertionError: expected 'import { recruiterAccessMonthsOrDefau…' to contain 'outcome = "ALREADY_JOINED"'
  - Expected
  + Received
  - outcome = "ALREADY_JOINED"
  + import { recruiterAccessMonthsOrDefault } from "@/modules/placements/recruiter-access-defaults";
  + import "server-only";
  +
  + import { createHash } from "node:crypto";
  ```

## tests/unit/shell-switcher-wording.test.ts (2 failing)
- legacy workspace and scope switcher wording (Header.js, SuperAdminHeader.js) > workspace switcher says Switch workspace

  ```
  AssertionError: expected '"use client";\n\nimport { useState, u…' to contain 'if (!membershipId || membershipId ===…'
  - Expected
  + Received
  - if (!membershipId || membershipId === activeMembershipId) return;
  + "use client";
  +
  + import { useState, useTransition } from "react";
  + import { useRouter } from "next/navigation";
  ```
- legacy workspace and scope switcher wording (Header.js, SuperAdminHeader.js) > Super Admin scope placeholder is All colleges

  ```
  AssertionError: expected '"use client";\n\nimport {useEffect,us…' to contain '<option value="">All colleges</option>'
  - Expected
  + Received
  - <option value="">All colleges</option>
  + "use client";
  +
  + import {useEffect,useState,useTransition} from "react";
  + import {useRouter} from "next/navigation";
  ```
