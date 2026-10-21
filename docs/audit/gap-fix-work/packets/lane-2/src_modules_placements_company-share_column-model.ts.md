# Work packet: edit src/modules/placements/company-share/column-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/company-share-token.md

## G2-1-029-013  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:9: table label 'UG %' (cgpa).
- vNext now: src/modules/placements/company-share/column-model.ts:3-8: 'UG % band' instead of precise percentage.
- Fix: Record privacy policy; if precise authorized old data needed, expose secure grade with consent.

## G2-1-029-014  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:9: label 'Resume' as openable link.
- vNext now: src/modules/placements/company-share/column-model.ts:6,55: label 'Resume link' but value always null.
- Fix: Provide scanner-backed signed resume URLs or explicit unavailable state.

## G2-1-029-019  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:131: unsafe resume links displayed 'Link not shown', safe clickable Open.
- vNext now: src/modules/placements/company-share/column-model.ts:23-25,55: HTTPS-safe social URLs but resume always null.
- Fix: Add safe signed resume links with fallback label and audit.

## G2-1-029-052  [P1] GAP  facet F14  effort L
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:131: resume safeHref link opens in new tab.
- vNext now: src/modules/placements/company-share/column-model.ts:55: always null until scanner-backed signed delivery registered.
- Fix: Implement signed receipt/short TTL delivery before showing link.
