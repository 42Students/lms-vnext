# Work packet (wave 2): edit src/components/verification/VerificationReviewDrawer.tsx

22 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-verification.md, docs/audit/gap2/lane-3/l11-u025-tpo-verification.md

## G2-10-024-007  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:435-459 — Review Drawer 760px, multiple section cards and History timeline.
- vNext now: src/components/verification/VerificationReviewDrawer.tsx:73-177 — Drawer 600px, stacked snapshot sections, history collapsed.
- Fix: Restore 760px width, section Cards and exposed timeline

## G2-10-024-013  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:75-105 — Review shows Education/Identity state Tags, document buttons and per-section actions.
- vNext now: src/components/verification/VerificationReviewDrawer.tsx:85-146 — Snapshot comparisons and separate confirmation panel.
- Fix: Use visible section headings/tags/buttons and snapshot diff

## G2-10-024-014  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:450-455 — History Card Ant Timeline with event labels and date.
- vNext now: src/components/verification/VerificationReviewDrawer.tsx:147-175 — Collapsed details list of events.
- Fix: Render history immediately as Timeline

## G2-10-024-019  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:98-98 — Verification date 'D MMM YYYY' and verifiedByName, fallback the college.
- vNext now: src/components/verification/VerificationReviewDrawer.tsx:149-170 — History toLocaleString en-IN time zone, actorKind fallback.
- Fix: Show single verification byline plus timeline

## G2-10-024-029  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:464-470 — Send back modal predefined reason buttons per Education vs Identity.
- vNext now: src/components/verification/VerificationReviewDrawer.tsx:124-131 — Select predefined reason plus Additional details max350.
- Fix: Restore preset reason buttons and free-form 500 text

## G2-10-024-030  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:69-76,99-103 — Per-section Verify/Send back buttons only when submitted/update waiting.
- vNext now: src/components/verification/VerificationReviewDrawer.tsx:123-146 — Similar gating, but extra confirm step and single selected section.
- Fix: Match per-section action buttons and disabled states

## G2-10-024-042  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:435-459 — Review Drawer width760, title name·roll, next/finish in upper-right.
- vNext now: src/components/verification/VerificationReviewDrawer.tsx:73-80 — Drawer width600, progress nav inside content.
- Fix: Match 760 title and header actions

## G2-10-024-043  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:464-471 — Send back separate Modal with ready reasons and text field.
- vNext now: src/components/verification/VerificationReviewDrawer.tsx:123-145 — Confirm panel inside drawer.
- Fix: Restore dedicated Send Back dialog

## G2-10-024-046  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:450-456 — History timeline displayed without user expansion.
- vNext now: src/components/verification/VerificationReviewDrawer.tsx:147-175 — History details collapsed.
- Fix: Display history on open

## G2-10-024-070  [P2] GAP  facet F14  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:52-66 — Document open through authenticated filename route, Not uploaded placeholder.
- vNext now: src/components/verification/VerificationReviewDrawer.tsx:112-121 — Private receipt URL, absent not-uploaded link; text changes.
- Fix: Show missing proof state and exact Open labels

## G2-10-024-071  [P2] GAP  facet F14  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:81-89 — Marksheet/resume document actions under Education Card.
- vNext now: src/components/verification/VerificationReviewDrawer.tsx:112-121 — One flat Private supporting documents list.
- Fix: Group documents beneath respective sections

## G2-10-024-077  [P2] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:435-439 — Drawer width760.
- vNext now: src/components/verification/VerificationReviewDrawer.tsx:73-75 — 600px width cap.
- Fix: Match width on desktop/mobile fallback

## G2-10-024-078  [P2] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:464-470 — Modal input rows3 and reason buttons wrap.
- vNext now: src/components/verification/VerificationReviewDrawer.tsx:124-145 — Select and textarea separate in drawer.
- Fix: Restore sheet/modal at mobile widths

## G2-11-025-018  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:75-102`
- vNext now: `src/components/verification/VerificationReviewDrawer.tsx:1-80`
- Fix: Legacy review shows Education table of mark entries plus Aadhaar/PAN last four digits with Open document links; inspect new drawer for identical field order/privacy and missing-document copy.

## G2-11-025-025  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:326-327`
- vNext now: `src/components/verification/VerificationReviewDrawer.tsx:1-80`
- Fix: Legacy send-back reason min3 max500 with exact Say what needs to change error, vNext review drawer validation should match.

## G2-11-025-026  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:29-32`
- vNext now: `src/components/verification/VerificationReviewDrawer.tsx:1-80`
- Fix: Legacy section-specific canned send-back reasons differ for Education vs Identity; ensure vNext drawer preserves exact reason lists.

## G2-11-025-037  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:464-471`
- vNext now: `src/components/verification/VerificationReviewDrawer.tsx:1-80`
- Fix: Legacy Send Education back modal separate with reason chips and title Send Education back; vNext drawer-based decision panel should show exact modal/CTA.

## G2-11-025-057  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:447-449`
- vNext now: `src/components/verification/VerificationReviewDrawer.tsx:1-80`
- Fix: Legacy six-row Drawer Skeleton when loading student; vNext drawer load may show alternate spinner/error states.

## G2-11-025-058  [P2] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:52-66`
- vNext now: `src/components/verification/VerificationReviewDrawer.tsx:1-80`
- Fix: Legacy doc buttons open via secure getDocumentUrl on authenticated action; vNext signed file-grant service required; align Not uploaded/Open resume/Open document.

## G2-11-025-060  [P2] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:81-95`
- vNext now: `src/components/verification/VerificationReviewDrawer.tsx:1-80`
- Fix: Legacy Education review includes marksheet table and Identity per-document button, vNext manifest-based document list; preserve exact document filename and fallback.

## G2-10-024-080  [P3] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:435-446 — Drawer Next/Finish button accessible in header.
- vNext now: src/components/verification/VerificationReviewDrawer.tsx:76-80 — Progress in nav inside drawer, equivalent keyboard actions.
- Fix: Preserve focus order and header actions

## G2-10-024-086  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:466-470 — Placeholder 'Or write what needs to change'.
- vNext now: src/components/verification/VerificationReviewDrawer.tsx:124-131 — Select option text exact, additional textarea no placeholder.
- Fix: Match placeholder and selector behavior
