# Work packet: NEW / MISSING items from docs/audit/gap2/lane-11/l19-u024-super-admin-announcement-controller.md

8 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-11/l19-u024-super-admin-announcement-controller.md

## G2-19-024-030  [P0] GAP  facet F12  effort L
- Legacy: Legacy broadcasts immediately, showUntil hides after expiry; PlacementAnnouncementService.java:375-389,328-329
- vNext now: vNext future scheduledAt persisted; immediate notifications skip future; worker comment says not configured; broadcast-service.ts:87-111
- Fix: Configure/verify durable due-time worker and user notice delivery before enabling schedule field, or remove schedule option.

## G2-19-024-013  [P1] GAP  facet F06  effort L
- Legacy: New to ALL default, SOME requires picked college IDs, edit locks existing targets; superadmin/announcements.js:87-96,43-52
- vNext now: New form defaults SELECTED, reviewedCollegeIds required by UI; no broadcast-wide edit in broadcaster; form.tsx:14-45; broadcast-service.ts:46-117
- Fix: Implement broadcast-wide edit with immutable college target set, preserve old radio/default and missing-target validation.

## G2-19-024-035  [P1] GAP  facet F15  effort M
- Legacy: On create bell once per target cell, title `From 42:`, body preview140, link `/tpo/announcements?tab=from42`; PlacementAnnouncementService.java:383-388,620-627
- vNext now: Immediate per-active TPO in-app notices truncated body2000, href `/tpo/announcements`; broadcast-service.ts:91-112
- Fix: Match From 42 deep-link, preview text semantics; decide per-college bell vs per-user count equivalence.

## G2-19-024-045  [P1] GAP  facet F21  effort L
- Legacy: Legacy DB insert + audit.bell; no queue/email for TPOS; PlacementAnnouncementService.java:379-388
- vNext now: Activity event + in-app notification fanout and planned scheduled worker; broadcast-service.ts:90-115
- Fix: Specify reliable delivery/outbox and retry semantics; don't claim future notification happens without worker.

## G2-19-024-017  [P2] GAP  facet F07  effort S
- Legacy: Bad title `Give the announcement a title` and too long `Keep the title under 200 characters`; PlacementAnnouncementService.java:605-615
- vNext now: Generic Zod min/max message, form disables submit without field message; broadcast-model.ts:5-7; form.tsx:28-29,70-78
- Fix: Attach specific legacy server error copy by Title field and announce on invalid submit.

## G2-19-024-018  [P2] GAP  facet F07  effort S
- Legacy: HTTPS invalid `The link has to start with https://`; link over500 and label over60 exact messages; PlacementAnnouncementService.java:568-583
- vNext now: `Provide a button label and a valid HTTPS link` client, `Enter a secure HTTPS link` model; form.tsx:79-90; broadcast-model.ts:17-19
- Fix: Match legacy validation strings and preserve trim/sanitize constraints.

## G2-19-024-019  [P2] GAP  facet F07  effort S
- Legacy: Past end `The end date has passed`; bad date `Give a date and time`; PlacementAnnouncementService.java:584-603
- vNext now: Generic schedule validation `Enter valid local schedule and expiry values` form.tsx:90-101
- Fix: Map to exact end date field error, protect legacy 1 minute server tolerance if retained.

## G2-19-024-020  [P2] GAP  facet F08  effort S
- Legacy: POST toast `Sent to N placement cell(s)` proper plurality; edit `Saved`; delete `Deleted`; superadmin/announcements.js:47-62,70-75
- vNext now: POST inline `Sent to N placement cell(s)` plus bell detail; no broadcast-wide edit/delete toast; form.tsx:44-54
- Fix: Restore exact success placement and singular/plural; add save/delete feedback after grouped edits.
