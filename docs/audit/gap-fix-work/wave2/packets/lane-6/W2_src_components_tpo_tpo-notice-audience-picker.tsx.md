# Work packet (wave 2): edit src/components/tpo/tpo-notice-audience-picker.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-announcements.md

## G2-11-005-038  [P2] GAP  facet F06  effort S
- Legacy: Who is it for Segmented block audience options `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:104`
- vNext now: Audience HTML Select with option dropdown `src/components/tpo/tpo-notice-audience-picker.tsx:28`
- Fix: Use Segmented control and exact label

## G2-11-005-039  [P2] GAP  facet F06  effort S
- Legacy: Batches multiselect, Pick batches, No batch is in placements `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:109`
- vNext now: Search + multiple native Select and same empty text `src/components/tpo/tpo-notice-audience-picker.tsx:44`
- Fix: Align picker visual and keyboard behavior

## G2-11-005-040  [P2] GAP  facet F06  effort S
- Legacy: Branches multiselect Pick branches `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:115`
- vNext now: Search + multiple native Select `src/components/tpo/tpo-notice-audience-picker.tsx:44`
- Fix: Match tag-style input/dropdown

## G2-11-005-041  [P2] GAP  facet F06  effort S
- Legacy: Drive selector searchable, placeholder Pick a drive `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:121`
- vNext now: Native select with additional search field `src/components/tpo/tpo-notice-audience-picker.tsx:56`
- Fix: Exact placeholder and interaction

## G2-11-005-115  [P2] GAP  facet F18  effort S
- Legacy: Label Who is it for `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:104`
- vNext now: Label Audience `src/components/tpo/tpo-notice-audience-picker.tsx:28`
- Fix: Exact label
