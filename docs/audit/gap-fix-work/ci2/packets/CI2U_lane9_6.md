# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-super-admin-academic-setup-verification.test.ts (5 failing)
- Super Admin Academic Setup gap verifications > SA-academics-people-19 shows legacy batch columns

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'Start Date'
  - Expected
  + Received
  - Start Date
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  + import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
  ```
- Super Admin Academic Setup gap verifications > SA-academics-people-20 opens batch roster with capacity scoped actions

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'SuperAdminBatchRosterManager'
  - Expected
  + Received
  - SuperAdminBatchRosterManager
  + import Link from "next/link";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {Breadcrumbs} from "@/components/ui/breadcrumbs";
  + import {DataTable} from "@/components/ui/data-table";
  ```
- Super Admin Academic Setup gap verifications > SA-academics-people-01 renders six-step academic sequence

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Academic setup · Step'
  - Expected
  + Received
  - Academic setup · Step
  + import Link from "next/link";
  + import { StepIndicator } from "@/components/ui/step-indicator";
  + import {AcademicDirectoryRefresh} from "@/components/admin/academic-directory-refresh";
  +
  ```
- Super Admin Academic Setup gap verifications > SA-academics-people-23 projects class description capacity and filters

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'name="programId"'
  - Expected
  + Received
  - name="programId"
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  + import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
  ```
- Super Admin Academic Setup gap verifications > SA-academics-people-45 includes historical batches on demand

  ```
  AssertionError: expected 'import {Checkbox} from "@/components/…' to contain 'Show completed / inactive batches'
  - Expected
  + Received
  - Show completed / inactive batches
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  ```

## tests/unit/chat13-superadmin-interview-operations.test.ts (1 failing)
- Super Admin placement interview operations > SA-placements-projects-46 renders real round Type Status Mode Sort and conflict-only filters

  ```
  AssertionError: expected '"use client";\nimport { Checkbox } fr…' to contain 'choices("Sort"'
  - Expected
  + Received
  - choices("Sort"
  + "use client";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import {SuperAdminInterviewEdit} from "@/components/admin/super-admin-interview-edit";
  + import {useMemo,useState,useTransition} from "react";
  ```

## tests/unit/chat15-final-sprint-faculty-wrong.test.ts (1 failing)
- chat-15 final sprint: faculty audit decisions grounded in current code > FAC-assessments-25 WRONG: course, section, lesson, due-state and hidden draft are present

  ```
  AssertionError: expected '"use client";\nimport { Badge } from …' to contain 'Course: {item.courseName}'
  - Expected
  + Received
  - Course: {item.courseName}
  + "use client";
  + import { Badge } from "@/components/ui/badge";
  + import {PageHeader} from "@/components/ui/page-header";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/chat16-campaign-unsubscribe-auth-28.test.ts (3 failing)
- chat-16 purpose-bound unsubscribe gate before storage access > T-S2-04-UNSUB-01 malformed, wrong-secret and unsigned links cannot query private recipient storage

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
- chat-16 purpose-bound unsubscribe gate before storage access > T-S2-04-UNSUB-04 already unsubscribed recipient is idempotent and never issues another write

  ```
  TypeError: tx.select(...).from(...).where(...).orderBy is not a function
  ❯ src/modules/messaging/tpo-campaign-unsubscribe-service.ts:47:8
  45|         eq(placementTpoEmailCampaignRecipients.campaignId,claim.campai…
  46|       ):eq(placementTpoEmailCampaignRecipients.legacyUnsubscribeSha256…
  47|       .orderBy(asc(placementTpoEmailCampaignRecipients.createdAt),
  |        ^
  48|         asc(placementTpoEmailCampaignRecipients.id))
  49|       .for("update").limit(1);
  ```
- chat-16 purpose-bound unsubscribe gate before storage access > T-S2-04-UNSUB-05 forged cross-college recipient ID fails without updating or revealing identity

  ```
  AssertionError: expected TypeError: tx.select(...).from(...).where… to be an instance of CampaignUnsubscribeInvalid
  ❯ tests/unit/chat16-campaign-unsubscribe-auth-28.test.ts:95:97
  93|         operation(tx)),
  94|     } as never);
  95|     await expect(unsubscribeTpoCampaignRecipient(issueTpoCampaignRecip…
  |                                                                                                 ^
  96|       .rejects.toBeInstanceOf(CampaignUnsubscribeInvalid);
  97|     expect(tx.update).not.toHaveBeenCalled();
  ```

## tests/unit/chat16-legacy-auth-invite-alias-pages-16.test.ts (2 failing)
- chat-16 legacy authentication and HR invite actual page routes > UX-chat16-legacy-auth-alias-16 retires all Super Admin bypass bookmarks into shared sign-in

  ```
  AssertionError: expected [Function] to throw an error
  - Expected:
  null
  + Received:
  undefined
  ```
- chat-16 legacy authentication and HR invite actual page routes > UX-chat16-legacy-auth-handoff-17 never exchanges a cross-domain token on old handoff route

  ```
  AssertionError: expected [Function] to throw an error
  - Expected:
  null
  + Received:
  undefined
  ```

## tests/unit/chat16-public-company-college-join-http-16.test.ts (2 failing)
- chat-16 public recruiter company and college OTP HTTP security > REC-JOIN-HTTP-24 COMPANY parses malformed JSON as invalid input rather than a server crash

  ```
  AssertionError: expected "vi.fn()" to be called with arguments: [ 'COMPANY', null, null ]
  Number of calls: 0
  ❯ tests/unit/chat16-public-company-college-join-http-16.test.ts:137:37
  135|   expect(response.status).toBe(400);
  136|   expect(await response.json()).toEqual({error:"COULD_NOT_JOIN"});
  137|   expect(acceptPublicRecruiterJoin).toHaveBeenCalledWith(route.scope,n…
  |                                     ^
  138|  });
  ```
- chat-16 public recruiter company and college OTP HTTP security > REC-JOIN-HTTP-24 COLLEGE parses malformed JSON as invalid input rather than a server crash

  ```
  AssertionError: expected "vi.fn()" to be called with arguments: [ 'COLLEGE', null, null ]
  Number of calls: 0
  ❯ tests/unit/chat16-public-company-college-join-http-16.test.ts:137:37
  135|   expect(response.status).toBe(400);
  136|   expect(await response.json()).toEqual({error:"COULD_NOT_JOIN"});
  137|   expect(acceptPublicRecruiterJoin).toHaveBeenCalledWith(route.scope,n…
  |                                     ^
  138|  });
  ```
