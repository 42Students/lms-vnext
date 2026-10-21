# Work packet (wave 2): edit src/app/(authenticated)/hr/drives/new/page.tsx

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-new.md, docs/audit/gap2/lane-5/l12-u025-recruiter-plan-drive-controller.md

## G2-11-004-002  [P2] GAP  facet F01  effort S
- Legacy: Heading is source-dependent with All drives action to right `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:337`
- vNext now: Distinct title per source, Back to Drives link below `src/app/(authenticated)/hr/drives/new/page.tsx:100`
- Fix: Match header CTA position and title mapping

## G2-11-004-004  [P2] GAP  facet F01  effort S
- Legacy: Legacy college derives from recruiter-college session `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:85`
- vNext now: vNext explicit optional `collegeId` query, chooses authorized grant or chooser `src/app/(authenticated)/hr/drives/new/page.tsx:40`
- Fix: Preserve current-college initial selection and no-college state

## G2-11-004-005  [P2] GAP  facet F02  effort S
- Legacy: PageShell and ListingPageHeader above form and preview `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:313`
- vNext now: Flat gap-based sections and PageHeader `src/app/(authenticated)/hr/drives/new/page.tsx:99`
- Fix: Match shell container, margins and header hierarchy

## G2-11-004-010  [P2] GAP  facet F03  effort S
- Legacy: Header right action text All drives `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:339`
- vNext now: Back to Drives link in secondary nav `src/app/(authenticated)/hr/drives/new/page.tsx:103`
- Fix: Use exact All drives text and placement

## G2-11-004-073  [P2] GAP  facet F11  effort S
- Legacy: Account load failure shows Retry `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:303`
- vNext now: Inactive recruiter immediately redirects dashboard `src/app/(authenticated)/hr/drives/new/page.tsx:38`
- Fix: Separate transport failure from invalid authorization

## G2-11-004-080  [P2] GAP  facet F13  effort S
- Legacy: Account failure We couldn't load your account with Retry `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:303`
- vNext now: Redirect dashboard `src/app/(authenticated)/hr/drives/new/page.tsx:38`
- Fix: Actionable account failure screen

## G2-11-004-081  [P2] GAP  facet F13  effort S
- Legacy: NoCollegeSession with college help `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:304`
- vNext now: No active college access EmptyState/chips `src/app/(authenticated)/hr/drives/new/page.tsx:73`
- Fix: Match legacy state/return action

## G2-11-004-082  [P2] GAP  facet F13  effort S
- Legacy: Missing source We could not find that drive `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:307`
- vNext now: Global notFound `src/app/(authenticated)/hr/drives/new/page.tsx:58`
- Fix: Route-scoped missing Result

## G2-11-004-090  [P2] MISSING  facet F15  effort S
- Legacy: Preview student count rounded and names hidden `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:435`
- vNext now: Branch suggestions only; no population preview `src/app/(authenticated)/hr/drives/new/page.tsx:24`
- Fix: Restore rounded, privacy-safe student count

## G2-12-025-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy recruiter plan POST `/api/v1/recruiter/plan-drive`, session bound one college. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPlanDriveController.java:16-26,47-51`
- vNext now: vNext recruiter/HR Request a drive page chooses authorized grant, POST via placement requests service. `src/app/(authenticated)/hr/drives/new/page.tsx:26-66`, `src/modules/placements/recruiter-drive-request-service.ts:94-110`
- Fix: Bridge route/body and selected-college semantics.

## G2-12-025-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy add-college on group always 409 DRIVE_GROUPS_PAUSED. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPlanDriveController.java:63-67`
- vNext now: vNext can choose other authorized college for a separate new request; no add-college action. `src/app/(authenticated)/hr/drives/new/page.tsx:64-80`
- Fix: Preserve explicit paused multi-college extension message.

## G2-12-025-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy Request a drive page with single selected college, hire again/edit draft state. `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:81-113`
- vNext now: vNext similar one-page request with new header, More drive destinations disclosure. `src/app/(authenticated)/hr/drives/new/page.tsx:99-129`
- Fix: Match legacy page head and create section order.

## G2-12-025-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy college overview powers branch hints/counts, may be unavailable with warning. `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:140-153`
- vNext now: vNext branchSuggestions preloaded, no count shown in header. `src/app/(authenticated)/hr/drives/new/page.tsx:83-84`, `src/components/hr/hr-drive-draft-form.tsx:41-63`
- Fix: Show data-confidence warning and approximate audience preview.

## G2-12-025-008  [P2] GAP  facet F03  effort M
- Legacy: Legacy drive group status chip per college. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPlanDriveController.java:53-61`
- vNext now: vNext request stage Sent for review / Approved awaiting publication. `src/modules/placements/recruiter-drive-request-model.ts:29-31`, `src/app/(authenticated)/hr/drives/new/page.tsx:100-109`
- Fix: Preserve recruiter-visible per-college request status labels.

## G2-12-025-036  [P2] GAP  facet F13  effort M
- Legacy: Legacy list request load errors preserve form and show warning. `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:117-153`
- vNext now: vNext notFound for mismatched edit/copy and error boundary. `src/app/(authenticated)/hr/drives/new/page.tsx:83-97`
- Fix: Distinguish inaccessible old request from temporary load error.

## G2-12-025-040  [P2] GAP  facet F15  effort M
- Legacy: Legacy success navigates recruiter drive page with status. `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:263-284`
- vNext now: vNext form routes into HR drives and saved request. `src/app/(authenticated)/hr/drives/new/page.tsx:99-129`
- Fix: Link to correct request state and drive ID.

## G2-12-025-045  [P2] GAP  facet F18  effort M
- Legacy: Legacy `On campus`,`Full-time`,`Request a drive`. `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:22-29`
- vNext now: vNext title Request a drive match, modes On-site/Full-time. `src/app/(authenticated)/hr/drives/new/page.tsx:99-101`, `src/components/hr/hr-drive-draft-form.tsx:77-83`
- Fix: Align campus vs onsite term.

## G2-12-025-049  [P2] GAP  facet F21  effort M
- Legacy: Legacy uses RecruiterService API and college overview, JdUpload. `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:10-14`
- vNext now: vNext own-request service and college branch suggestions instead. `src/app/(authenticated)/hr/drives/new/page.tsx:19-24`, `src/modules/placements/recruiter-drive-request-service.ts:94-153`
- Fix: Map overview/rounds/JD metadata sources.
