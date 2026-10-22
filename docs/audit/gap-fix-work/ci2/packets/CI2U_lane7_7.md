# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-recruiter-email-inbound-gates-16.test.ts (2 failing)
- chat-16 authenticated inbound recruiter email failure gates > email-bridge-inbound-gate-17 rejects malformed JSON, invalid From/To and quoted-only replies before database access

  ```
  AssertionError: promise rejected "TypeError: Cannot read properties of unde…" instead of resolving
  ❯ tests/unit/chat16-recruiter-email-inbound-gates-16.test.ts:48:75
  46|   ];
  47|   for(const raw of cases){
  48|    await expect(acceptAuthenticatedRecruiterEmailReply(raw,sign(raw),e…
  |                                                                           ^
  49|     .resolves.toEqual(deny);
  50|   }
  ```
- chat-16 authenticated inbound recruiter email failure gates > email-bridge-inbound-gate-18 stops if the inbound state and dedupe tables have not been deployed

  ```
  AssertionError: expected { accepted: false, …(2) } to deeply equal { accepted: false, replayed: false }
  - Expected
  + Received
  {
  "accepted": false,
  "replayed": false,
  +   "retryable": true,
  }
  ```

## tests/unit/chat17-identity-system-roles-hardening.test.ts (1 failing)
- WEAK-identity and system-roles: stale membership, disabled actors and role escalation > WEAK-system-roles-01 only unscoped active SA can assign a valid system role

  ```
  AssertionError: expected "vi.fn()" to be called with arguments: [ …(2) ]
  Received:
  1st vi.fn() call:
  [
  "22222222-2222-4222-8222-222222222222",
  "SUPER_ADMIN",
  +   {
  +     "adminScope": null,
  ```

## tests/unit/chat19-tpo-mobile-footer.test.ts (2 failing)
- chat-19 TPO five-icon mobile footer > closes More on browser route commits or tablet/desktop resize

  ```
  AssertionError: expected '"use client";\nimport { BottomSheet }…' to contain 'className="lms-tpo-mobile-footer fixe…'
  - Expected
  + Received
  - className="lms-tpo-mobile-footer fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 md:hidden"
  + "use client";
  + import { BottomSheet } from "@/components/ui/bottom-sheet";
  + import { Button } from "@/components/ui/button";
  + import Image from "next/image";
  ```
- chat-19 TPO five-icon mobile footer > copies legacy 24px icon, .5 inactive, 1 active, 10px captions and press

  ```
  AssertionError: expected '/* Source: docs/design/legacy-styles/…' to contain 'font-size:10px;font-weight:500;color:…'
  - Expected
  + Received
  - font-size:10px;font-weight:500;color:#a9a7ae
  + /* Source: docs/design/legacy-styles/components___antddesign.scss:912-936;
  +  * original 42Students/lms2-fe/src/components/MobileFooter/mobileFooter.scss:1-11.
  +  * Icon sizes/order: lms2-fe/src/components/MobileFooter/MobileFooter.jsx:21-149.
  +  */
  ```

## tests/unit/chat2-company-team-source-contract.test.ts (3 failing)
- Company Team tenant enforcement and source contract > TPO-companies-05 persists scoped messages, follows and assignee audits without inventing an old thread table

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'notifyIds.delete(membership.id)'
  - Expected
  + Received
  - notifyIds.delete(membership.id)
  + import "server-only";
  + import {and,asc,desc,eq,inArray} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```
- Company Team tenant enforcement and source contract > TPO-inbox-team-16 TPO-companies-05 retain the current staged storage proposal and never simulate an installed table

  ```
  Error: ENOENT: no such file or directory, open 'docs/proposed-migrations/chat3-tpo-company-team.sql'
  ❯ src tests/unit/chat2-company-team-source-contract.test.ts:3:23
  1| import {readFileSync} from "node:fs";
  2| import {describe,expect,it} from "vitest";
  3| const src=(p:string)=>readFileSync(p,"utf8");
  |                       ^
  4|
  5| describe("Company Team tenant enforcement and source contract",()=>{
  ```
- Company Team tenant enforcement and source contract > TPO-companies-05 treats a retried draft UUID as one transaction and never repeats notifications

  ```
  Error: ENOENT: no such file or directory, open 'docs/proposed-migrations/chat3-tpo-company-team.sql'
  ❯ src tests/unit/chat2-company-team-source-contract.test.ts:3:23
  1| import {readFileSync} from "node:fs";
  2| import {describe,expect,it} from "vitest";
  3| const src=(p:string)=>readFileSync(p,"utf8");
  |                       ^
  4|
  5| describe("Company Team tenant enforcement and source contract",()=>{
  ```

## tests/unit/chat2-public-placements-page.test.ts (2 failing)
- TPO public placements publication and copy > TPO-campaigns-public-35 returns 404 for unknown hosts or known unpublished reports

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'This page isn&apos;t available'
  - Expected
  + Received
  - This page isn&apos;t available
  + import { PageHeader } from "@/components/ui/page-header";
  +
  + export default function PublicPlacementsNotFound() {
  +   return (
  ```
- TPO public placements publication and copy > TPO-campaigns-public-36 uses the college-specific legacy heading and removes platform-only footer

  ```
  AssertionError: expected 'import { headers } from "next/headers…' to contain '{college?.collegeName??"College place…'
  - Expected
  + Received
  - {college?.collegeName??"College placements"}
  + import { headers } from "next/headers";
  + import {notFound} from "next/navigation";
  + import { PublicRecruitFromUs } from "@/components/placements/public-recruit-from-us";
  + import { resolveRequestTenant } from "@/modules/auth/request-tenant";
  ```

## tests/unit/chat2-tpo-last-third-actor-scope-break-16.test.ts (1 failing)
- UX-tpo-LAST-THIRD-01 account authorization journey across 42 inherited routes > the top-level Next.js layout redirects before any private inbox or notifications are fetched

  ```
  AssertionError: expected 822 to be less than -1
  ❯ tests/unit/chat2-tpo-last-third-actor-scope-break-16.test.ts:60:17
  58|   const guard=source.indexOf("if (!canOpenTpoWorkspace(context)) redir…
  59|   expect(guard).toBeGreaterThan(-1);
  60|   expect(guard).toBeLessThan(source.indexOf("getTpoPersonalInbox(conte…
  |                 ^
  61|   expect(guard).toBeLessThan(source.indexOf("countTpoUnreadRecruiterMe…
  62|   expect(source).toContain("if (!hasTpoTooling(context))");
  ```
