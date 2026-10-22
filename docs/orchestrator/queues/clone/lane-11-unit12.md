# Unit-test repair queue (unit12): lane chat-11

CI run 39840114517 on main (06b36804), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [ ] `tests/unit/chat11-super-admin-branding-cas.test.ts` (1 failing)
- [ ] `tests/unit/chat6-inbound-reply-body-provenance.test.ts` (1 failing)
- [ ] `tests/unit/ux-admin-chat9-batch-04.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/chat11-super-admin-branding-cas.test.ts

```
 FAIL  tests/unit/chat11-super-admin-branding-cas.test.ts > SA-tenants-modules-BRAND-CAS-01 optimistic college branding saves > keeps actor/college locks, benign retries and same-transaction activity ordering
AssertionError: expected -1 to be greater than 1007
 ❯ tests/unit/chat11-super-admin-branding-cas.test.ts:120:21
    118|   expect(collegeLock).toBeGreaterThan(authorize);
    119|   expect(stored).toBeGreaterThan(collegeLock);
    120|   expect(identical).toBeGreaterThan(stored);
       |                     ^
    121|   expect(cas).toBeGreaterThan(identical);
    122|   expect(update).toBeGreaterThan(cas);

```

### tests/unit/chat6-inbound-reply-body-provenance.test.ts

```
 FAIL  tests/unit/chat6-inbound-reply-body-provenance.test.ts > verified recruiter email reply provenance > requires gateway HMAC and authorized sender before posting
AssertionError: expected 'import "server-only";\nimport {create…' to contain 'verifyRecruiterMailBridgeSignature(se…'

- Expected
+ Received

- verifyRecruiterMailBridgeSignature(secret,rawBody,signature)
+ import "server-only";
+ import {createHash,randomUUID} from "node:crypto";
+ import {eq,sql} from "drizzle-orm";
+ import {z} from "zod";
+ import {getDb} from "@/db/client";
+ import {placementRecruiterInboundEmailEvents,placementRecruiterMessageMailState} from "@/db/schema";
+ import {inboundMailMessages} from "@/db/schema/inbound-mail";
+ import {notifyTpoOfRecruiterMessage} from "./recruiter-message-tpo-notification-service";
+ import {verifyRecruiterMailBridgeWithRotation,extractRecruiterEmailReply} from "./recruiter-message-email-model";
```

### tests/unit/ux-admin-chat9-batch-04.test.ts

```
 FAIL  tests/unit/ux-admin-chat9-batch-04.test.ts > chat-9 last-third admin UX rollout, batch 04 > UX-admin-tenants-01 preserves shared UX and scoped route behavior
AssertionError: expected 'import Link from "next/link";\nimport…' to match /PageHeader|SuperAdminContentDirectory…/

- Expected:
/PageHeader|SuperAdminContentDirectoryPage|redirect\(|export\s*\{\s*default\s*\}/

+ Received:
"import Link from \"next/link\";
import { getCurrentRequestContext } from \"@/auth/request-context\";
import { can } from \"@/modules/permissions/policy\";
import { isSuperAdmin } from \"@/modules/identity/context\";
import { ErrorState } from \"@/components/ui/error-state\";
import SuperAdminTenantSetup from \"./setup/page\";
import TenantDirectory from \"./directory/page\";

/** Preserve filtered directory deep links and keep the domain management
```


## Deep rows (do these FIRST)

Record each result under ## Results in the deep packet named next to the row: OK (vNext file:line + docs/legacy-source file) or FIXED. No DEFERRED.

- [ ] G2-2-015-092  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md; record in: docs/audit/gap-fix-work/deep/packets/DEEP_agent2_4.md)
