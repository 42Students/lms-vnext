# Work packet (wave 2): edit src/components/ui/skeleton.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/cross-graceful-states.md

## G2-1-037-006  [P2] GAP  facet F02  effort S
- Legacy: legacy components/profile/ProfileSkeleton.js:11-43 avatar video completeness 10 cards
- vNext now: src/components/ui/skeleton.tsx:13-30 generic variants
- Fix: Create per-page shaped learner skeleton

## G2-1-037-041  [P2] GAP  facet F13  effort S
- Legacy: legacy components/profile/ProfileSkeleton.js:11-43 shaped first-load profile
- vNext now: src/components/ui/skeleton.tsx:13-30 generic base
- Fix: Wire exact page-specific skeleton

## G2-1-037-049  [P2] GAP  facet F16  effort S
- Legacy: legacy components/profile/ProfileSkeleton.js:35-41 xs24 xl12 grid
- vNext now: src/components/ui/skeleton.tsx:21-30 shape only
- Fix: Add same responsive grid

## G2-1-037-015  [P3] GAP  facet F05  effort S
- Legacy: legacy components/profile/ProfileSkeleton.js:35-41 10 cards in responsive list
- vNext now: src/components/ui/skeleton.tsx:21-30 count max20 generic line shapes
- Fix: Match loading list shape
