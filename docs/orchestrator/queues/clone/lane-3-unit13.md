# Unit-test repair queue (unit13): lane chat-3

CI run 39849936419 on main (3c24c0c0), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [ ] `tests/unit/HR-BREAK-chat19-report-joined.test.ts` (1 failing)
- [ ] `tests/unit/chat20-verify2-workspace-legacy-tenant-metadata.test.ts` (1 failing)
- [ ] `tests/unit/sa-batch-promotion-execute.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/HR-BREAK-chat19-report-joined.test.ts

```
 FAIL  tests/unit/HR-BREAK-chat19-report-joined.test.ts > HR-BREAK-REPORT-JOINED-51: employer joined stage only includes accepted offers > leaves no shared applicant names or contacts in the funnel SQL
AssertionError: expected '\n      select id from placement_jobs…' not to contain 'm.status=\'ACTIVE\''

- Expected
+ Received

- m.status='ACTIVE'
+
+       select id from placement_jobs
+       where college_id=${collegeId}::uuid
+         and company_relationship_id=${relationshipId}::uuid
+         and status in ('PUBLISHED','CLOSED') and archived_at is null
+     ),
+     applicants as (
+       select a.id,a.status from placement_applications a
+       join jobs j on j.id=a.job_id
```

### tests/unit/chat20-verify2-workspace-legacy-tenant-metadata.test.ts

```
 FAIL  tests/unit/chat20-verify2-workspace-legacy-tenant-metadata.test.ts > legacy project overview migration > preserves authored brief content even if trusted source carries old tenant metadata
AssertionError: expected { goal: '', description: '', …(3) } to match object { goal: 'Restore lessons', …(3) }
(1 matching property omitted from actual)

- Expected
+ Received

  {
-   "completionConditions": [
-     "Project approved",
-   ],
-   "deliverables": [
-     "Release prototype",
-   ],
-   "goal": "Restore lessons",
-   "personas": [
```

### tests/unit/sa-batch-promotion-execute.test.ts

```
 FAIL  tests/unit/sa-batch-promotion-execute.test.ts > SA-academics-people-24 scoped Super Admin promotion execution > mounts the same explicit confirmation as College Admin only after readiness
AssertionError: expected 'import {Checkbox} from "@/components/…' to contain 'yearStart={input.data.yearStart}'

- Expected
+ Received

- yearStart={input.data.yearStart}
+ import {Checkbox} from "@/components/ui/checkbox";
+ import {Button} from "@/components/ui/button";
+ import {Select} from "@/components/ui/select";
+ import {Input} from "@/components/ui/input";
+ import Link from "next/link";
+ import { CollegePromotionConfirmation } from "@/components/academics/college-promotion-confirmation";
+ import { SuperAdminBatchGraduateAction } from "@/components/admin/super-admin-batch-graduate-action";
+ import { getCurrentRequestContext } from "@/auth/request-context";
+ import { PageHeader } from "@/components/ui/page-header";
```

