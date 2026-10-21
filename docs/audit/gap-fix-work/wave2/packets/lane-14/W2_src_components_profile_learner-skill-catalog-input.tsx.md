# Work packet (wave 2): edit src/components/profile/learner-skill-catalog-input.tsx

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/skill-controller.md, docs/audit/gap2/lane-6/skill.md

## G2-4-025-006  [P2] GAP  facet F02  effort M
- Legacy: Suggestion dropdown grouped Recent then Popular, with footer tip (`docs/legacy-source/frontend/src/components/Global/SkillsAutocomplete.jsx:186-218,396-442`)
- vNext now: One flat listbox; no grouped recent/popular or footer (`src/components/profile/learner-skill-catalog-input.tsx:44-89`)
- Fix: Show grouped headings/counters and abbreviation tip in autocomplete.

## G2-4-025-008  [P2] GAP  facet F03  effort S
- Legacy: Hot, Recent and coloured category labels with icons (`docs/legacy-source/frontend/src/components/Global/SkillsAutocomplete.jsx:153-180`)
- vNext now: Only plain category suffix rendered (`src/components/profile/learner-skill-catalog-input.tsx:80-85`)
- Fix: Show Hot/Recent marker, icon and category badge with legacy styling.

## G2-4-025-009  [P2] GAP  facet F03  effort S
- Legacy: Recent/Popular group headers include counts (`docs/legacy-source/frontend/src/components/Global/SkillsAutocomplete.jsx:198-214`)
- vNext now: Suggestions have no group headers/counts (`src/components/profile/learner-skill-catalog-input.tsx:78-86`)
- Fix: Include distinct section count and title per source.

## G2-4-025-023  [P2] GAP  facet F06  effort M
- Legacy: Autocomplete configurable allowProficiency, maxResults, disabled, showPopular, showRecent (`docs/legacy-source/frontend/src/components/Global/SkillsAutocomplete.jsx:33-42`)
- vNext now: Input lacks equivalent props; query limit fixed at 15 (`src/components/profile/learner-skill-catalog-input.tsx:7-8,49-67`)
- Fix: Support consumer options, disabled state and configurable maxResults.

## G2-4-025-034  [P2] GAP  facet F09  effort S
- Legacy: AntD autocomplete dropdown 400px max height, shadow, spinner and footer (`docs/legacy-source/frontend/src/components/Global/SkillsAutocomplete.jsx:398-442`)
- vNext now: Popover list max-h-48 (~192px), border-separated options (`src/components/profile/learner-skill-catalog-input.tsx:78-89`)
- Fix: Match 400px dropdown height, elevation, spinner and footer spacing.

## G2-4-025-050  [P2] GAP  facet F13  effort S
- Legacy: Spinner during search, explicit no results/error groups (`docs/legacy-source/frontend/src/components/Global/SkillsAutocomplete.jsx:232-282,411-419`)
- vNext now: Plain loading/no result/unavailable text (`src/components/profile/learner-skill-catalog-input.tsx:71-77`)
- Fix: Reproduce old spinner and grouped empty/error feedback in dropdown.

## G2-4-025-052  [P2] GAP  facet F13  effort S
- Legacy: Blur waits 200ms to allow option click (`docs/legacy-source/frontend/src/components/Global/SkillsAutocomplete.jsx:309-310`)
- vNext now: Blur closes immediately on focus loss (`src/components/profile/learner-skill-catalog-input.tsx:44-47`)
- Fix: Check pointer focus race and restore click-safe close timing.

## G2-4-025-057  [P2] GAP  facet F16  effort M
- Legacy: Full-width select and wrap selected tags, fixed 400px dropdown max (`docs/legacy-source/frontend/src/components/Global/SkillsAutocomplete.jsx:396-424,444-502`)
- vNext now: Responsive md:col-span-2, max-h-48 list (`src/components/profile/learner-skill-catalog-input.tsx:44-49,78-84`)
- Fix: Verify phone/tablet popup width/scroll and wrapping against old AntD.

## G2-4-025-061  [P2] GAP  facet F18  effort S
- Legacy: Default placeholder `Type to search skills (e.g., Java, Python, React)...` (`docs/legacy-source/frontend/src/components/Global/SkillsAutocomplete.jsx:33-38`)
- vNext now: `Search and select skills...` (`src/components/profile/learner-skill-catalog-input.tsx:65-67`)
- Fix: Match exact legacy placeholder.

## G2-4-025-062  [P2] GAP  facet F18  effort S
- Legacy: No-results `No skills matching "{query}". Try a different search.` (`docs/legacy-source/frontend/src/components/Global/SkillsAutocomplete.jsx:247-250`)
- vNext now: `No catalog suggestions found. You can still save your own skill name.` (`src/components/profile/learner-skill-catalog-input.tsx:72-74`)
- Fix: Restore matching-query context and retry instruction if approved.

## G2-6-016-050  [P2] GAP  facet F19  effort M
- Legacy: Legacy v2 uses ultra-fast in-memory cache, no DB queries per keypress (SkillsSearchController.java:16-21,35-51).
- vNext now: New SQL query for each debounced search (catalog-service.ts:29-30,99-115; learner-skill-catalog-input.tsx:19-32).
- Fix: Load-test 10k concurrent searches; indexed prefix search/cache where required, keep input debounce.

## G2-4-025-010  [P3] MISSING  facet F03  effort S
- Legacy: Star-icon tip gives js/py abbreviations (`docs/legacy-source/frontend/src/components/Global/SkillsAutocomplete.jsx:428-438`)
- vNext now: No tip/footer (`src/components/profile/learner-skill-catalog-input.tsx:70-89`)
- Fix: Restore tip when empty query opens suggestions.

## G2-4-025-060  [P3] GAP  facet F17  effort S
- Legacy: No-results/error options explicitly disabled (`docs/legacy-source/frontend/src/components/Global/SkillsAutocomplete.jsx:241-253,264-279`)
- vNext now: Status paragraphs with role=status; no disabled options (`src/components/profile/learner-skill-catalog-input.tsx:71-77`)
- Fix: Verify announced no-results/error messages and avoid accidental selection.

## G2-4-025-063  [P3] GAP  facet F18  effort S
- Legacy: Loading copy `Searching...` (`docs/legacy-source/frontend/src/components/Global/SkillsAutocomplete.jsx:412-416`)
- vNext now: `Searching skills…` (`src/components/profile/learner-skill-catalog-input.tsx:70-71`)
- Fix: Use exact legacy copy/ellipsis per copy catalogue.
