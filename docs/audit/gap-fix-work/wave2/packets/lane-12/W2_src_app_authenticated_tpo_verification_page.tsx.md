# Work packet (wave 2): edit src/app/(authenticated)/tpo/verification/page.tsx

21 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/profile-verification-controller.md, docs/audit/gap2/lane-12/l16-u031-placements-end-to-end.md, docs/audit/gap2/lane-3/l11-u025-tpo-verification.md, docs/audit/gap2/lane-16/u031-placements-end-to-end.md

## G2-1-010-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/ProfileVerificationController.java:49-55`: staff GET /profile-verification/access returns canVerify, collegeId and counts.
- vNext now: `src/app/(authenticated)/tpo/verification/page.tsx:24-27`,`src/modules/placements/tpo-verification-queue-service.ts:20-38`: TPO page server-loads permission flags plus counts.
- Fix: Expose/translate access response for old sidebar clients; handle disabled and permission separately.

## G2-1-010-003  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/ProfileVerificationController.java:59-67`: queue and selected student have GET endpoints.
- vNext now: `src/app/(authenticated)/tpo/verification/page.tsx:16-27`,`src/modules/placements/tpo-verification-queue-service.ts:20-38`: server-rendered query model and panel, not old URL.
- Fix: Map query filters/selected learner routes to vNext UUID membership pages.

## G2-1-010-008  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:323-345`: queue lists verification records with old submissions first.
- vNext now: `src/app/(authenticated)/tpo/verification/page.tsx:47-118`: filter grid, export disclosures and results panel.
- Fix: Ensure old waiting-first queue has same visual priority and category count.

## G2-1-010-012  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/ProfileVerificationController.java:91-100`: setting exposed as tpoCanVerify toggle.
- vNext now: `src/app/(authenticated)/tpo/verification/page.tsx:113-118`: permission banner but not toggle on TPO read page.
- Fix: Place setting control only for COLLEGE_ADMIN/SUPER_ADMIN, readable disabled state for TPO.

## G2-1-010-017  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:361-365`: staff detail student first/last/roll/branch plus latest 50 event history.
- vNext now: `src/modules/placements/tpo-verification-queue-service.ts:104-112`: queue row summary; `src/app/(authenticated)/tpo/verification/page.tsx:118`: panel, no history in top page.
- Fix: Ensure detail view includes verification event history up to 50 ordered DESC.

## G2-1-010-020  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/ProfileVerificationController.java:60-62`: optional status/section converted uppercase; blank becomes null.
- vNext now: `src/app/(authenticated)/tpo/verification/page.tsx:47-56`: tab WAITING/SENT_BACK/VERIFIED, kind ALL/EDUCATION/IDENTITY.
- Fix: Translate SUBMITTED and UPDATE_PENDING status exact into waiting-state subfilter.

## G2-16-031-008  [P2] GAP  facet F03  effort S
- Legacy: tpo/verification.js:16-18 exact subtitle 'Check students’ education and identity against their documents. Verified marks are what eligibility uses.'
- vNext now: src/app/(authenticated)/tpo/verification/page.tsx:29-31 new subtitle 'Review learner education and identity verification requests.'
- Fix: Restore exact old Verification helper sentence on PageHeader without an eyebrow

## G2-16-031-051  [P2] GAP  facet F18  effort S
- Legacy: tpo/verification.js:16-18 legacy long Verification subtitle
- vNext now: src/app/(authenticated)/tpo/verification/page.tsx:30-31 shorter 'Review learner education and identity verification requests.'
- Fix: Restore legacy text, maintain title 'Verification', align right back action only if legacy had it

## G2-11-025-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/verification.js:12-12`
- vNext now: `src/app/(authenticated)/tpo/verification/page.tsx:25-31`
- Fix: Legacy marks verification active sidebar on mount; vNext PageHeader with Back to students, verify shell navigation highlight.

## G2-11-025-003  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/verification.js:16-17`
- vNext now: `src/app/(authenticated)/tpo/verification/page.tsx:29-31`
- Fix: Exact subtitle Check students' education and identity against their documents. Verified marks are what eligibility uses. replaced with Review learner education and identity verification requests.

## G2-11-025-004  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/verification.js:18-19`
- vNext now: `src/app/(authenticated)/tpo/verification/page.tsx:26-31`
- Fix: Legacy shared VerificationWorkspace used by College Admin/Super Admin/TPO, vNext role-specific TpoVerificationPanel with shared VerificationWorkspace embedded.

## G2-11-025-005  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:383-405`
- vNext now: `src/app/(authenticated)/tpo/verification/page.tsx:29-47`
- Fix: Legacy single full-width Card with status Segmented tabs atop table, vNext header followed export dropdown and large filtering form before embedded queue.

## G2-11-025-012  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:424-431`
- vNext now: `src/app/(authenticated)/tpo/verification/page.tsx:47-100`
- Fix: Legacy queue search/filter panel TpoDataTable with grouped What to check and Whose; vNext top-level multi-grid Status/Section/Search/More filters and local marksheet/attention.

## G2-11-025-019  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:122-131`
- vNext now: `src/app/(authenticated)/tpo/verification/page.tsx:47-100`
- Fix: Legacy grouped checklist can select multiple Education+Identity sections simultaneously; vNext Section single select ALL/EDUCATION/IDENTITY.

## G2-11-025-054  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:379-382`
- vNext now: `src/app/(authenticated)/tpo/verification/page.tsx:110-118`
- Fix: Legacy access failure PanelError, loading skeleton and canVerify denial message; vNext SSR can render different denial/warning without skeleton.

## G2-11-025-055  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:418-422`
- vNext now: `src/app/(authenticated)/tpo/verification/page.tsx:102-110`
- Fix: Legacy cap warning Search, filters and counts below cover only these. Verify these first and next appear; vNext says Showing first1,000 ... Narrow filters, now server pages exist.

## G2-11-025-059  [P2] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:424-426`
- vNext now: `src/app/(authenticated)/tpo/verification/page.tsx:32-44`
- Fix: Legacy TpoDataTable built-in CSV exportName verification-{view}; vNext Export verification records collapsible and individual Waiting/Sent back/Verified CSV links.

## G2-11-025-064  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:401-433`
- vNext now: `src/app/(authenticated)/tpo/verification/page.tsx:47-100`
- Fix: Legacy single Card, horizontal Segmented status and filter flyout; vNext multi-grid filters above list, changing desktop hierarchy.

## G2-11-025-086  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:401-433`
- vNext now: `src/app/(authenticated)/tpo/verification/page.tsx:32-100`
- Fix: Exact Card/Segmented/Needs a closer look/work queue positions displaced by export and large filters; restore original visual hierarchy.

## G2-16-031-080  [P3] GAP  facet F18  effort S
- Legacy: tpo/verification.js:17 exact verified-marks subtitle.
- vNext now: tpo/verification/page.tsx:29-30 says `Review learner education and identity verification requests.`
- Fix: Use original phrasing and explicit eligibility consequence.

## G2-11-025-070  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/verification.js:16-17`
- vNext now: `src/app/(authenticated)/tpo/verification/page.tsx:29-31`
- Fix: Restore exact original subtitle and header spacing.
