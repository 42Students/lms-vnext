# Lane 16 follow-up parity review

Follow-up after the 28-item second review queue reached 28/28. No new lane-16 queue was present on origin/main as of this revision. These are source-level fixes; viewport screenshots, CI and TypeScript compile were not run.

- [x] `src/components/ui/card.tsx` — legacy `docs/design/legacy-styles/components___antddesign.scss:20-23` switches mobile layout at max-width 767px; code previously switched Card padding at Tailwind sm (640px), yielding desktop 24px padding on 640–767px phones. Corrected to `min-[768px]:p-[var(--lms-canvas-padding)]`; current phone 16px and tablet/desktop 24px. Diff: 1 replacement.
- [x] `src/components/ui/legacy-overlays.css` — legacy `docs/design/legacy-styles/components___accessibility.scss:18-22` keyboard focus is 2px `#1a95a1` with 3px offset. Four vNext selectors (popover, listbox link, toast dismiss, toast action) used 2px `#26bac7` with 2px offset. Corrected all four selectors to `var(--lms-primary-text)` (= `#1a95a1`) and `3px`. Diff: 4 replacements.
