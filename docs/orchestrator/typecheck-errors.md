# Typecheck errors on main (cloud CI, 2026-10-18 01:15)

Main fails `tsc --noEmit` with ONLY the errors below (everything else is green; lint passes). Each owner lane fixes its own FIRST, restoring what merge conflicts dropped, without deleting features. Owners:
- src/components/ui/tabs.tsx: chat-17
- recruiter-drive-request-service.ts (autoReason, approvedJobId missing declarations): chat-14
- college-company-directory-service.ts and tests/integration/chat11-college-company-restore.test.ts (DirectoryQuery.status, ActiveMembership.showDeleted): chat-11
- college/placements/interviews/export route type: chat-4 or chat-11 (whoever last touched the file)

Errors:

- ﻿src/app/api/college/placements/interviews/export/route.ts(14,43): error TS2345: Argument of type '{ conflict: boolean; id: string; jobId: string; roundId: string; applicationId: string | null; studentId: string; student: string | null; company: string; companyId: string; department: string | null; .
- src/components/ui/tabs.tsx(54,28): error TS2722: Cannot invoke an object which is possibly 'undefined'.
- src/modules/placements/college-company-directory-service.ts(23,51): error TS2339: Property 'status' does not exist on type 'DirectoryQuery'.
- src/modules/placements/college-company-directory-service.ts(24,11): error TS2339: Property 'status' does not exist on type 'DirectoryQuery'.
- src/modules/placements/recruiter-drive-request-service.ts(69,61): error TS2304: Cannot find name 'autoReason'.
- src/modules/placements/recruiter-drive-request-service.ts(69,92): error TS2304: Cannot find name 'approvedJobId'.
- src/modules/placements/recruiter-drive-request-service.ts(140,47): error TS2448: Block-scoped variable 'approvedJobId' used before its declaration.
- src/modules/placements/recruiter-drive-request-service.ts(140,47): error TS2454: Variable 'approvedJobId' is used before being assigned.
- src/modules/placements/recruiter-drive-request-service.ts(141,4): error TS2448: Block-scoped variable 'approvedJobId' used before its declaration.
- src/modules/placements/recruiter-drive-request-service.ts(141,4): error TS2454: Variable 'approvedJobId' is used before being assigned.
- src/modules/placements/recruiter-drive-request-service.ts(141,31): error TS2304: Cannot find name 'autoReason'.
- tests/integration/chat11-college-company-restore.test.ts(22,40): error TS2353: Object literal may only specify known properties, and 'showDeleted' does not exist in type 'ActiveMembership'.
- tests/integration/chat11-college-company-restore.test.ts(60,79): error TS2353: Object literal may only specify known properties, and 'status' does not exist in type 'DirectoryQuery'.
- tests/integration/chat11-college-company-restore.test.ts(62,87): error TS2353: Object literal may only specify known properties, and 'status' does not exist in type 'DirectoryQuery'.
