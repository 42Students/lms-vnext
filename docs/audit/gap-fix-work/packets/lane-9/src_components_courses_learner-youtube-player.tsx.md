# Work packet: edit src/components/courses/learner-youtube-player.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/youtube.md

## G2-12-008-012  [P1] GAP  facet F04  effort S
- Legacy: Percent watched threshold clientSettings watchedThresholdPercent default90 `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:98-105`
- vNext now: Server progress derives completion from duration/position `src/components/courses/learner-youtube-player.tsx:321-346`
- Fix: Verify server threshold 90% and tenant override parity

## G2-12-008-019  [P2] GAP  facet F07  effort S
- Legacy: Missing contentDataDTO or link returns null without banner `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:153-153`
- vNext now: Invalid URL shows alert `cannot be played inline` `src/components/courses/learner-youtube-player.tsx:441-455`
- Fix: Match missing-resource handling versus truly invalid

## G2-12-008-023  [P2] GAP  facet F08  effort S
- Legacy: Learner progress shown via ContentProgressBadge `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:212-212`
- vNext now: Text `Resume saved automatically` and Saved-at clock `src/components/courses/learner-youtube-player.tsx:467-485`
- Fix: Align completion and ongoing-progress messages

## G2-12-008-024  [P2] GAP  facet F08  effort S
- Legacy: Fallback copy `Video unavailable. It may be region-blocked or removed.` `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:201-205`
- vNext now: Fallback `This YouTube URL cannot be played inline.` `src/components/courses/learner-youtube-player.tsx:441-450`
- Fix: Distinguish blocked/removed versus invalid URL
