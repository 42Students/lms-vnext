# Work packet: edit src/components/tpo/tpo-notice-read-progress.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-announcements.md, docs/audit/gap2/lane-3/l12-u023-tpo-announcement-controller.md

## G2-11-005-026  [P1] GAP  facet F04  effort M
- Legacy: Read line includes read/recipient percentage and count `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:90`
- vNext now: Read count loaded on demand and metric progress bar `src/components/tpo/tpo-notice-read-progress.tsx:47`
- Fix: Display read count immediately in each sent card

## G2-11-005-031  [P1] GAP  facet F05  effort S
- Legacy: Who hasn't read only while SENT and readCount below recipientCount `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:94`
- vNext now: vNext disclosure condition on receipts unread count regardless lifecycle `src/components/tpo/tpo-notice-read-progress.tsx:53`
- Fix: Use lifecycle and read totals to gate

## G2-11-005-032  [P1] GAP  facet F05  effort S
- Legacy: Remind option conditional likewise `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:95`
- vNext now: vNext unread array gate only `src/components/tpo/tpo-notice-read-progress.tsx:49`
- Fix: Block invalid lifecycle reminders

## G2-11-005-033  [P1] GAP  facet F05  effort M
- Legacy: Drawer unread rows as List with `name/roll/branch` and empty Everyone has read it `docs/legacy-source/frontend/src/pages/tpo/announcements.js:120`
- vNext now: vNext lists names only, no roll/branch `src/components/tpo/tpo-notice-read-progress.tsx:54`
- Fix: Include privacy-scoped learner roll and branch

## G2-11-005-075  [P1] GAP  facet F10  effort S
- Legacy: GET unread-by learner list /:id/unread `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:218`
- vNext now: vNext GET /:id/receipts provides summary/read names `src/components/tpo/tpo-notice-read-progress.tsx:21`
- Fix: Restore detailed unread learner DTO

## G2-11-005-094  [P1] GAP  facet F13  effort M
- Legacy: Drawer when 500 rows note Showing the first 500. `docs/legacy-source/frontend/src/pages/tpo/announcements.js:122`
- vNext now: vNext max-h48 scroll but no truncation disclosure `src/components/tpo/tpo-notice-read-progress.tsx:54`
- Fix: Enforce/label 500-record limit

## G2-11-005-132  [P1] GAP  facet F22  effort M
- Legacy: Legacy per-announcement unread rows have learnerId/roll/branch `docs/legacy-source/frontend/src/pages/tpo/announcements.js:31`
- vNext now: vNext summaries unread string[] names only `src/components/tpo/tpo-notice-read-progress.tsx:11`
- Fix: Preserve scoped identity in read receipt model

## G2-11-005-138  [P1] GAP  facet F23  effort S
- Legacy: Legacy Who hasn't read full learner details in Drawer `docs/legacy-source/frontend/src/pages/tpo/announcements.js:120`
- vNext now: vNext short inline name list `src/components/tpo/tpo-notice-read-progress.tsx:53`
- Fix: Clone drawer/details/empty/load

## G2-11-005-062  [P2] GAP  facet F08  effort S
- Legacy: Reminded N student(s) toast `docs/legacy-source/frontend/src/pages/tpo/announcements.js:83`
- vNext now: vNext Reminder sent to N unread people. `src/components/tpo/tpo-notice-read-progress.tsx:36`
- Fix: Restore exact count/plural text

## G2-12-023-030  [P3] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:263-277`
- vNext now: `src/components/tpo/tpo-notice-read-progress.tsx:32-40`
- Fix: Legacy POST /remind returns reminded count; vNext says Reminder sent to N unread people. with rate-limit error, different legacy toast wording.
