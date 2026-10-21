# Work packet (wave 2): edit src/components/announcements/announcement-admin-workspace.tsx

25 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-announcements.md, docs/audit/gap2/lane-2/admin-notification-delivery-controller.md, docs/audit/gap2/lane-2/announcement-controller.md

## G2-10-002-006  [P2] GAP  facet F02  effort M
- Legacy: Feed entries are independent announcement cards with head body and foot `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:62-106`
- vNext now: Feed entries are border-top text articles after read receipt section `src/components/announcements/announcement-admin-workspace.tsx:283-332`
- Fix: Match old announcement card anatomy and separator/border treatments

## G2-10-002-009  [P2] MISSING  facet F03  effort S
- Legacy: Edited announcement displays Updated tag `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:68-70`
- vNext now: No updated badge; displays version and sender below body `src/components/announcements/announcement-admin-workspace.tsx:295-311`
- Fix: Add updated status chip when updatedAt exceeds sentAt or equivalent version condition

## G2-10-002-011  [P2] GAP  facet F03  effort S
- Legacy: List CTA renders external link with LinkOutlined icon; default label Open `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:79-83`
- vNext now: Link text includes unicode outbound arrow and uses default browser same-tab behavior `src/components/announcements/announcement-admin-workspace.tsx:302-305`
- Fix: Use old external link icon and target blank security attributes

## G2-10-002-012  [P2] GAP  facet F03  effort M
- Legacy: All https URLs in body become individually clickable external links `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:14-21` `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:77-81`
- vNext now: Plain body plus at most one safe linked resource separate action `src/components/announcements/announcement-admin-workspace.tsx:300-307`
- Fix: Linkify every safe https URL in body while escaping remaining text

## G2-10-002-013  [P2] MISSING  facet F04  effort S
- Legacy: Legacy record includes authorName 42; sentAt/createdAt formatted D MMM h:mm A and year when different `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:7-12` `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:72-76`
- vNext now: Generic row shows senderType and version but no sent/created timestamp `src/components/announcements/announcement-admin-workspace.tsx:295-311`
- Fix: Show 42 author and created or sent date with matching conditional year formatting

## G2-10-002-014  [P2] GAP  facet F04  effort S
- Legacy: Legacy record metadata includes show until date and audience label `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:72-76`
- vNext now: Expiry shown in en-IN medium date plus IST; audience rendered as type and target UUID/name `src/components/announcements/announcement-admin-workspace.tsx:295-309`
- Fix: Use legacy expiry wording and audience label for broadcasts with precise local date rules

## G2-10-002-057  [P2] GAP  facet F13  effort S
- Legacy: Legacy zero broadcast list message Nothing sent yet. `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:71-71` `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:50-51`
- vNext now: Generic history empty No announcements plus contextual empty text `src/components/announcements/announcement-admin-workspace.tsx:283-286` `src/app/(authenticated)/admin/announcements/page.tsx:193-196`
- Fix: Restore exact empty wording for placement-cell broadcast feed

## G2-10-002-063  [P2] GAP  facet F16  effort S
- Legacy: Legacy list actions Edit and Delete are visible buttons on cards `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:93-104`
- vNext now: New Edit button plus More menu containing delete and pin `src/components/announcements/announcement-admin-workspace.tsx:312-325`
- Fix: Keep legacy visible destructive action affordance with mobile safe spacing

## G2-10-002-064  [P2] GAP  facet F17  effort S
- Legacy: Legacy button link and body links open new tab with noopener noreferrer `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:14-21` `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:79-83`
- vNext now: New CTA anchor omits target and rel, body only one safe link `src/components/announcements/announcement-admin-workspace.tsx:300-307`
- Fix: Restore new-tab behavior and defensive rel attributes for external URLs

## G2-10-002-070  [P2] GAP  facet F18  effort S
- Legacy: Legacy empty text Nothing sent yet and deletion confirmation Placement cells stop seeing it `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:71-75` `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:97-101`
- vNext now: New empty text No announcements and no delete confirmation copy `src/components/announcements/announcement-admin-workspace.tsx:283-286` `src/components/announcements/announcement-admin-workspace.tsx:315-321`
- Fix: Use literal legacy empty and delete-confirmation phrases

## G2-10-002-071  [P2] GAP  facet F18  effort S
- Legacy: Legacy top action Save and success Saved; Delete and success Deleted `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:49-55` `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:73-79`
- vNext now: New generic edit action Confirm reviewed changes; success Announcement updated and delete lacks toast `src/components/announcements/announcement-admin-workspace.tsx:214-219` `src/components/announcements/announcement-admin-workspace.tsx:354-360`
- Fix: Match concise legacy action and toast labels for broadcast path

## G2-2-019-007  [P2] MISSING  facet F03  effort M
- Legacy: AdminNotificationDeliveryController.java:58-61 resend button applies to FAILED or scheduled, not already-sent
- vNext now: announcement-admin-workspace.tsx:138-140 actions enumerated DELETE, RESTORE, PIN; no retry/resend
- Fix: Add Send now/Retry action with state-based visibility.

## G2-2-019-008  [P2] MISSING  facet F03  effort M
- Legacy: AdminNotificationDeliveryController.java:110-132 cancel control valid for SCHEDULED only
- vNext now: announcement-admin-workspace.tsx:138-140 action enum excludes cancel
- Fix: Add Cancel schedule button only for pending entries.

## G2-2-019-016  [P2] GAP  facet F05  effort M
- Legacy: AdminNotificationDeliveryController.java:58-149 two row-specific POST actions, no bulk operators
- vNext now: announcement-admin-workspace.tsx:138-140 has separate announcement actions
- Fix: Keep actions per notification; avoid unreviewed bulk resend.

## G2-2-019-020  [P2] GAP  facet F06  effort M
- Legacy: NotificationDTO.java:37-41 optional scheduledAt `yyyy-MM-dd HH:mm:ss`
- vNext now: announcement-admin-workspace.tsx:81-86 uses datetime-local + normalization, stores UTC ISO
- Fix: Specify timezone conversion and preserve intended legacy local wall time.

## G2-2-019-030  [P2] MISSING  facet F09  effort M
- Legacy: NotificationController.java:59-71 separate compose and action paths; retry preserves existing message
- vNext now: announcement-admin-workspace.tsx:138-140 has delete/restore/pin actions, no retry-specific dialog
- Fix: Make operator confirm explain resend uses existing content, not duplicate compose.

## G2-2-019-054  [P2] MISSING  facet F18  effort S
- Legacy: AdminNotificationDeliveryController.java:86 exact `That notification was already delivered. Compose a new one instead of resending it.`
- vNext now: announcement-admin-workspace.tsx:120-133 different generic compose error/success copy
- Fix: Preserve exact already-sent guidance.

## G2-2-019-055  [P2] MISSING  facet F18  effort S
- Legacy: AdminNotificationDeliveryController.java:131-133 exact `Only a notification still waiting to be sent can have its schedule cancelled.`
- vNext now: announcement-admin-workspace.tsx:138-140 no cancel copy
- Fix: Use exact 400 text in inline alert/toast.

## G2-2-019-056  [P2] MISSING  facet F18  effort S
- Legacy: AdminNotificationDeliveryController.java:102-103,149 response `Queued for immediate delivery` / `Schedule cancelled`
- vNext now: announcement-admin-workspace.tsx:122-133 only create toast
- Fix: Add status-specific action feedback.

## G2-2-025-008  [P2] GAP  facet F02  effort M
- Legacy: Legacy superadmin/announcements.js:78-109 AsyncModal width600 and Form layout
- vNext now: src/components/announcements/announcement-admin-workspace.tsx:60-103 inline composer + Dialog
- Fix: Clone modal width, labels and action arrangement for placement-cell flow.

## G2-2-025-029  [P2] GAP  facet F09  effort M
- Legacy: Legacy superadmin/announcements.js:78-109 AsyncModal width600
- vNext now: src/components/announcements/announcement-admin-workspace.tsx:11-12 imports Dialog, editor inline/different structure
- Fix: Match modal geometry, focus and cancellation.

## G2-2-025-030  [P2] GAP  facet F09  effort M
- Legacy: Legacy superadmin/announcements.js:98-107 pinned/link/date inside modal
- vNext now: src/components/announcements/announcement-admin-workspace.tsx:79-86 scheduled/expires/pin; broadcast separate
- Fix: Preserve optional CTA pairs and expiry/pin controls with labels.

## G2-2-025-052  [P2] GAP  facet F16  effort M
- Legacy: Legacy superadmin/announcements.js:78-109 form modal width600, textarea rows6
- vNext now: src/components/announcements/announcement-admin-workspace.tsx:79-86 stateful inline form
- Fix: Match 600px modal and mobile single-column form.

## G2-10-002-008  [P3] GAP  facet F03  effort S
- Legacy: Pinned announcement displays filled pushpin icon `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:64-68`
- vNext now: Pinned displayed as plain Pinned text in metadata `src/components/announcements/announcement-admin-workspace.tsx:295-300`
- Fix: Render pushpin icon with old color and accessible name

## G2-10-002-065  [P3] GAP  facet F17  effort S
- Legacy: Legacy pinned icon aria-label Pinned; async dialog has close and submitting state `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:64-68` `docs/legacy-source/frontend/src/components/tpo/ui/AsyncModal.jsx:8-18`
- vNext now: New Pinned text and accessible confirm dialog with pending guard `src/components/announcements/announcement-admin-workspace.tsx:295-300` `src/components/announcements/super-admin-college-broadcast-form.tsx:102-107`
- Fix: Restore pinned icon and maintain explicit aria-label
