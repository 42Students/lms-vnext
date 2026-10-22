# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-inbound-mail-status-route-16.test.ts (1 failing)
- chat-16 private inbound-mail status route > inbound-mail-route-17 maps an optimistic conflict to a 409 without a fake success

  ```
  AssertionError: expected { error: 'MESSAGE_CHANGED', …(1) } to deeply equal { error: 'MESSAGE_CHANGED' }
  - Expected
  + Received
  {
  "error": "MESSAGE_CHANGED",
  +   "message": "This message changed. Reload it and try again.",
  }
  ```

## tests/unit/chat2-final-sprint-threads-profile-c.test.ts (1 failing)
- Final sprint recruiter threads and profile — group C > REC-calendar-messages-profile-30 keeps explicit confirmed college-specific self-revocation rather than silent access changes

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'method: "DELETE"'
  - Expected
  + Received
  - method: "DELETE"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```

## tests/unit/chat4-admin-college-session-history-journey.test.ts (1 failing)
- SA-colleges-admins-R01 administrator history tenancy and paging > checks persisted role on administrator session revocation and does not fabricate duplicate audits on retry

  ```
  AssertionError: expected 'export async function revokeCollegeAd…' to contain 'if(rows.rows.length===0)return {revok…'
  - Expected
  + Received
  - if(rows.rows.length===0)return {revoked:0}
  + export async function revokeCollegeAdminSessions(ctx:RequestContext,collegeId:unknown,userId:unknown){
  +  const target=await authorizedTarget(ctx,collegeId,userId);
  +  return getDb().transaction(async tx=>{
  +   await assertPersistedPlatformPermission(tx,ctx,"college.manage",{
  ```

## tests/unit/chat4-superadmin-college-one-canvas-audit.test.ts (2 failing)
- Super Admin colleges/organizations canvas and page states > UX-COL-ONE-CANVAS-01 preserves scoped, accessible tenant directories and paging

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'No organizations in this scope'
  - Expected
  + Received
  - No organizations in this scope
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { OrganizationActions } from "@/components/admin/organization-actions";
  + import {TenantRestoreAction} from "@/components/admin/tenant-restore-action";
  ```
- Super Admin colleges/organizations canvas and page states > UX-COL-ONE-CANVAS-03 keeps administrator account and session controls in the directory

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'View history'
  - Expected
  + Received
  - View history
  + import Link from "next/link";
  + import {DataTable} from "@/components/ui/data-table";
  + import {Tabs} from "@/components/ui/tabs";
  + import {Alert} from "@/components/ui/alert";
  ```
