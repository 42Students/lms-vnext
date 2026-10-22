# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-19-001-012 [P1] GAP facet F04
- Files: src/modules/admin-ui/super-admin-scoped-people-service.ts
- Legacy: Legacy mobile/contact email from `contactMobile`/`contactMail` `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:937-938`
- Expected fix: Specify which canonical vs student contact fields are intended; expose legacy student-contact values if required and authorized.

## G2-19-001-018 [P1] GAP facet F05
- Files: src/modules/admin-ui/super-admin-scoped-people-service.ts, src/components/admin/admin-scoped-read-page.tsx
- Legacy: Legacy column sorters for name and numeric-aware roll number `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:930-936`
- Expected fix: Add clickable Name and Roll No. sort with numeric-aware roll comparator and server paging.

## G2-19-001-059 [P1] GAP facet F12
- Files: src/modules/admin-ui/super-admin-scoped-people-service.ts
- Legacy: Legacy record.suspendedAt determines actions/status `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:949-956`,1028-1065
- Expected fix: Specify mapping of suspension at membership and platform levels; ensure login block matches legacy.

## G2-19-010-002 [P1] GAP facet F01
- Files: src/components/tpo/tpo-campaign-compose.tsx, src/components/tpo/tpo-campaign-send-control.tsx
- Legacy: Legacy GET/POST routes `/api/v1/tpo/campaigns`, without draft URL `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoEmailCampaignController.java:17-42`
- Expected fix: Document API mapping; migrate legacy direct-send bookmarks to controlled draft/confirm workflow.

## G2-19-010-004 [P1] GAP facet F02
- Files: src/components/tpo/tpo-campaign-compose.tsx, src/components/tpo/tpo-campaign-send-control.tsx
- Legacy: Legacy composer one modal `Email N recruiters` with Subject and Email fields, immediate Send `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:20-44`
- Expected fix: Match modal density/entry and clearly show 2-step safety workflow; don't send without explicit confirmation.

## G2-19-010-021 [P1] GAP facet F06
- Files: src/components/tpo/tpo-campaign-compose.tsx, src/components/tpo/tpo-campaign-send-control.tsx
- Legacy: Legacy direct Send click validates then POST with subject/body/recruiterLeadIds `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:22-29`
- Expected fix: Retain intentional double-confirm safety, update entry help and completion states.

## G2-2-006-004 [P1] MISSING facet F03
- Files: (none, new feature)
- Legacy: LF:143-147 Add attachment type and resources, LF:163-181 upload handling
- Expected fix: Implement 1-30 resource builder (INSTRUCTIONS, PDF, FILE, LINK) with title/reorder and upload.

## G2-2-006-058 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LS:152-164 1-30 typed resources nested JSON
- Expected fix: Add appropriate normalized/material payload tables and constraints for all types.

## G2-2-010-012 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: LF:133-151 College Admin no user-editable policy input
- Expected fix: Remove College Admin save actions until explicit owner approval for expanded rights.

## G2-2-012-049 [P1] GAP facet F19
- Files: (none, new feature)
- Legacy: LC:47 list cap8+count exact
- Expected fix: Add independent COUNT(*) separate from limited preview and avoid hidden totals.

## G2-2-014-028 [P1] GAP facet F11
- Files: (none, new feature)
- Legacy: LC:100-104 auth principal required; admins can update owned college courses
- Expected fix: Provide college-admin bulk status functionality with central course permission.

## G2-2-019-001 [P1] MISSING facet F01
- Files: src/app/(authenticated)/admin/announcements/page.tsx
- Legacy: AdminNotificationDeliveryController.java:22-37 backend-only operator endpoints; frontend AdminService.js:516-524 exports retry/cancel clients
- Expected fix: Add scoped notification delivery history/operator entry point and controls.

## G2-2-002-019 [P1] GAP facet F13
- Files: (none, new feature)
- Legacy: LC:16-17 false makes R2StorageUtils bean absent (LU:29-31)
- Expected fix: Ensure consumers show unavailable capability rather than 500, and avoid loading dependent route before guard.

## G2-2-001-067 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LS:65-68,95-108 DB audit_finding, audit_finding_event; LI:266-284 audit_finding_file, audit_finding_sync
- Expected fix: Add append-only file ledger and full sync metadata with constraints/indexes.

## G2-20-004-049 [P1] GAP facet F15
- Files: src/app/request-demo/page.tsx
- Legacy: Demo email is user-initiated mailto: hello@42lms.com with subject `Request a Demo — 42 LMS` and structured body; `docs/legacy-source/frontend/src/components/marketing/data.js:7-18`, `docs/legacy-source/frontend/src/pages/request-demo.js:73-82`
- Expected fix: Restore exact subject and structured body or document intentional contact workflow change.

## G2-20-028-010 [P1] GAP facet F10
- Files: src/app/(authenticated)/admin/projects/[projectId]/page.tsx
- Legacy: Old replaces retaining query docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:17-24
- Expected fix: Forward query

## G2-20-008-040 [P1] GAP facet F10
- Files: src/app/request-demo/page.tsx
- Legacy: Demo goes to /request-demo where prefilled mailto has subject 'Request a Demo — 42 LMS' and body fields; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:279-284`, `docs/legacy-source/frontend/src/components/marketing/data.js:10-18`
- Expected fix: Restore mailto structured body (Name/Organization/Role/Phone/problem) and exact subject or adopt proper lead form.

## G2-3-021-010 [P1] MISSING facet F05
- Files: src/modules/bug-tracker/reporter-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/tracker/issues/[issueId].js:45-79`
- Expected fix: Legacy reporter issue detail loads activity independently and tolerates secondary fetch failure; vNext reporter detail service returns only report metadata. Add owner-scoped timeline projection.

## G2-3-021-044 [P1] MISSING facet F23
- Files: src/app/(authenticated)/tracker/issues/[publicId]/page.tsx, src/modules/bug-tracker/reporter-service.ts
- Legacy: `docs/legacy-source/frontend/src/components/tracker/ActivityTimeline.jsx:21-43`, `docs/legacy-source/frontend/src/pages/tracker/issues/[issueId].js:45-79`
- Expected fix: Legacy issue detail exposes full chronological Activity card to issue viewer, vNext ordinary reporter cannot access an event timeline and super-admin history is collapsed/reversed. Restore role-safe history and default placement.

## G2-11-019-029 [P1] GAP facet F06
- Files: src/components/tpo/recruiter-lead-detail-workspace.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:204-205`
- Expected fix: Legacy Invite/Resend invite opens InviteModal with actual send; vNext creates link and manual copy/email draft, automatic delivery unavailable.

## G2-11-019-047 [P1] GAP facet F11
- Files: src/components/tpo/recruiter-lead-detail-workspace.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:204-205`
- Expected fix: Legacy could invite an unjoined lead with email but no explicitly linked companyRelationship; vNext disabled when companyRelationshipId absent.

## G2-11-019-059 [P1] GAP facet F15
- Files: src/components/tpo/recruiter-lead-detail-workspace.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:204-205`
- Expected fix: Legacy InviteModal dispatches actual send invitation, vNext explicitly no automatic email delivery and provides mailto/copy. Owner must approve deviation.

## G2-11-019-077 [P1] MISSING facet F23
- Files: src/components/tpo/recruiter-lead-detail-workspace.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:204-207`
- Expected fix: Company contextual Team talk URL omitted and linked-account prerequisite added; restore topic link.

## G2-11-019-079 [P1] MISSING facet F23
- Files: src/components/tpo/recruiter-lead-detail-workspace.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:205-205`
- Expected fix: Direct Send Invite parity not available: explicit auto email unavailable message, manual link only.

## G2-11-022-020 [P1] GAP facet F04
- Files: src/app/(authenticated)/tpo/reports/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:63-72`
- Expected fix: Legacy `placedUnique` uses uniqueness and Not accepted yet=placedUnique−acceptedUnique; vNext uses placed students and offers−acceptedOffers, a different gap.

## Lane 9 verification disposition (2026-10-22)

- DEFERRED — G2-19-001-012: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-19-001-018: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-19-001-059: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-19-010-002: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-19-010-004: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-19-010-021: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-2-006-004: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-2-006-058: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-2-010-012: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-2-012-049: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-2-014-028: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-2-019-001: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-2-002-019: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-2-001-067: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-20-004-049: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-20-028-010: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-20-008-040: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-3-021-010: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-3-021-044: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-11-019-029: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-11-019-047: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-11-019-059: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-11-019-077: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-11-019-079: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-11-022-020: implementation and regression checks not independently completed; no parity claim.
