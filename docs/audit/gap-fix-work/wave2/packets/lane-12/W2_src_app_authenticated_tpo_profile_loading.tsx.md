# Work packet (wave 2): edit src/app/(authenticated)/tpo/profile/loading.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l19-u030-tpo-profile.md

## G2-19-030-040  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/profile.js:61-76 — initial ProfileSkeleton under same Profile header.
- vNext now: src/app/(authenticated)/tpo/profile/loading.tsx:1-2 — generic GracefulPageLoading text only.
- Fix: Clone profile-specific avatar/text skeleton size and title.
