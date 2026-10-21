# Work packet: edit src/components/placements/campaign-unsubscribe-confirm.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l20-u031-public-pages.md, docs/audit/gap2/lane-1/campaign-unsubscribe-token.md

## G2-20-031-023  [P2] GAP  facet F08  effort S
- Legacy: Legacy unsubscribe success Result 'You're unsubscribed' + 'This placement cell will not email you again.' `campaign-unsubscribe/[token].js:17`.
- vNext now: vNext separate `/campaign-unsubscribe/confirmed` after submit `src/components/placements/campaign-unsubscribe-confirm.tsx:20-36`.
- Fix: Check confirmation page copy/visual Result icon; keep POST-only action.

## G2-1-025-018  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:22: exact error 'That didn’t work. Please try again.' (rendered apostrophe).
- vNext now: src/components/placements/campaign-unsubscribe-confirm.tsx:28,32: exact 'That didn't work. Please try again.' ASCII apostrophe, InlineNotice.
- Fix: Preserve typographic apostrophe only if copy matching exact.
