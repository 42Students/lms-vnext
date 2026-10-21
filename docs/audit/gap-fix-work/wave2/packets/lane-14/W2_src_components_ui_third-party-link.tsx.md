# Work packet (wave 2): edit src/components/ui/third-party-link.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/syllabus-liveclass.md

## G2-18-008-035  [P2] GAP  facet F10  effort S
- Legacy: Old Join Meeting `window.open(meetLink,'_blank','noopener,noreferrer')` (`syllabus/liveclass.js:73-79`).
- vNext now: New ThirdPartyLink renders external anchor when HTTPS, no JS window.open (`learner-live-class-link.tsx:34-38`; `third-party-link.tsx:11-20,34-36`).
- Fix: Use `_blank rel=noopener noreferrer` with validated URL and external-navigation fallback.

## G2-18-008-059  [P3] GAP  facet F18  effort S
- Legacy: Old `Join Meeting` button with Video icon (`syllabus/liveclass.js:203-211`).
- vNext now: New `ThirdPartyLink` label Join Meeting, no video icon (`learner-live-class-link.tsx:34-36`; `third-party-link.tsx:34-36`).
- Fix: Add VideoCamera icon, legacy primary emphasis.
