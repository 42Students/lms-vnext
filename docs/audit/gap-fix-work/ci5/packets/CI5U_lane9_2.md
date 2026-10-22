# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat14-final-pub-auth-public-29.test.ts (1 failing)
- chat-14 final sprint > PUB-auth-public-29 shows global 403 and portal-denial notices without changing shell

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {Alert} from "@/components/ui/alert";
  + import {useSearchParams} from "next/navigation";
  ```

## tests/unit/chat16-final-sa-tenants-modules-29.test.ts (2 failing)
- SA-tenants-modules-29 population-aware confirmation > SA-tenants-modules-29 fetches verified active population, otherwise fails closed

  ```
  AssertionError: expected '"use client";\nimport {Select} from "…' to contain 'students===null'
  - Expected
  + Received
  - students===null
  + "use client";
  + import {Select} from "@/components/ui/select";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {Switch} from "@/components/ui/selection-controls";
  ```
- SA-tenants-modules-29 population-aware confirmation > SA-tenants-modules-29 requires acknowledgement at 100 learners and separately warns for lock changes

  ```
  AssertionError: expected '"use client";\nimport {Select} from "…' to contain 'students>=100&&!acknowledgedPopulation'
  - Expected
  + Received
  - students>=100&&!acknowledgedPopulation
  + "use client";
  + import {Select} from "@/components/ui/select";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {Switch} from "@/components/ui/selection-controls";
  ```

## tests/unit/chat16-recruiter-email-inbound-transaction-16.test.ts (5 failing)
- chat-16 signed recruiter reply actual transaction decisions > email-bridge-inbound-transaction-16 denies an expired token before reading recruiter grants

  ```
  AssertionError: promise rejected "TypeError: tx.insert(...).values(...).onC…" instead of resolving
  ❯ tests/unit/chat16-recruiter-email-inbound-transaction-16.test.ts:71:74
  69|  it("email-bridge-inbound-transaction-16 denies an expired token befor…
  70|   const f=transactionFixture({state:{...validState,replyTokenExpiresAt…
  71|   await expect(acceptAuthenticatedRecruiterEmailReply(raw,signature,en…
  |                                                                          ^
  72|    .resolves.toEqual({accepted:false,replayed:false});
  73|   expect(f.tx.execute).not.toHaveBeenCalled();
  ```
- chat-16 signed recruiter reply actual transaction decisions > email-bridge-inbound-transaction-17 denies revoked or foreign grant before saving email bodies

  ```
  AssertionError: promise rejected "TypeError: tx.insert(...).values(...).onC…" instead of resolving
  ❯ tests/unit/chat16-recruiter-email-inbound-transaction-16.test.ts:79:74
  77|  it("email-bridge-inbound-transaction-17 denies revoked or foreign gra…
  78|   const f=transactionFixture({granted:false});
  79|   await expect(acceptAuthenticatedRecruiterEmailReply(raw,signature,en…
  |                                                                          ^
  80|    .resolves.toEqual({accepted:false,replayed:false});
  81|   expect(f.tx.insert).not.toHaveBeenCalled();
  ```
- chat-16 signed recruiter reply actual transaction decisions > email-bridge-inbound-transaction-18 safely acknowledges an existing same-thread provider event without inserting twice

  ```
  AssertionError: promise rejected "TypeError: tx.insert(...).values(...).onC…" instead of resolving
  ❯ tests/unit/chat16-recruiter-email-inbound-transaction-16.test.ts:86:74
  84|  it("email-bridge-inbound-transaction-18 safely acknowledges an existi…
  85|   const f=transactionFixture({duplicate:{id:messageId,threadId}});
  86|   await expect(acceptAuthenticatedRecruiterEmailReply(raw,signature,en…
  |                                                                          ^
  87|    .resolves.toEqual({accepted:true,replayed:true});
  88|   expect(f.tx.insert).not.toHaveBeenCalled();
  ```
- chat-16 signed recruiter reply actual transaction decisions > email-bridge-inbound-transaction-19 refuses a reused upstream ID from another thread

  ```
  AssertionError: promise rejected "TypeError: tx.insert(...).values(...).onC…" instead of resolving
  ❯ tests/unit/chat16-recruiter-email-inbound-transaction-16.test.ts:96:74
  94|    id:messageId,threadId:"44444444-4444-4444-8444-444444444444",
  95|   }});
  96|   await expect(acceptAuthenticatedRecruiterEmailReply(raw,signature,en…
  |                                                                          ^
  97|    .resolves.toEqual({accepted:false,replayed:true});
  98|   expect(f.tx.insert).not.toHaveBeenCalled();
  ```
- chat-16 signed recruiter reply actual transaction decisions > email-bridge-inbound-transaction-20 persists only new reply text, then receipt and scoped placement alert

  ```
  AssertionError: promise rejected "TypeError: tx.insert(...).values(...).onC…" instead of resolving
  ❯ tests/unit/chat16-recruiter-email-inbound-transaction-16.test.ts:103:74
  101|  it("email-bridge-inbound-transaction-20 persists only new reply text,…
  102|   const f=transactionFixture();
  103|   await expect(acceptAuthenticatedRecruiterEmailReply(raw,signature,en…
  |                                                                          ^
  104|    .resolves.toEqual({accepted:true,replayed:false});
  105|   expect(f.tx.execute).toHaveBeenCalledTimes(3);
  ```

## tests/unit/chat2-UX-tpo-scroll-motion-01.test.ts (2 failing)
- UX-tpo-scroll-motion: invisible scrollbars must never hide available content > UX-tpo-scroll-motion-05 company drive history uses DataTable and authorized job links

  ```
  AssertionError: expected '"use client";\nimport { PageBackLink …' to contain 'encodeURIComponent(drive.id)'
  - Expected
  + Received
  - encodeURIComponent(drive.id)
  + "use client";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Badge } from "@/components/ui/badge";
  ```
- UX-tpo-scroll-motion: invisible scrollbars must never hide available content > UX-tpo-scroll-motion-06 academic import preview keeps row-level opt-in and match checks

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain 'No students were found in the import …'
  - Expected
  + Received
  - No students were found in the import preview.
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {Textarea} from "@/components/ui/textarea";
  + import {DataTable} from "@/components/ui/data-table";
  ```

## tests/unit/chat2-team-college-admin-access.test.ts (1 failing)
- College placement team access > TPO-inbox-team-37 lists college administrators in the Team People roster

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'member.roles.includes("COLLEGE_ADMIN")'
  - Expected
  + Received
  - member.roles.includes("COLLEGE_ADMIN")
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/chat2-tpo-round-uncovered-models-break-13.test.ts (1 failing)
- TPO-BREAK-round-model-13: non-silent round results and live schedule projections > TPO-drive-workspace-40 stages PASS internally, but directs all non-pass notes to learners

  ```
  AssertionError: expected 'Waitlist' to be 'On hold / waitlisted' // Object.is equality
  Expected: "On hold / waitlisted"
  Received: "Waitlist"
  ```

## tests/unit/chat3-superadmin-academics-people-journeys.test.ts (1 failing)
- chat-3 Super Admin Academics + People account journeys > SA-academics-people-06 Academics, People and recruiter compatibility pages keep scoped safe entrypoints

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'export { default } from "../hr/page"'
  - Expected
  + Received
  - export { default } from "../hr/page"
  + import Link from "next/link";
  + import {PageHeader} from "@/components/ui/page-header";
  + import SuperAdminHrPage from "../hr/page";
  + /** Legacy Recruiter accounts is a Placements section, not a separate
  ```

## tests/unit/chat4-college-local-identity-directory.test.ts (1 failing)
- COL-people-local-identity-01 safe directory read and create contracts > email lookup is case-insensitive and never invents an identity for an absent row

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
