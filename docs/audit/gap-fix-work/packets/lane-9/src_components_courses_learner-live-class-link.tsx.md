# Work packet: edit src/components/courses/learner-live-class-link.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/syllabus-liveclass.md

## G2-18-008-027  [P2] GAP  facet F07  effort M
- Legacy: Old invalid start/end date yields Scheduled/no time fields, link may remain visible (`syllabus/liveclass.js:39-54,94-121`).
- vNext now: New countdown requires both dates, otherwise `Time unavailable`; session actions rely endedAt parsing (`learner-live-session-status.tsx:5-13`; `learner-live-class-link.tsx:16-24`).
- Fix: Use legacy missing-time fallback and link-access policy; mark UNKNOWN live for corrupt data.

## G2-18-008-025  [P3] GAP  facet F07  effort S
- Legacy: Old Copy clipboard fail toast `Couldn't copy the link` (`syllabus/liveclass.js:81-88`).
- vNext now: New inline `Could not copy the meeting link. Open the meeting instead.` (`learner-live-class-link.tsx:25-29`).
- Fix: Use exact legacy error wording/placement.

## G2-18-008-028  [P3] GAP  facet F08  effort S
- Legacy: Old Copy success toast `Meeting link copied` (`syllabus/liveclass.js:81-85`).
- vNext now: New inline status `Meeting link copied.` with terminal period (`learner-live-class-link.tsx:25-29,37`).
- Fix: Restore exact toast text without period and timing.

## G2-18-008-031  [P3] GAP  facet F08  effort S
- Legacy: Old ended message `This session has already ended.` (`syllabus/liveclass.js:185-193`).
- vNext now: New ended helper says `This live session has ended. Join Meeting and Copy meeting link are no longer available.` (`learner-live-class-link.tsx:30-33`).
- Fix: Restore concise old ended callout copy within card.
