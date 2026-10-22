# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-withdrawal-model.test.ts (1 failing)
- Learner application withdrawal validation > requires an explicit confirmed action and a non-blank reason

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/outbound-provider-sid-hygiene.test.ts (3 failing)
- SMS provider opaque receipt hygiene > rejects unsafe provider SID

  ```
  
  ```
- SMS provider opaque receipt hygiene > rejects unsafe provider SID

  ```
  
  ```
- SMS provider opaque receipt hygiene > rejects unsafe provider SID

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/public-auth-round3-gap-verification.test.ts (2 failing)
- Public login and session round-three verified closure > PUB-auth-public-14 leaves unusable OTP screen open with immediate resend

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'This code can\'t be used any more. As…'
  - Expected
  + Received
  - This code can't be used any more. Ask for a new one to continue.
  + "use client";
  +
  + import { useEffect, useRef, useState } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- Public login and session round-three verified closure > PUB-auth-public-18 never caches domain lookup outages as unknown tenants

  ```
  AssertionError: expected 'import { headers } from "next/headers…' to contain 'We couldn&apos;t confirm this college…'
  - Expected
  + Received
  - We couldn&apos;t confirm this college right now
  + import { headers } from "next/headers";
  + import type { Metadata } from "next";
  + import { redirect } from "next/navigation";
  + import { safeReturnTo } from "@/lib/return-to";
  ```

## tests/unit/recruiter-invite-otp-send-model.test.ts (1 failing)
- T-S1-03 OTP provider-independent send decision > blocks one too many sends for link or shared college

  ```
  AssertionError: expected 'ALLOW' to be 'DENY' // Object.is equality
  Expected: "DENY"
  Received: "ALLOW"
  ```

## tests/unit/super-admin-template-create-model.test.ts (1 failing)
- Super Admin template creation > attaches one HTTP(S) resource with stable key and rejects partial or unsafe URL

  ```
  AssertionError: expected [Function] to throw an error
  ❯ tests/unit/super-admin-template-create-model.test.ts:25:79
  23|   expect(result.blueprint.resources[0].key).toBe("resource-1");
  24|   expect(result.blueprint.resources[0].title).toBe("Guide");
  25|   expect(()=>initialSuperAdminTemplateDraft({...base,resourceTitle:"Gu…
  |                                                                               ^
  26|   expect(()=>initialSuperAdminTemplateDraft({...base,resourceTitle:"Gu…
  27|  });
  ```

## tests/unit/tpo-batches-chat5-round3.test.ts (9 failing)
- TPO batches chat-5 verified source and behavior > TPO-batches-01: verifies persisted batch workflow contract

  ```
  AssertionError: expected 'import { Disclosure } from "@/compone…' to contain 'Ineligible'
  - Expected
  + Received
  - Ineligible
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {TpoBatchUndoControl} from "@/components/tpo/tpo-batch-undo-control";
  ```
- TPO batches chat-5 verified source and behavior > TPO-batches-02: verifies persisted batch workflow contract

  ```
  AssertionError: expected 'import { Disclosure } from "@/compone…' to contain 'Verified profiles'
  - Expected
  + Received
  - Verified profiles
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {TpoBatchUndoControl} from "@/components/tpo/tpo-batch-undo-control";
  ```
- TPO batches chat-5 verified source and behavior > TPO-batches-04: verifies persisted batch workflow contract

  ```
  AssertionError: expected 'import { Disclosure } from "@/compone…' to contain 'Open for placements'
  - Expected
  + Received
  - Open for placements
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {TpoBatchUndoControl} from "@/components/tpo/tpo-batch-undo-control";
  ```
- TPO batches chat-5 verified source and behavior > TPO-batches-05: verifies persisted batch workflow contract

  ```
  AssertionError: expected 'import { Disclosure } from "@/compone…' to contain 'Last batch decision'
  - Expected
  + Received
  - Last batch decision
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {TpoBatchUndoControl} from "@/components/tpo/tpo-batch-undo-control";
  ```
- TPO batches chat-5 verified source and behavior > TPO-batches-06: verifies persisted batch workflow contract

  ```
  AssertionError: expected 'import { Disclosure } from "@/compone…' to contain 'not in any active class'
  - Expected
  + Received
  - not in any active class
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {TpoBatchUndoControl} from "@/components/tpo/tpo-batch-undo-control";
  ```
- TPO batches chat-5 verified source and behavior > TPO-batches-29: verifies persisted batch workflow contract

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-current={tab.slug === active ? "…'
  - Expected
  + Received
  - aria-current={tab.slug === active ? "page" : undefined}
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  +
  + const primary = [
  ```
- TPO batches chat-5 verified source and behavior > TPO-batches-30: verifies persisted batch workflow contract

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'students !== undefined ? ` (${student…'
  - Expected
  + Received
  - students !== undefined ? ` (${students})` : ""
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  +
  + const primary = [
  ```
- TPO batches chat-5 verified source and behavior > TPO-batches-34: verifies persisted batch workflow contract

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'Roll number:'
  - Expected
  + Received
  - Roll number:
  + import {Button} from "@/components/ui/button";
  + import {Disclosure} from "@/components/ui/disclosure";
  + import {Badge} from "@/components/ui/badge";
  + import {DataTable} from "@/components/ui/data-table";
  ```
- TPO batches chat-5 verified source and behavior > TPO-batches-48: verifies persisted batch workflow contract

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain '!finished&&!s.ambiguous'
  - Expected
  + Received
  - !finished&&!s.ambiguous
  + import {Button} from "@/components/ui/button";
  + import {Disclosure} from "@/components/ui/disclosure";
  + import {Badge} from "@/components/ui/badge";
  + import {DataTable} from "@/components/ui/data-table";
  ```

## tests/unit/tpo-drives-chat-3-open-verification.test.ts (9 failing)
- chat-3 remaining Drives audit evidence — open unless explicitly closed > TPO-drives-27 JD upload stays disabled until private storage and scanner are connected

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useState…' not to contain 'type="file"'
  - Expected
  + Received
  - type="file"
  + "use client";
  +
  + import {
  +   useState,
  ```
- chat-3 remaining Drives audit evidence — open unless explicitly closed > TPO-drives-28 college job type is distinct from the fixed employment enum

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useState…' to contain 'name="employmentType"'
  - Expected
  + Received
  - name="employmentType"
  + "use client";
  +
  + import {
  +   useState,
  ```
- chat-3 remaining Drives audit evidence — open unless explicitly closed > TPO-drives-30 the employer portal URL is clear without claiming a persisted portal name

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useState…' to contain 'A separate portal name is not saved b…'
  - Expected
  + Received
  - A separate portal name is not saved by this workflow.
  + "use client";
  +
  + import {
  +   useState,
  ```
- chat-3 remaining Drives audit evidence — open unless explicitly closed > TPO-drives-39 round presets persist pending rounds after the draft with server readback before retry

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useState…' to contain 'venues and dates in the drive workspa…'
  - Expected
  + Received
  - venues and dates in the drive workspace
  + "use client";
  +
  + import {
  +   useState,
  ```
- chat-3 remaining Drives audit evidence — open unless explicitly closed > TPO-drives-40 learner reach is deferred until persisted evidence can be counted

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useState…' to contain 'No reach estimate is fabricated on th…'
  - Expected
  + Received
  - No reach estimate is fabricated on this form.
  + "use client";
  +
  + import {
  +   useState,
  ```
- chat-3 remaining Drives audit evidence — open unless explicitly closed > TPO-drives-48 published edits require the live applicant notification contract

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'editable:["DRAFT","PUBLISHED"].includ…'
  - Expected
  + Received
  - editable:["DRAFT","PUBLISHED"].includes(job.status)&&season?.status==="ACTIVE"
  + import "server-only";
  + import {and,asc,eq,sql,inArray,or} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {placementJobRoleOptions,placementJobRounds,placementJobs,placementSeasons,placementCompanyRelationships,placementCompanies,placementJobEligibilityPolicies,placementApplications,placementRecruiterDriveRequests,collegeMemberships,users,inAppNotifications,activityEvents,cohorts,programs,depar
  ```
- chat-3 remaining Drives audit evidence — open unless explicitly closed > TPO-drives-09 persisted statuses use distinct accessible words and visual tones

  ```
  AssertionError: expected 'import { z } from "zod";\n\n/** TPO-d…' to contain 'status==="CANCELLED"?"Cancelled"'
  - Expected
  + Received
  - status==="CANCELLED"?"Cancelled"
  + import { z } from "zod";
  +
  + /** TPO-drives-03: "Closed" is a view of both normal closures and cancellations.
  +  * Do not include rejected recruiter requests: those are not placement jobs. */
  ```
- chat-3 remaining Drives audit evidence — open unless explicitly closed > TPO-drives-38 employer skill tags are not misrepresented as persisted eligibility

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useState…' to contain 'Skills the employer requires are not …'
  - Expected
  + Received
  - Skills the employer requires are not configured on this form yet.
  + "use client";
  +
  + import {
  +   useState,
  ```
- chat-3 remaining Drives audit evidence — open unless explicitly closed > TPO-drives-47 recruiter lead invite is not misrepresented as a drive-level email

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useState…' to match /recruiter lead invitations are manag…/i
  - Expected:
  /recruiter lead invitations are managed separately under Engage\./i
  + Received:
  "\"use client\";
  import {
  useState,
  useRef,
  ```

## tests/unit/tpo-secondary-nav-reachability.test.ts (1 failing)
- TPO exact sidebar groups and secondary route reachability > preserves companies as an Engage tab and keeps the ten legacy Settings sections

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
