# Work packet: edit src/components/placements/super-admin-needs-attention.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-index.md, docs/audit/gap2/lane-11/l17-u030-drives-landing.md

## G2-10-017-017  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:19-27 — Four attention categories in order stale, unscheduled, missing letters, closing soon; missing offer letters links ALL (includes HIRED).
- vNext now: src/components/placements/super-admin-needs-attention.tsx:7-13 — Same categories, BUT missing letter links stage=OFFERED only; HIRED affected candidates hidden.
- Fix: Map offered-no-letter to ALL, filter affected candidates correctly.

## G2-10-017-018  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:210-215 — Needs attention total = sum of category `count` (affected items).
- vNext now: src/components/placements/super-admin-needs-attention.tsx:15-18 — Totals active.rows.length, counting workqueue drive rows, not affected applicant counts.
- Fix: Sum each item.count, report distinct drives separately if desired.

## G2-10-017-025  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:19-27,227-234 — Attention drilldowns use ?status=APPLIED/INTERVIEW/ALL and no status for closing soon.
- vNext now: src/components/placements/super-admin-needs-attention.tsx:7-32 — vNext uses ?stage=APPLIED/INTERVIEW/OFFERED/ALL and closing soon ALL.
- Fix: Map all category destinations, especially closing soon to drive instead of filtered app list.

## G2-10-017-037  [P1] GAP  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:145-153 — Attention error 'Couldn't check for anything that needs attention.' and Retry button.
- vNext now: src/components/placements/super-admin-needs-attention.tsx:14-44 — WorkQueue fetch within Promise.all, no attention-only error.
- Fix: Catch attention separately; retain active cards.

## G2-10-017-052  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:19-27 — Missing-offer-letter category includes OFFERED and HIRED; ALL deep link avoids exclusion.
- vNext now: src/components/placements/super-admin-needs-attention.tsx:7-13 — Stage OFFERED filter hides HIRED, category semantics broken.
- Fix: Link to ALL and add keyed attention reason so affected rows visible.

## G2-10-017-054  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:251-257,211-214 — Needs attention count is sum of affected category records.
- vNext now: src/components/placements/super-admin-needs-attention.tsx:15-24; src/components/placements/placement-operations-overview.tsx:37-48 — VNext total number of queue entries/drive rows not affected record count.
- Fix: Align precise count definition.

## G2-10-017-085  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:20-27,210-215 — Old needs attention summary counts per individual candidate/drive and sample limits.
- vNext now: src/modules/placements/tpo-operations-service.ts:465-629; src/components/placements/super-admin-needs-attention.tsx:14-24 — New workQueue one row per drive/code with count, UI sums row length.
- Fix: Project counts and samples separately, avoid conflating them.

## G2-10-017-088  [P1] GAP  facet F23  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:19-27 — Missing letters category includes HIRED; total counts sum item counts.
- vNext now: src/components/placements/super-admin-needs-attention.tsx:7-13,15-18 — New offered-only link plus total as number of workqueue records.
- Fix: Fix filter and count semantics.

## G2-17-030-015  [P1] GAP  facet F04  effort M
- Legacy: Needs attention four counts per category and sample per item with learnerName, jobTitle and detail; DrivesLanding.js:19-28,410-452
- vNext now: vNext category rows contain job/company/count, no learnerName/detail; super-admin-needs-attention.tsx:5-42
- Fix: Resolve candidate-specific attention items or explicit safe application detail, not only per-job counts.

## G2-17-030-016  [P1] GAP  facet F04  effort S
- Legacy: MissingOfferLetters deep-links unfiltered ALL to include HIRED, OFFERED; DrivesLanding.js:19-27
- vNext now: vNext OFFERED_NO_LETTER category uses `/applications?stage=OFFERED`; super-admin-needs-attention.tsx:7-10,23-25
- Fix: Change route target to ALL and document HIRED missing-letter inclusion; avoid false exclusions.

## G2-17-030-018  [P1] GAP  facet F05  effort M
- Legacy: Needs attention first3 items/category, expandable top capped set with `+N more` and Showing top X of N; DrivesLanding.js:414-453
- vNext now: vNext shows three and +category.rows.length-3; category rows job-level not individual application; super-admin-needs-attention.tsx:19-40
- Fix: Use backend category total and capped samples rather than row array length; disclose truncated sampling.

## G2-17-030-036  [P1] GAP  facet F10  effort M
- Legacy: Legacy Needs attention item click route `jobs/{id}/applications?status=APPLIED\|INTERVIEW\|ALL`, with returnTo; DrivesLanding.js:227-231,421-432
- vNext now: vNext `/admin/placements/jobs/{id}/applications?stage=...`, no returnTo; super-admin-needs-attention.tsx:21-25
- Fix: Map stage query to exact filtered statuses, carry returnTo for contextual Back link.

## G2-17-030-051  [P1] GAP  facet F18  effort S
- Legacy: Exact attention label `Offered, no offer letter attached` and no-status filter ALL; DrivesLanding.js:19-28
- vNext now: vNext label same, tab OFFERED; super-admin-needs-attention.tsx:7-10
- Fix: Change deep-link tab to ALL to include hired cases.

## G2-10-017-040  [P2] GAP  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:390-404 — If no attention, green success Alert 'No drives currently flagged in this view.'
- vNext now: src/components/placements/super-admin-needs-attention.tsx:19-24 — Plain text status message, not green Alert.
- Fix: Use success tone and icon.

## G2-17-030-028  [P2] GAP  facet F08  effort S
- Legacy: Zero attention success Alert `No drives currently flagged in this view.`; DrivesLanding.js:402-404
- vNext now: vNext same wording neutral paragraph role=status; super-admin-needs-attention.tsx:16-19
- Fix: Use green success alert treatment and check icon, not plain text.
