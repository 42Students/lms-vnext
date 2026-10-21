# Work packet (wave 2): edit src/components/verification/VerificationWorkspace.tsx

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-verification.md, docs/audit/gap2/lane-9/college-admin-verification.md

## G2-10-024-016  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:357-375 — Roll Number and decidedByName displayed table; relative dates with full tooltip.
- vNext now: src/modules/verification/staff-queue-service.ts:46-50,101-106; src/components/verification/VerificationWorkspace.tsx:103-105 — Queue cards may lack roll/decider, display absolute IST submission.
- Fix: Expose roll, decidedBy and localized relative timestamps

## G2-10-024-026  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:430-431 — No rows copy Nobody is waiting, explanatory sentence.
- vNext now: src/components/verification/VerificationWorkspace.tsx:76-82 — Default without legacyTpoCopy gives 'No matching verification requests on this page'.
- Fix: Use exact empty message for truly empty Waiting tab

## G2-10-024-065  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:423-429 — Queue loading uses TpoDataTable skeleton, error inline with Retry.
- vNext now: src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx:50-60; src/components/verification/VerificationWorkspace.tsx:73-83 — Server ErrorState on failure, simple textual pending.
- Fix: Render legacy table skeleton

## G2-10-024-066  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:430-431 — Waiting empty title 'Nobody is waiting'.
- vNext now: src/components/verification/VerificationWorkspace.tsx:76-82 — Default 'No matching verification requests on this page'.
- Fix: Differentiate empty queue from filtered empty

## G2-10-024-076  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:423-433 — Dense TpoDataTable height calc(100vh−380px), horizontal scroll.
- vNext now: src/components/verification/VerificationWorkspace.tsx:84-110 — Vertical records list at all widths.
- Fix: Restore desktop table and mobile column overflow

## G2-10-024-085  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:430-431 — 'Nobody is waiting' / 'Students appear here when they send their education or identity.'
- vNext now: src/components/verification/VerificationWorkspace.tsx:76-82 — Default differs unless legacyTpoCopy enabled.
- Fix: Set original empty messages in SuperAdmin

## G2-9-020-006  [P2] GAP  facet F02  effort L
- Legacy: Legacy review queue is 100vh-380px scroll table `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:423-431`
- vNext now: Vertical plain cards list with custom pagination `src/components/verification/VerificationWorkspace.tsx:84-110` `src/components/verification/CollegeVerificationPanel.tsx:218-229`
- Fix: Restore compact table and vertical scroll behavior.

## G2-9-020-007  [P2] GAP  facet F03  effort M
- Legacy: Status segmented tabs Waiting / Sent back / Verified with counts `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:401-405`
- vNext now: Tabs counts and labels in VerificationWorkspace `src/components/verification/VerificationWorkspace.tsx:46-60`
- Fix: Match segmented control compact sizing and pill treatment.

## G2-9-020-011  [P2] GAP  facet F04  effort L
- Legacy: Legacy columns Student, Roll, Batch, Branch (hidden), Section, Status, Marksheets, Sent/Verified/Sent back, By, Reason, Review/Open `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:357-377`
- vNext now: New list cards student name, roll, state, links, section/batch/branch, marksheets, decision and action `src/components/verification/VerificationWorkspace.tsx:84-109`
- Fix: Implement same column order, compact rows, expandable columns.

## G2-9-020-013  [P2] GAP  facet F04  effort S
- Legacy: Legacy verification dates relative fromNow tooltip absolute `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:367-373`
- vNext now: New date explicit medium date/time IST `src/components/verification/VerificationWorkspace.tsx:103-106`
- Fix: Restore relative dates + full timestamp tooltip with IST.

## G2-9-020-014  [P2] GAP  facet F04  effort M
- Legacy: Legacy Roll column visible by default `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:357-360`
- vNext now: Roll no. shown as secondary line only if provided `src/components/verification/VerificationWorkspace.tsx:85-88`
- Fix: Restore Roll column, source roll fields and fallback.

## G2-9-020-017  [P2] GAP  facet F05  effort M
- Legacy: Search includes student, roll, branch `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:423-429`
- vNext now: New list search disabled locally; server filter by users.displayName `src/components/verification/VerificationWorkspace.tsx:61-65` `src/modules/verification/staff-queue-service.ts:55-59`
- Fix: Restore roll/branch search and preserve cross-page filtering.

## G2-9-020-020  [P2] GAP  facet F05  effort S
- Legacy: Legacy click table row opens student drawer `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:423-428`
- vNext now: Card offers separate Review button `src/components/verification/VerificationWorkspace.tsx:107-108`
- Fix: Add row click and keyboard equivalent.

## G2-9-020-054  [P2] GAP  facet F16  effort L
- Legacy: Legacy table fixed height and Drawer 760px `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:423-440`
- vNext now: New cards flex wrapped and responsive controls `src/components/verification/VerificationWorkspace.tsx:84-109` `src/components/verification/CollegeVerificationPanel.tsx:128-131,218-240`
- Fix: Recreate legacy widths/table at desktop, stacked usable mobile.

## G2-9-020-058  [P2] GAP  facet F18  effort M
- Legacy: Legacy Student, Roll, Branch header labels `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:357-377`
- vNext now: New displays student cards instead of table headers `src/components/verification/VerificationWorkspace.tsx:84-109`
- Fix: Restore literal headings.

## G2-10-024-015  [P3] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:34-36 — Student name firstName+lastName fallback Student.
- vNext now: src/components/verification/VerificationWorkspace.tsx:85-86; src/modules/verification/staff-queue-service.ts:101-102 — New displayName fallback Learner.
- Fix: Preserve fallback and full-name formatting

## G2-10-024-020  [P3] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:120-130 — Marksheets All uploaded/Some missing/Not an Education check.
- vNext now: src/components/verification/VerificationFilterPanel.tsx:65-69; src/components/verification/VerificationWorkspace.tsx:98-102 — Any/Missing/Present filter and rows label counts.
- Fix: Restore labels and NA state

## G2-10-024-079  [P3] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:423-429 — Table supports row click and keyboard-accessible Review button.
- vNext now: src/components/verification/VerificationWorkspace.tsx:84-109 — Button retained; row not clickable.
- Fix: Make row click/focus equivalent or label it
