# Work packet (wave 2): edit src/components/verification/TpoVerificationPanel.tsx

26 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l11-u025-tpo-verification.md

## G2-11-025-006  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:407-433`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:50-85`
- Fix: Legacy inline Needs a closer look chips, then TpoDataTable; vNext local marksheets/attention grid and collapsible bulk action above VerificationWorkspace.

## G2-11-025-007  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:435-459`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:85-94`
- Fix: Legacy review Drawer width760 with timeline in drawer, vNext VerificationReviewDrawer from selected row and sequential review in TpoVerificationPanel. Confirm width/sheet geometry.

## G2-11-025-008  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:461-471`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:74-85`
- Fix: Legacy ActionsWindow bulk action modal and separate Send back Modal; vNext TpoRosterVerificationBulk in `<details>` and shared review drawer.

## G2-11-025-009  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:401-406`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:79-84`
- Fix: Legacy Waiting/Sent back/Verified Segmented tabs with counts inline above table; vNext tab navigation inside VerificationWorkspace plus status Select outside.

## G2-11-025-010  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:408-415`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:53-57`
- Fix: Legacy Needs a closer look chips A marksheet missing/Updates to verified details/Waiting over a week; vNext moves update shortcut to button and other filters in dropdown.

## G2-11-025-011  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:357-376`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:79-84`
- Fix: Legacy table Student/Roll/Batch/Branch(hidden)/Section/Status/Marksheets/Sent/By/Reason/action; vNext shared VerificationWorkspace columns need explicit audit to restore every header.

## G2-11-025-013  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:303-338`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:74-85`
- Fix: Legacy Act on all / Act on selected menu supports Review one by one, Verify without opening, Send back and Send message; vNext Review one by one and bulk Verify/Send back, verify Send message parity.

## G2-11-025-020  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:120-131`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:58-73`
- Fix: Legacy marksheets tri-state All uploaded/Some missing/Not an Education check, vNext local marksheets single select with attention flag.

## G2-11-025-024  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:408-415`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:25-28`
- Fix: Legacy attention shortcuts computed from all queue rows; vNext local attention checks only current authorized page. Don't label page counts as global.

## G2-11-025-027  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:248-253`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:74-78`
- Fix: Legacy refuses blind bulk verification when any required document missing and identifies skipped names, vNext bulk action filter must exclude same records.

## G2-11-025-028  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:252-270`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:74-78`
- Fix: Legacy verify-many confirm mentions checking college records another way and actor audit, includes excluded names. Verify new bulk acknowledgment and partial errors.

## G2-11-025-036  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:435-459`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:85-94`
- Fix: Legacy Drawer width760 and title Student · roll with Next/Finish x of n; vNext VerificationReviewDrawer separately mounted and may differ in detail navigation.

## G2-11-025-038  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:253-274`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:74-78`
- Fix: Legacy Verify without opening confirm Modal and bulk preview with skipped list; vNext verification bulk form details changes dialog sequence.

## G2-11-025-039  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:303-338`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:74-78`
- Fix: Legacy ActionsWindow for 3-4 bulk actions, vNext one Verify profiles / Send back for correction disclosure; preserve action names.

## G2-11-025-043  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:248-274`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:74-78`
- Fix: Legacy bulk verifyMany server command one batch with partial result, vNext TpoRosterVerificationBulk may issue different granular actions. Verify transaction/result semantics.

## G2-11-025-052  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:211-216`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:30-42`
- Fix: Legacy sequential review advances only when no other section pending, vNext sequence is row-based and advances after section saved; ensure same learner second section isn't skipped.

## G2-11-025-067  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:402-415`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:53-83`
- Fix: Legacy Segmented keyboard/aria-pressed and Needs a closer look buttons, vNext Status Select+links/disclosure changes tab semantics.

## G2-11-025-068  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:435-446`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:30-42`
- Fix: Legacy review index N of M and Next/Finish remains in Drawer header, vNext panel sequence index state; match accessible progress/live announcement.

## G2-11-025-069  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:249-258`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:74-78`
- Fix: Legacy irreversible bulk confirm includes named excluded checks and checkbox acknowledgment; verify screen reader announces exclusions.

## G2-11-025-071  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:408-414`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:53-57`
- Fix: Legacy Needs a closer look: A marksheet missing · N, Waiting over a week · N vs new Filter/Update shortcut.

## G2-11-025-072  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:303-321`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:74-78`
- Fix: Legacy bulk action labels Start with the first of N, Verify without opening, Send back, Send a message vs new Review one by one and combined Verify profiles / Send back.

## G2-11-025-079  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:198-206`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:22-29`
- Fix: Legacy studentRequestSeq aborts stale open detail responses; vNext selected/sequence switch must not show wrong prior learner.

## G2-11-025-082  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:332-337`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:74-78`
- Fix: Legacy placement bulkNudge messaging provider for student reminders; vNext TPO panel only verifies, must locate separate outreach.

## G2-11-025-087  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:211-216`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:30-42`
- Fix: Legacy sequential review per student with multiple sections vs new sequenceRows per section, ensure completion semantics.

## G2-11-025-056  [P3] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:430-431`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:79-84`
- Fix: Legacy empty Nobody is waiting / Nothing here yet and accompanying subtitle; vNext shared EmptyState should match exact copy.

## G2-11-025-073  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:430-431`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:79-84`
- Fix: Legacy Nobody is waiting / Students appear here when they send their education or identity; ensure exact empty wording.
