# Work packet: edit src/components/courses/learner-live-session-status.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/syllabus-liveclass.md

## G2-18-008-027  [P2] GAP  facet F07  effort M
- Legacy: Old invalid start/end date yields Scheduled/no time fields, link may remain visible (`syllabus/liveclass.js:39-54,94-121`).
- vNext now: New countdown requires both dates, otherwise `Time unavailable`; session actions rely endedAt parsing (`learner-live-session-status.tsx:5-13`; `learner-live-class-link.tsx:16-24`).
- Fix: Use legacy missing-time fallback and link-access policy; mark UNKNOWN live for corrupt data.
