# Work packet: edit src/modules/announcements/super-admin-college-broadcast-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-announcements.md, docs/audit/gap2/lane-11/l19-u024-super-admin-announcement-controller.md

## G2-10-002-026  [P1] GAP  facet F06  effort S
- Legacy: Optional link with valid URL but blank label accepted and auto-fills Open `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:571-583`
- vNext now: Button validation requires label and URL both set `src/components/announcements/super-admin-college-broadcast-form.tsx:30-32` `src/modules/announcements/super-admin-college-broadcast-model.ts:14-16`
- Fix: Allow blank label with HTTPS URL and store default Open as in legacy

## G2-10-002-032  [P2] GAP  facet F07  effort S
- Legacy: Legacy missing SOME audience exact message Pick at least one `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:90-95`
- vNext now: New server message Select at least one college and disabled submission `src/modules/announcements/super-admin-college-broadcast-model.ts:19-21` `src/components/announcements/super-admin-college-broadcast-form.tsx:30-35`
- Fix: Match concise legacy field-level audience error

## G2-10-002-033  [P2] GAP  facet F07  effort S
- Legacy: Legacy invalid link message The link has to start with https:// `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:100-103` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:571-583`
- vNext now: New invalid button error Provide a button label and a valid HTTPS link `src/components/announcements/super-admin-college-broadcast-form.tsx:87-89` `src/modules/announcements/super-admin-college-broadcast-model.ts:15-16`
- Fix: Restore specific HTTPS URL error; keep label+URL mismatch separate

## G2-19-024-016  [P2] GAP  facet F07  effort S
- Legacy: POST selected target missing -> `Pick at least one placement cell`; PlacementAnnouncementService.java:360-365
- vNext now: Zod `Select at least one college` plus target-not-found/stale audience; super-admin-college-broadcast-model.ts:19-22; broadcast-service.ts:62-65
- Fix: Use legacy copy for empty picked audience while retaining strict stale/unauthorized safeguards.
