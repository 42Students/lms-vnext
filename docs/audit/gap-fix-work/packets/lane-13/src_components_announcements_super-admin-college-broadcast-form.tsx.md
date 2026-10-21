# Work packet: edit src/components/announcements/super-admin-college-broadcast-form.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-announcements.md

## G2-10-002-020  [P1] GAP  facet F06  effort S
- Legacy: New modal defaults target To ALL; radio options Every placement cell N and Some placement cells `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:37-41` `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:86-95`
- vNext now: Broadcast form starts SELECTED_COLLEGES with none selected and uses select rather than radio `src/components/announcements/super-admin-college-broadcast-form.tsx:14-17` `src/components/announcements/super-admin-college-broadcast-form.tsx:59-72`
- Fix: Default to ALL and render legacy radio options with counts

## G2-10-002-026  [P1] GAP  facet F06  effort S
- Legacy: Optional link with valid URL but blank label accepted and auto-fills Open `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:571-583`
- vNext now: Button validation requires label and URL both set `src/components/announcements/super-admin-college-broadcast-form.tsx:30-32` `src/modules/announcements/super-admin-college-broadcast-model.ts:14-16`
- Fix: Allow blank label with HTTPS URL and store default Open as in legacy

## G2-10-002-043  [P1] GAP  facet F10  effort M
- Legacy: Legacy POST one broadcast to /api/v1/superadmin/announcements with title body pinned link showUntil audience collegeIds `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:44-55` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAnnouncementController.java:40-44`
- vNext now: New POST /api/admin/announcements/broadcast with audienceMode collegeIds reviewedCollegeIds title message scheduledAt expiresAt publishConsent `src/components/announcements/super-admin-college-broadcast-form.tsx:33-44` `src/app/api/admin/announcements/broadcast/route.ts:8-16`
- Fix: Define migration-compatible broadcast contract and map fields exactly including immutable target semantics

## G2-10-002-052  [P1] GAP  facet F12  effort L
- Legacy: Legacy superadmin broadcast has no scheduling and is inserted sent_at UTC_TIMESTAMP `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:375-388`
- vNext now: New form supports scheduledAt; backend omits immediate notification for future schedule `src/components/announcements/super-admin-college-broadcast-form.tsx:91-98` `src/modules/announcements/super-admin-college-broadcast-service.ts:90-112`
- Fix: Do not claim scheduled bell delivery until worker processes scheduled broadcasts

## G2-10-002-031  [P2] GAP  facet F07  effort S
- Legacy: Legacy required title exact text Give it a title and body Write the announcement `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:81-85`
- vNext now: Create form disables Review until nonblank fields but no equivalent field-level exact messages `src/components/announcements/super-admin-college-broadcast-form.tsx:30-35` `src/components/announcements/super-admin-college-broadcast-form.tsx:73-76`
- Fix: Surface exact field validation messages beside missing title and body

## G2-10-002-032  [P2] GAP  facet F07  effort S
- Legacy: Legacy missing SOME audience exact message Pick at least one `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:90-95`
- vNext now: New server message Select at least one college and disabled submission `src/modules/announcements/super-admin-college-broadcast-model.ts:19-21` `src/components/announcements/super-admin-college-broadcast-form.tsx:30-35`
- Fix: Match concise legacy field-level audience error

## G2-10-002-033  [P2] GAP  facet F07  effort S
- Legacy: Legacy invalid link message The link has to start with https:// `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:100-103` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:571-583`
- vNext now: New invalid button error Provide a button label and a valid HTTPS link `src/components/announcements/super-admin-college-broadcast-form.tsx:87-89` `src/modules/announcements/super-admin-college-broadcast-model.ts:15-16`
- Fix: Restore specific HTTPS URL error; keep label+URL mismatch separate

## G2-10-002-034  [P2] GAP  facet F07  effort S
- Legacy: Legacy invalid expiry message The end date has passed and Give a date and time `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:585-595`
- vNext now: New timing message Enter valid local schedule and expiry values; expiry must follow the schedule `src/components/announcements/super-admin-college-broadcast-form.tsx:97-99`
- Fix: Distinguish passed expiry and malformed date with legacy text; preserve new after-schedule rule

## G2-10-002-035  [P2] GAP  facet F07  effort M
- Legacy: Legacy POST errors show server message or error fallback Couldn't send `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:13-13` `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:60-63`
- vNext now: New custom status messages for DB unavailable stale audience forbidden generic publication failure `src/components/announcements/super-admin-college-broadcast-form.tsx:45-54`
- Fix: Map server-provided validation messages to actionable field errors while retaining newer status-specific feedback

## G2-10-002-036  [P2] GAP  facet F08  effort S
- Legacy: Legacy create toast Sent to N placement cell or cells `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:52-56`
- vNext now: New inline feedback Sent to N placement cell(s) plus extra delivery message `src/components/announcements/super-admin-college-broadcast-form.tsx:50-54`
- Fix: Use correct singular/plural wording and same notification placement or document intentional change
