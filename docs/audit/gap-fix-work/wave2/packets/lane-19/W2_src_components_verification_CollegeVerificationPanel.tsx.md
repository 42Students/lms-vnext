# Work packet (wave 2): edit src/components/verification/CollegeVerificationPanel.tsx

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-verification.md

## G2-9-020-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy Card setting above Card table with segmented header `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:383-405`
- vNext now: New separate header, actions, review section, chips, filter, list, switch at bottom `src/components/verification/CollegeVerificationPanel.tsx:122-153,203-242`
- Fix: Move setting to top and put status/table in bordered Card.

## G2-9-020-005  [P2] GAP  facet F02  effort M
- Legacy: TPO setting Card on top, visible if setting loaded `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:389-399`
- vNext now: Bottom collapsed details toggle `src/components/verification/CollegeVerificationPanel.tsx:241-242`
- Fix: Display TPO setting in visible top card.

## G2-9-020-006  [P2] GAP  facet F02  effort L
- Legacy: Legacy review queue is 100vh-380px scroll table `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:423-431`
- vNext now: Vertical plain cards list with custom pagination `src/components/verification/VerificationWorkspace.tsx:84-110` `src/components/verification/CollegeVerificationPanel.tsx:218-229`
- Fix: Restore compact table and vertical scroll behavior.

## G2-9-020-008  [P2] GAP  facet F03  effort S
- Legacy: Needs a closer look chips within list card above table `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:407-415`
- vNext now: NeedsDoingChips in separate row before FilterPanel `src/components/verification/CollegeVerificationPanel.tsx:142-152`
- Fix: Place and style chips in same legacy order.

## G2-9-020-009  [P2] GAP  facet F03  effort M
- Legacy: Bulk action Act on all N or Act on N selected via lightning icon `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:339-351`
- vNext now: Select first 20/Preview verify/Preview send back buttons `src/components/verification/CollegeVerificationPanel.tsx:153-160`
- Fix: Restore action-window affordance and count copy while preserving preview safety.

## G2-9-020-010  [P2] GAP  facet F03  effort S
- Legacy: Legacy refresh embedded TpoDataTable `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:423-429`
- vNext now: Standalone Refresh button above workspace `src/components/verification/CollegeVerificationPanel.tsx:128-131`
- Fix: Move refresh into table toolbar.

## G2-9-020-021  [P2] GAP  facet F05  effort M
- Legacy: Legacy table local sort toggle by Roll and time `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:357-373`
- vNext now: New global dropdown Oldest/Newest/Name `src/components/verification/CollegeVerificationPanel.tsx:218-221`
- Fix: Match sortable column controls and default time order.

## G2-9-020-022  [P2] GAP  facet F05  effort M
- Legacy: Legacy TpoDataTable user-driven pagination and export `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:423-431`
- vNext now: New per-page 10/25/50 with ActionPagination `src/components/verification/CollegeVerificationPanel.tsx:222-229`
- Fix: Match table paginator and page-size display; retain server-scale safety.

## G2-9-020-023  [P2] GAP  facet F06  effort S
- Legacy: Send back reason TextArea rows3, maxLength500, preset reasons by section `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:27-32,464-470`
- vNext now: Bulk send back Textarea maxLength500, preset section reasons `src/components/verification/CollegeVerificationPanel.tsx:169-185`
- Fix: Align single and bulk textarea shape/placeholder.

## G2-9-020-025  [P2] GAP  facet F06  effort S
- Legacy: Settings on/off switch with explanatory text `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:389-399`
- vNext now: TpoVerificationSwitch nested in disclosure `src/components/verification/CollegeVerificationPanel.tsx:241-242`
- Fix: Keep toggle and contextual text visible by default.

## G2-9-020-035  [P2] GAP  facet F09  effort L
- Legacy: Legacy ActionsWindow grouped Check with review one by one, verify without opening, send back `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:302-331,461-463`
- vNext now: New inline selection and preview sections instead of ActionsWindow `src/components/verification/CollegeVerificationPanel.tsx:133-201`
- Fix: Match grouped action overlay and labels while retaining preview.

## G2-9-020-036  [P2] GAP  facet F09  effort M
- Legacy: Legacy Verify N without opening confirm modal with alternative-doc acknowledgement `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:248-275`
- vNext now: Inline preview checkbox before confirmation `src/components/verification/CollegeVerificationPanel.tsx:188-199`
- Fix: Match modal presentation, acknowledgement and consequence copy.

## G2-9-020-051  [P2] GAP  facet F14  effort M
- Legacy: Legacy table export verification-waiting/sent_back/verified from current view `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:423-429`
- vNext now: New VerificationExportControl query tied to server filters `src/components/verification/CollegeVerificationPanel.tsx:120-130`
- Fix: Validate CSV columns/status names, cap behavior and filename naming.

## G2-9-020-054  [P2] GAP  facet F16  effort L
- Legacy: Legacy table fixed height and Drawer 760px `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:423-440`
- vNext now: New cards flex wrapped and responsive controls `src/components/verification/VerificationWorkspace.tsx:84-109` `src/components/verification/CollegeVerificationPanel.tsx:128-131,218-240`
- Fix: Recreate legacy widths/table at desktop, stacked usable mobile.

## G2-9-020-057  [P2] GAP  facet F18  effort S
- Legacy: Legacy Needs a closer look: and A marksheet missing, Updates to verified details, Waiting over a week `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:289-295,407-415`
- vNext now: New Needs doing: chip group driven by attention-shortcuts `src/components/verification/CollegeVerificationPanel.tsx:142-148`
- Fix: Match legacy group label and exact three chip texts.

## G2-9-020-069  [P2] GAP  facet F23  effort L
- Legacy: Legacy queue has client-side table column hiding, sorting, whole-view actions `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:356-377,423-431`
- vNext now: New server-side pagination, export, card UI, selection cap20 `src/components/verification/CollegeVerificationPanel.tsx:153-160,218-229`
- Fix: Preserve functional new safety but restore visible table interactions.

## G2-9-020-040  [P3] GAP  facet F10  effort S
- Legacy: PUT settings tpoCanVerify via /api/v1/profile-verification/settings `docs/legacy-source/frontend/src/api/Services/VerificationService.js:22-23`
- vNext now: TpoVerificationSwitch wired through /api/college/verification/settings `src/components/verification/CollegeVerificationPanel.tsx:241-242`
- Fix: Keep same effective setting and permission.
