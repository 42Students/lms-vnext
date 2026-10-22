# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

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

## tests/unit/chat17-tenant-dns-verifier.test.ts (8 failing)
- WEAK-tenant-domains: DNS proof never treats lookup failure as ownership > WEAK-tenant-domains-01 splits TXT chunks then requires entire exact verification value

  ```
  Error: [vitest] No "Resolver" export is defined on the "node:dns/promises" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("node:dns/promises"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- WEAK-tenant-domains: DNS proof never treats lookup failure as ownership > WEAK-tenant-domains-02 matches complete TXT record, not lookalike suffix or prefix

  ```
  Error: [vitest] No "Resolver" export is defined on the "node:dns/promises" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("node:dns/promises"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- WEAK-tenant-domains: DNS proof never treats lookup failure as ownership > WEAK-tenant-domains-03 ENODATA missing DNS returns unverified without leaking system errors

  ```
  
  ```
- WEAK-tenant-domains: DNS proof never treats lookup failure as ownership > WEAK-tenant-domains-03 ENOTFOUND missing DNS returns unverified without leaking system errors

  ```
  Error: [vitest] No "Resolver" export is defined on the "node:dns/promises" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("node:dns/promises"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- WEAK-tenant-domains: DNS proof never treats lookup failure as ownership > WEAK-tenant-domains-04 ETIMEOUT resolver error fails closed

  ```
  
  ```
- WEAK-tenant-domains: DNS proof never treats lookup failure as ownership > WEAK-tenant-domains-04 EAI_AGAIN resolver error fails closed

  ```
  
  ```
- WEAK-tenant-domains: DNS proof never treats lookup failure as ownership > WEAK-tenant-domains-04 SERVFAIL resolver error fails closed

  ```
  Error: [vitest] No "Resolver" export is defined on the "node:dns/promises" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("node:dns/promises"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- WEAK-tenant-domains: DNS proof never treats lookup failure as ownership > WEAK-tenant-domains-05 malformed thrown resolver objects fail closed, never verified

  ```
  Error: [vitest] No "Resolver" export is defined on the "node:dns/promises" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("node:dns/promises"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```

## tests/unit/chat19-unclaimed-hr-grid-parity.test.ts (2 failing)
- chat-19 four unclaimed HR grid adapters > hr-company-reports-grid.tsx uses shared spreadsheet semantics and has no local style forks

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' not to match /rounded-(?:full|lg|xl)|border-b-2|ari…/
  - Expected:
  /rounded-(?:full|lg|xl)|border-b-2|aria-pressed=/
  + Received:
  "\"use client\";
  import Link from \"next/link\";
  import {useRouter} from \"next/navigation\";
  import type {MouseEvent} from \"react\";
  ```
- chat-19 four unclaimed HR grid adapters > retains shared status badge and safe per-drive navigation on reports

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'import { StatusBadge } from "@/compon…'
  - Expected
  + Received
  - import { StatusBadge } from "@/components/ui/status-badge"
  + "use client";
  +
  + import Link from "next/link";
  + import {useRouter} from "next/navigation";
  ```

## tests/unit/chat2-company-trust-and-navigation.test.ts (2 failing)
- Chat-2 Company relationship and legacy Companies navigation > TPO-companies-20 defaults bare Companies to legacy Engage but preserves named and filtered company views

  ```
  AssertionError: expected 'import {TpoCompaniesSpreadsheet} from…' to contain 'redirect("/tpo/recruiters?view=compan…'
  - Expected
  + Received
  - redirect("/tpo/recruiters?view=companies")
  + import {TpoCompaniesSpreadsheet} from "@/components/tpo/tpo-companies-spreadsheet";
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  ```
- Chat-2 Company relationship and legacy Companies navigation > TPO-companies-29 keeps accessible phone cards and per-company data without a second roster

  ```
  AssertionError: expected 'import {TpoCompaniesSpreadsheet} from…' to contain '<DataTable'
  - Expected
  + Received
  - <DataTable
  + import {TpoCompaniesSpreadsheet} from "@/components/tpo/tpo-companies-spreadsheet";
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  ```

## tests/unit/chat2-recruiter-access-copy.test.ts (1 failing)
- Recruiter access and notification wording > REC-calendar-messages-profile-16 describes ended college access without exposing a foreign thread

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'if(error instanceof TpoMessagingError…'
  - Expected
  + Received
  - if(error instanceof TpoMessagingError)notFound()
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  + import Link from "next/link";
  + import {RecruiterConversationReplyForm} from "@/components/hr/recruiter-conversation-reply-form";
  ```

## tests/unit/chat2-tpo-last-third-page-baseline.test.ts (3 failing)
- chat-2 last-third TPO pages: role-scoped route and recovery baseline > UX-tpo-team-everyone-01 preserves messages on backend failure and paginates explicitly

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Alert } from "@/components/ui/alert";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  ```
- chat-2 last-third TPO pages: role-scoped route and recovery baseline > UX-tpo-prep-readiness-01 preserves saved settings when dependent courses cannot load

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Alert } from "@/components/ui/alert";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
  ```
- chat-2 last-third TPO pages: role-scoped route and recovery baseline > UX-tpo-requests-01 requires a current TPO actor and gives recoverable request errors

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + import { Select } from "@/components/ui/select";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {FilterChipLink} from "@/components/ui/filter-chip";
  ```
