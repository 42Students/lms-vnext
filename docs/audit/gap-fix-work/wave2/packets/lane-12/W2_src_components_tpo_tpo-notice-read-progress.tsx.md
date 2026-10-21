# Work packet (wave 2): edit src/components/tpo/tpo-notice-read-progress.tsx

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-announcements.md, docs/audit/gap2/lane-3/l12-u023-tpo-announcement-controller.md

## G2-11-005-009  [P2] GAP  facet F02  effort S
- Legacy: Read recipients Drawer fixed width420 `docs/legacy-source/frontend/src/pages/tpo/announcements.js:116`
- vNext now: vNext Disclosure inline with max-h48 list `src/components/tpo/tpo-notice-read-progress.tsx:53`
- Fix: Restore 420px Drawer with status/empty/loading

## G2-11-005-013  [P2] GAP  facet F03  effort S
- Legacy: Who hasn't read small button if SENT and unread `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:94`
- vNext now: vNext Who hasn't read Disclosure after explicit Show read status `src/components/tpo/tpo-notice-read-progress.tsx:53`
- Fix: Show inline button without separate initial reveal

## G2-11-005-014  [P2] GAP  facet F03  effort S
- Legacy: Remind them button directly in row when unread `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:95`
- vNext now: vNext Remind only after Show read status `src/components/tpo/tpo-notice-read-progress.tsx:49`
- Fix: Restore list action without secondary fetch

## G2-11-005-065  [P2] MISSING  facet F09  effort S
- Legacy: Who hasn't read Drawer width420 `docs/legacy-source/frontend/src/pages/tpo/announcements.js:116`
- vNext now: Disclosure inline list, no Drawer `src/components/tpo/tpo-notice-read-progress.tsx:53`
- Fix: Restore 420px drawer/read rows

## G2-11-005-069  [P2] GAP  facet F09  effort S
- Legacy: Drawer reminde-once-hour note shown before list `docs/legacy-source/frontend/src/pages/tpo/announcements.js:119`
- vNext now: Rate-limit error only after 429 `src/components/tpo/tpo-notice-read-progress.tsx:39`
- Fix: Display proactive rate-limit explainer

## G2-11-005-092  [P2] GAP  facet F13  effort S
- Legacy: Drawer unread-load failure shown in drawer with explicit message `docs/legacy-source/frontend/src/pages/tpo/announcements.js:118`
- vNext now: vNext InlineNotice after Show read status `src/components/tpo/tpo-notice-read-progress.tsx:25`
- Fix: Match error placement/copy

## G2-11-005-093  [P2] GAP  facet F13  effort S
- Legacy: Drawer empty Everyone has read it. `docs/legacy-source/frontend/src/pages/tpo/announcements.js:120`
- vNext now: vNext no empty-state text when unread none `src/components/tpo/tpo-notice-read-progress.tsx:53`
- Fix: Show exact empty confirmation

## G2-11-005-102  [P2] GAP  facet F16  effort S
- Legacy: Unread Drawer420 at desktop, standard Ant mobile behavior `docs/legacy-source/frontend/src/pages/tpo/announcements.js:116`
- vNext now: Inline Disclosure screen-width content `src/components/tpo/tpo-notice-read-progress.tsx:53`
- Fix: Restore responsive Drawer

## G2-11-005-109  [P2] GAP  facet F17  effort S
- Legacy: Ant Drawer focus/escape and close `docs/legacy-source/frontend/src/pages/tpo/announcements.js:116`
- vNext now: Disclosure inline, no focus trap/return `src/components/tpo/tpo-notice-read-progress.tsx:53`
- Fix: Restore Drawer focus

## G2-11-005-117  [P2] GAP  facet F18  effort S
- Legacy: Button Who hasn't read `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:94`
- vNext now: Disclosure title Who hasn't read, button Show read status first `src/components/tpo/tpo-notice-read-progress.tsx:53`
- Fix: Direct action

## G2-11-005-118  [P2] GAP  facet F18  effort S
- Legacy: Remind toast Reminded N student(s) `docs/legacy-source/frontend/src/pages/tpo/announcements.js:83`
- vNext now: Reminder sent to N unread people. `src/components/tpo/tpo-notice-read-progress.tsx:36`
- Fix: Exact feedback

## G2-11-005-120  [P2] GAP  facet F19  effort S
- Legacy: Read progress denominator recipientCount in list `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:31`
- vNext now: Read progress initially absent, then loaded via receipts API `src/components/tpo/tpo-notice-read-progress.tsx:47`
- Fix: Avoid per-row N+1 by including summary counts

## G2-11-005-139  [P2] GAP  facet F23  effort S
- Legacy: Legacy reminders toast exact count `docs/legacy-source/frontend/src/pages/tpo/announcements.js:83`
- vNext now: vNext changed toast copy `src/components/tpo/tpo-notice-read-progress.tsx:36`
- Fix: Match

## G2-12-023-006  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:74-81`
- vNext now: `src/components/tpo/tpo-notice-read-progress.tsx:43-58`
- Fix: Legacy unreadBy returns full learner row list immediately; vNext Show read status button then read count+Disclosure, not a Drawer.

## G2-12-023-032  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:74-81`
- vNext now: `src/components/tpo/tpo-notice-read-progress.tsx:43-56`
- Fix: Legacy unreadBy likely opens Drawer in consuming page; vNext nested Disclosure reveals read names, different focus/overlay behavior.

## G2-12-023-055  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:74-81`
- vNext now: `src/components/tpo/tpo-notice-read-progress.tsx:43-56`
- Fix: Legacy unread drawer (in legacy frontend) versus vNext on-page max-h48 names Disclosure on mobile/desktop.

## G2-12-023-056  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:74-81`
- vNext now: `src/components/tpo/tpo-notice-read-progress.tsx:43-58`
- Fix: Legacy GET unread returns structured DTO for accessible row labels; vNext only name strings with index keys, not stable identifications.

## G2-12-023-010  [P3] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:74-81`
- vNext now: `src/components/tpo/tpo-notice-read-progress.tsx:43-56`
- Fix: Legacy unreadBy rich name/roll/branch projection, vNext Who hasn't read lists names only with index keys.
