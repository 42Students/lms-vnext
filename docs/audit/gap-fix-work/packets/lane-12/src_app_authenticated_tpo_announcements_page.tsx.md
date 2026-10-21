# Work packet: edit src/app/(authenticated)/tpo/announcements/page.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u031-cross-messaging.md, docs/audit/gap2/lane-11/tpo-announcements.md, docs/audit/gap2/lane-3/l12-u023-tpo-announcement-controller.md

## G2-19-031-122  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:198-209` — Undo measured within 30sec of sent_at.
- vNext now: `src/app/(authenticated)/tpo/announcements/page.tsx:57-59` — New canUndo uses createdAt even for scheduled notices.
- Fix: Anchor undo window to actual sent timestamp.

## G2-11-005-034  [P1] GAP  facet F06  effort S
- Legacy: New composer defaults audience PLACEMENTS `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:53`
- vNext now: vNext audience defaults COLLEGE `src/app/(authenticated)/tpo/announcements/page.tsx:61`
- Fix: Restore default students in placements, not entire college

## G2-11-005-056  [P1] GAP  facet F07  effort S
- Legacy: Load error Couldn't load announcements, Retry `docs/legacy-source/frontend/src/pages/tpo/announcements.js:38`
- vNext now: Bad-filter error Invalid announcement filters, page may throw on load `src/app/(authenticated)/tpo/announcements/page.tsx:42`
- Fix: Separate data failure and query invalidity, show Retry

## G2-11-005-085  [P1] GAP  facet F12  effort M
- Legacy: Audience reach recomputed on each change after debounce `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:57`
- vNext now: vNext explicit Preview audience GET form submit `src/app/(authenticated)/tpo/announcements/page.tsx:99`
- Fix: Restore live debounced audience preview

## G2-11-005-089  [P1] GAP  facet F13  effort S
- Legacy: On fetch error red Alert with Retry retaining empty items `docs/legacy-source/frontend/src/pages/tpo/announcements.js:98`
- vNext now: Invalid filter Alert; data failure may reject `src/app/(authenticated)/tpo/announcements/page.tsx:42`
- Fix: Add retryable load-error state

## G2-11-005-124  [P1] GAP  facet F20  effort M
- Legacy: Save failure leaves composer open and draft fields `docs/legacy-source/frontend/src/pages/tpo/announcements.js:48`
- vNext now: HTML form POST redirect error may close Dialog on reload `src/app/(authenticated)/tpo/announcements/page.tsx:117`
- Fix: Preserve draft fields/dialog on validation/network failure

## G2-11-005-137  [P1] GAP  facet F23  effort S
- Legacy: Legacy live automatic reach preview with dropdown changes `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:57`
- vNext now: vNext Preview audience explicit action and storage blockers `src/app/(authenticated)/tpo/announcements/page.tsx:99`
- Fix: Restore live preview with blocked-state explanation

## G2-11-005-140  [P1] GAP  facet F23  effort S
- Legacy: Retryable list-fetch failure `docs/legacy-source/frontend/src/pages/tpo/announcements.js:98`
- vNext now: Only filter invalid error shown in page `src/app/(authenticated)/tpo/announcements/page.tsx:42`
- Fix: Implement data-error Retry

## G2-11-005-057  [P2] GAP  facet F08  effort S
- Legacy: Saved. N students were told it changed. when update notify `docs/legacy-source/frontend/src/pages/tpo/announcements.js:52`
- vNext now: Only code-based generic success/error, no affected number `src/app/(authenticated)/tpo/announcements/page.tsx:151`
- Fix: Return and display update notification count

## G2-11-005-058  [P2] GAP  facet F08  effort S
- Legacy: Other edit success Saved `docs/legacy-source/frontend/src/pages/tpo/announcements.js:52`
- vNext now: Edit submission redirects, no literal Saved on this page `src/app/(authenticated)/tpo/announcements/page.tsx:265`
- Fix: Show Saved confirmation

## G2-11-005-059  [P2] GAP  facet F08  effort S
- Legacy: Future send message Scheduled `docs/legacy-source/frontend/src/pages/tpo/announcements.js:53`
- vNext now: Scheduled for date appears in list, no toast Scheduled `src/app/(authenticated)/tpo/announcements/page.tsx:186`
- Fix: Match post-save toast

## G2-12-023-026  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:99-107`
- vNext now: `src/app/(authenticated)/tpo/announcements/page.tsx:101-114`
- Fix: Legacy preview returned withEmail and emailReady, vNext cannot infer delivery and distinguishes preview failed/target storage not ready.

## G2-12-023-028  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:61-65`
- vNext now: `src/app/(authenticated)/tpo/announcements/page.tsx:150-151`
- Fix: Legacy DELETE returns status DELETED; vNext Deleted. Its notices were taken back. inline success plus Recently removed tab.
