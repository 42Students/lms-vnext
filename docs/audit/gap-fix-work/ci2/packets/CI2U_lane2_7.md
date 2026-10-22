# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-queue-source-verification-r6.test.ts (2 failing)
- chat-16 reassigned mentor and tracker queue source contracts > MEN-projects-meetings-73 retains its audited source boundary

  ```
  AssertionError: expected '/**\n * Mentor attention rules are pu…' to contain '["PLANNED","ACTIVE"]'
  - Expected
  + Received
  - ["PLANNED","ACTIVE"]
  + /**
  +  * Mentor attention rules are pure, so stale/reopen/archival edge cases are
  +  * regression-tested without pretending browser or DB execution is complete.
  +  */
  ```
- chat-16 reassigned mentor and tracker queue source contracts > SA-placements-projects-122 retains its audited source boundary

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'Release (critical & high)'
  - Expected
  + Received
  - Release (critical & high)
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Banner } from "@/components/ui/banner";
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat16-tpo-unsubscribe-live-row-16.test.ts (4 failing)
- chat-16 TPO recipient unsubscribe live row decision > campaign-unsubscribe-service-16 validates purpose-bound HMAC before touching private database

  ```
  AssertionError: promise resolved "{ unsubscribed: true }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + {
  +   "unsubscribed": true,
  }
  ```
- chat-16 TPO recipient unsubscribe live row decision > campaign-unsubscribe-service-18 validates locked college/campaign/recipient identity before changes

  ```
  AssertionError: expected TypeError: tx.select(...).from(...).where… to be an instance of CampaignUnsubscribeInvalid
  ❯ tests/unit/chat16-tpo-unsubscribe-live-row-16.test.ts:55:55
  53|  it("campaign-unsubscribe-service-18 validates locked college/campaign…
  54|   const f=fakeDb(true,null);
  55|   await expect(unsubscribeTpoCampaignRecipient(token)).rejects.toBeIns…
  |                                                       ^
  56|   expect(f.db.transaction).toHaveBeenCalledOnce();
  57|   expect(f.limit).toHaveBeenCalledWith(1);
  ```
- chat-16 TPO recipient unsubscribe live row decision > campaign-unsubscribe-service-20 atomically records lead suppression, activity and scoped TPO notice

  ```
  AssertionError: promise rejected "TypeError: tx.select(...).from(...).where…" instead of resolving
  ❯ tests/unit/chat16-tpo-unsubscribe-live-row-16.test.ts:86:55
  84|   })})}));
  85|   (f.tx as typeof f.tx & {selectDistinct:typeof distinct}).selectDisti…
  86|   await expect(unsubscribeTpoCampaignRecipient(token)).resolves.toEqua…
  |                                                       ^
  87|   expect(changedRecipient).toHaveBeenCalledOnce();
  88|   expect(changedLead).toHaveBeenCalledOnce();
  ```
- chat-16 TPO recipient unsubscribe live row decision > campaign-unsubscribe-service-19 an already unsubscribed recipient is idempotent, without repeat notifications

  ```
  AssertionError: promise rejected "TypeError: tx.select(...).from(...).where…" instead of resolving
  ❯ tests/unit/chat16-tpo-unsubscribe-live-row-16.test.ts:104:55
  102|    leadId:lead,unsubscribedAt:new Date("2026-10-18T00:00:00Z")};
  103|   const f=fakeDb(true,row);
  104|   await expect(unsubscribeTpoCampaignRecipient(token)).resolves.toEqua…
  |                                                       ^
  105|   expect(f.tx.update).not.toHaveBeenCalled();
  106|   expect(f.tx.insert).not.toHaveBeenCalled();
  ```

## tests/unit/chat19-report-interactive-table-render.test.tsx (1 failing)
- UX-SPILL-HR-02: responsive interactive report card and export controls > renders complete report fields as DataTable phone cards, not a raw wide custom table

  ```
  AssertionError: expected '<section class="space-y-3" aria-label…' to contain 'More details'
  - Expected
  + Received
  - More details
  + <section class="space-y-3" aria-labelledby="_R_0_"><h2 id="_R_0_" class="font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">Employer hiring report</h2><div data-report-toolbar="true" c
  ```

## tests/unit/chat2-company-domain-write.test.ts (1 failing)
- TPO-companies-02 domain update contract > requires a bare verified-looking domain and target ID

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat2-public-content-metrics.test.ts (2 failing)
- Public placements editorial content and selected numbers > TPO-campaigns-public-34 lets TPO choose and order all seven numbers, with privacy fallback and LPA

  ```
  AssertionError: expected '10 LPA' to be '10.0 LPA' // Object.is equality
  Expected: "10.0 LPA"
  Received: "10 LPA"
  ```
- Public placements editorial content and selected numbers > TPO-campaigns-public-34 does not confuse withheld population with zero

  ```
  AssertionError: expected null to be '(not enough data yet)' // Object.is equality
  - Expected:
  "(not enough data yet)"
  + Received:
  null
  ```

## tests/unit/chat2-tpo-communication-settings-service-cas.test.ts (4 failing)
- TPO-settings-audit-55 communication settings service under retries and revocation > TPO-settings-audit-55 rejects concurrent revocation before any setting/audit update

  ```
  AssertionError: expected [Function] to throw error including 'ROLE_REVOKED_DURING_WRITE' but got 'TPO_SETTINGS_NOT_FOUND'
  Expected: "ROLE_REVOKED_DURING_WRITE"
  Received: "TPO_SETTINGS_NOT_FOUND"
  ```
- TPO-settings-audit-55 communication settings service under retries and revocation > TPO-settings-audit-55 rejects stale value changes and emits no activity event

  ```
  AssertionError: expected Error: TPO_SETTINGS_NOT_FOUND { …(1) } to match object { code: 'TPO_SETTINGS_STALE' }
  - Expected
  + Received
  - {
  -   "code": "TPO_SETTINGS_STALE",
  + TpoCommunicationSettingsError {
  +   "code": "TPO_SETTINGS_NOT_FOUND",
  }
  ```
- TPO-settings-audit-55 communication settings service under retries and revocation > TPO-settings-audit-55 makes identical retries no-op even when their CAS token expired

  ```
  
  ```
- TPO-settings-audit-55 communication settings service under retries and revocation > TPO-settings-audit-55 writes changed section and audit only after scoped live actor and matching CAS

  ```
  Error: TPO_SETTINGS_NOT_FOUND
  ❯ src/modules/placements/tpo-communication-settings-service.ts:59:48
  57|   const [college]=await tx.select({organizationId:colleges.organizatio…
  58|    .from(colleges).where(eq(colleges.id,collegeId)).for("update").limi…
  59|   if(!college||college.status!=="ACTIVE")throw new TpoCommunicationSet…
  |                                                ^
  60|   // The request may have been authenticated before a concurrent role …
  61|   // session revocation. Rebuild and lock the persisted actor in this …
  ```
