# Work packet (wave 2): edit src/components/courses/learner-live-class-link.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/syllabus-liveclass.md

## G2-18-008-006  [P2] GAP  facet F02  effort M
- Legacy: Old join block has guidance paragraph, icon-only Copy and primary large Join button (`syllabus/liveclass.js:185-214`).
- vNext now: New third-party link and secondary Copy text button, no guidance in normal available state (`learner-live-class-link.tsx:30-38`; `learner-course-workspace.tsx:294-295`).
- Fix: Restore join panel copy/icon/layout and primary CTA.

## G2-18-008-010  [P2] GAP  facet F03  effort S
- Legacy: Old Ended button disabled with VideoCameraOutlined and text `Session ended` (`syllabus/liveclass.js:198-201`).
- vNext now: New after end removes join/copy and shows paragraph + status badge (`learner-live-class-link.tsx:30-33`).
- Fix: Render visible disabled `Session ended` in old button position.

## G2-18-008-011  [P2] MISSING  facet F03  effort S
- Legacy: Old provider displays `on Zoom` / `on Google Meet` etc (`syllabus/liveclass.js:15-28,181`).
- vNext now: New doesn't display provider in event card, only URL link (`learner-course-workspace.tsx:223-295`; `learner-live-class-link.tsx:34-38`).
- Fix: Add safe hostname-based provider label.

## G2-18-008-020  [P2] GAP  facet F06  effort M
- Legacy: Old Join Meeting button clickable if link present and learner session has not ended (`syllabus/liveclass.js:73-79,110-112,185-214`).
- vNext now: New ThirdPartyLink only when sanitized published URL and not ended (`learner-course-workspace.tsx:223-250,294-295`; `learner-live-class-link.tsx:16-38`).
- Fix: Preserve pre-start join, expired disabling, improve exact button visual.

## G2-18-008-035  [P2] GAP  facet F10  effort S
- Legacy: Old Join Meeting `window.open(meetLink,'_blank','noopener,noreferrer')` (`syllabus/liveclass.js:73-79`).
- vNext now: New ThirdPartyLink renders external anchor when HTTPS, no JS window.open (`learner-live-class-link.tsx:34-38`; `third-party-link.tsx:11-20,34-36`).
- Fix: Use `_blank rel=noopener noreferrer` with validated URL and external-navigation fallback.

## G2-18-008-041  [P2] GAP  facet F12  effort S
- Legacy: Old ended state checks valid raw end is before now (`syllabus/liveclass.js:110-121`).
- vNext now: New status `Date.now()>=end` every 15–30s (`learner-live-class-link.tsx:16-24`; `learner-live-session-status.tsx:5-25`).
- Fix: Define exact equality boundary (< vs <=) and live refresh behavior.

## G2-18-008-054  [P2] GAP  facet F16  effort M
- Legacy: Old Live card CSS uses `ln-live-view__date`, `__info`, `__join-actions` (modal modifier) (`syllabus/liveclass.js:124-183`).
- vNext now: New utility classes with flexible wrapping and standalone badges (`learner-course-workspace.tsx:160-204`; `learner-live-class-link.tsx:34-38`).
- Fix: Match mobile date-card stacking, join button width, 44px controls and modal spacing via legacy SCSS.

## G2-18-008-055  [P2] GAP  facet F16  effort S
- Legacy: Old icon-only Copy and large Join controls remain adjacent/stacked by legacy CSS (`syllabus/liveclass.js:194-213`).
- vNext now: New flex-wrap Join link, medium copy text button (`learner-live-class-link.tsx:34-38`).
- Fix: Match phone ordering and touch-target width.

## G2-18-008-064  [P2] GAP  facet F20  effort S
- Legacy: Old end check `isBefore(dayjs())` allows action exactly at end instant (`syllabus/liveclass.js:110-112`).
- vNext now: New ends at `Date.now()>=end`, interval re-evaluated every15s (`learner-live-class-link.tsx:16-24`).
- Fix: Align boundary behavior; protect server from post-end copy/join if required.

## G2-18-008-009  [P3] GAP  facet F03  effort S
- Legacy: Old Copy button icon-only CopyOutlined with aria-label `Copy meeting link` (`syllabus/liveclass.js:194-197`).
- vNext now: New secondary button with visible `Copy meeting link` (`learner-live-class-link.tsx:34-37`).
- Fix: Restore icon-only button and accessible name.

## G2-18-008-017  [P3] MISSING  facet F04  effort S
- Legacy: Old meetingProvider distinguishes Zoom, Google Meet, Microsoft Teams, Webex, Whereby or normalized hostname (`syllabus/liveclass.js:15-28`).
- vNext now: New ThirdPartyLink shows Join Meeting only, no provider inference (`learner-live-class-link.tsx:34-38`).
- Fix: Implement exact provider mapping with safe URL parsing.

## G2-18-008-059  [P3] GAP  facet F18  effort S
- Legacy: Old `Join Meeting` button with Video icon (`syllabus/liveclass.js:203-211`).
- vNext now: New `ThirdPartyLink` label Join Meeting, no video icon (`learner-live-class-link.tsx:34-36`; `third-party-link.tsx:34-36`).
- Fix: Add VideoCamera icon, legacy primary emphasis.

## G2-18-008-061  [P3] GAP  facet F18  effort S
- Legacy: Old toast `Meeting link copied` and `Couldn't copy the link` (`syllabus/liveclass.js:81-88`).
- vNext now: New text `Meeting link copied.` / `Could not copy the meeting link. Open the meeting instead.` (`learner-live-class-link.tsx:25-29`).
- Fix: Use exact legacy strings and toast placement.
