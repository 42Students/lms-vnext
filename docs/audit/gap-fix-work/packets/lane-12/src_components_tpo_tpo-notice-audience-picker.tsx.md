# Work packet: edit src/components/tpo/tpo-notice-audience-picker.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-announcements.md

## G2-11-005-051  [P1] GAP  facet F07  effort S
- Legacy: Batch empty Pick at least one batch `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:108`
- vNext now: No field-level required error in picker; post error generic `src/components/tpo/tpo-notice-audience-picker.tsx:45`
- Fix: Attach selection-required message

## G2-11-005-052  [P1] GAP  facet F07  effort S
- Legacy: Branch empty Pick at least one branch `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:114`
- vNext now: Generic missing recipients response `src/components/tpo/tpo-notice-audience-picker.tsx:45`
- Fix: Field-specific branch rule

## G2-11-005-053  [P2] GAP  facet F07  effort S
- Legacy: Drive missing Pick a drive `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:121`
- vNext now: Server/route error generic choose a valid audience `src/components/tpo/tpo-notice-audience-picker.tsx:63`
- Fix: Field error Pick a drive
