# Work packet: edit src/components/courses/college-live-classes-directory.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/college-admin-lesson-content.md

## G2-18-007-018  [P1] MISSING  facet F04  effort M
- Legacy: Old LIVE_CLASS displays Join button for valid https, Invalid link or No link if not (`LessonContent.js:981-999`).
- vNext now: New live list lacks meeting URL and Join, points to workspaces (`college-live-classes-directory.tsx:17-22,83-101`).
- Fix: Add permissioned Join, invalid/no-link states; avoid exposing untrusted URL.
