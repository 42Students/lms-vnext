# Work packet: edit src/modules/announcements/tpo-notice-form-error-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-announcements.md

## G2-11-005-049  [P2] GAP  facet F07  effort S
- Legacy: Title validation message Give it a title (no punctuation) `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:93`
- vNext now: vNext Give it a title. with period `src/modules/announcements/tpo-notice-form-error-model.ts:5`
- Fix: Preserve exact field message

## G2-11-005-050  [P2] GAP  facet F07  effort S
- Legacy: Body required message Write the announcement (no punctuation) `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:96`
- vNext now: vNext Write the announcement. with period `src/modules/announcements/tpo-notice-form-error-model.ts:6`
- Fix: Exact error

## G2-11-005-055  [P2] GAP  facet F07  effort S
- Legacy: Save failure toast server message or Couldn't save `docs/legacy-source/frontend/src/pages/tpo/announcements.js:49`
- vNext now: Known error code display via inline notice `src/modules/announcements/tpo-notice-form-error-model.ts:3`
- Fix: Preserve server field guidance with safe messages
