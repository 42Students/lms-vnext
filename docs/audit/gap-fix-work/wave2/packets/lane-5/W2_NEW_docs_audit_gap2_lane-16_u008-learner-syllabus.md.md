# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-16/u008-learner-syllabus.md

2 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-16/u008-learner-syllabus.md

## G2-16-008-039  [P2] GAP  facet F10  effort M
- Legacy: `syllabus.js:739-749`: GET lessons with AbortController and visible retry.
- vNext now: `page.tsx:58-74`: awaited getLearnerCourseWorkspace, no per-content abort/retry.
- Fix: Provide user-controlled Retry of core lesson list without page-wide abort.

## G2-16-008-042  [P2] GAP  facet F11  effort S
- Legacy: `syllabus.js:903-908`: no class scope shows informational state, not forbidden.
- vNext now: `page.tsx:58-80`: notFound when delivery lookup fails.
- Fix: Distinguish missing class enrollment from unauthorized course to show appropriate UI.
