# Work packet (wave 2): edit src/modules/placements/company-share/column-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/company-share-token.md

## G2-1-029-017  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:131: stage uses STAGE_LABEL display text.
- vNext now: src/modules/placements/company-share/column-model.ts:58: stage copied internal screening status; P:60 renders unformatted.
- Fix: Map stage enum through legacy label dictionary.

## G2-1-029-018  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:130: projects column fans out GitHub, Portfolio.
- vNext now: src/modules/placements/company-share/column-model.ts:3-16: explicit GITHUB/PORTFOLIO keys, no dynamic projects fanout.
- Fix: Map old selected columns to equivalent keys, preserve order.

## G2-1-029-060  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:9: UG %, Resume, Stage, '-' empty.
- vNext now: src/modules/placements/company-share/column-model.ts:4-8 and P:60: UG % band, Resume link, raw status, Not recorded.
- Fix: Match exact labels, stage display and placeholders.

## G2-1-029-069  [P2] GAP  facet F22  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:130-132: selected columns from server with applicantId automatically first, stage and resume projections.
- vNext now: src/modules/placements/company-share/column-model.ts:3-16,43-65: schema selectedColumns; Applicant ID may not be included, UG band and resume null.
- Fix: Preserve selected column order and mandatory identity field.
