# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/skill.md

23 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/skill.md

## G2-6-016-003  [P2] GAP  facet F02  effort M
- Legacy: Legacy autocomplete menu has Popular/Recent group headings and category/proficiency options (SkillsAutocomplete.jsx:13-21,116-134).
- vNext now: New suggestion list shows displayName and category only (learner-skill-catalog-input.tsx:78-88).
- Fix: Restore group headings, section order, recent/poplular suggestion groups and proficiency controls.

## G2-6-016-004  [P2] GAP  facet F03  effort M
- Legacy: Legacy includes Fire/Clock/Search/Star icons, tags and category badges (SkillsAutocomplete.jsx:1-4,53-68).
- vNext now: New list shows text and muted category, no section icons (learner-skill-catalog-input.tsx:78-88).
- Fix: Clone category badge icons/colours and suggestion row iconography.

## G2-6-016-007  [P2] GAP  facet F04  effort M
- Legacy: Name normalized lowercase URL-decoded, length 200, unique (Skill.java:26-27).
- vNext now: Draft name varchar(200), lower(name) unique index (db10-skills-catalog.draft.ts:40,50-52).
- Fix: Define normalization on ingestion including URL decode; reject/warn collisions from legacy case variants.

## G2-6-016-013  [P2] GAP  facet F04  effort M
- Legacy: Created/updated at LocalDateTime via Hibernate timestamps (Skill.java:46-52).
- vNext now: Draft timezone-aware timestamp NOT NULL default now (db10-skills-catalog.draft.ts:47-48).
- Fix: Specify UTC storage/IST display; ensure updatedAt is touched on mutations because no ORM @UpdateTimestamp.

## G2-6-016-014  [P2] GAP  facet F05  effort M
- Legacy: Unique name and SIX separate indexes incl category/display/active-category/usage/priority (Skill.java:11-18,26-27).
- vNext now: Draft lower(name) unique and two composite indexes (db10-skills-catalog.draft.ts:50-55).
- Fix: Compare query plans and recreate necessary separate indexes (name/category/display/usage/priority).

## G2-6-016-016  [P2] GAP  facet F05  effort L
- Legacy: v1 search optionally falls back full text and fuzzy (SkillSearchService.java:85-135).
- vNext now: vNext DB SQL matches prefixes/contains/synonyms, no fuzzy fallback (catalog-service.ts:70-114).
- Fix: Implement tested fuzzy/fallback strategies or mark intentional consumer change.

## G2-6-016-017  [P2] GAP  facet F05  effort M
- Legacy: Legacy synonym shorthand expands js→javascript, py→python and many others (SkillSearchService.java:28-83,104-115).
- vNext now: New uses persisted synonym rows only, no static common abbreviation dictionary (catalog-service.ts:76-85).
- Fix: Seed equivalently named common synonyms into DB10 table, check duplicate terms map to many skills.

## G2-6-016-019  [P2] GAP  facet F05  effort M
- Legacy: Popular v2 falls back to in-memory defaults when usage tracker empty (SkillsSearchController.java:55-69).
- vNext now: New SQL coalesces independent usage counts, then display sort (catalog-service.ts:48-67).
- Fix: Compare empty-tracker fallback sample order and adjust if legacy first-run differs.

## G2-6-016-020  [P2] GAP  facet F05  effort S
- Legacy: Category fetch limit defaults 50 (SkillController.java:153-161).
- vNext now: Schema global default limit 15 even category mode (catalog-validation.ts:3-8).
- Fix: Set mode=category default limit 50, mode=popular default 10, mode=search default 15.

## G2-6-016-021  [P2] GAP  facet F05  effort S
- Legacy: Popular endpoint default 10 (SkillController.java:78-84; SkillsSearchController.java:55-61).
- vNext now: Global default 15 (catalog-validation.ts:7).
- Fix: Apply mode-specific popular default 10.

## G2-6-016-022  [P2] GAP  facet F06  effort S
- Legacy: Autocomplete default placeholder Type to search skills (e.g., Java, Python, React)... (SkillsAutocomplete.jsx:33-42).
- vNext now: New placeholder Search and select skills... (learner-skill-catalog-input.tsx:66).
- Fix: Adopt legacy placeholder unless page copy intentionally diverges.

## G2-6-016-025  [P2] GAP  facet F06  effort M
- Legacy: Legacy persists recent skills 10, displays 5 (SkillsAutocomplete.jsx:90-112).
- vNext now: New stores no recent list (learner-skill-catalog-input.tsx:7-43).
- Fix: Implement local recents with privacy-safe storage and matching list behavior.

## G2-6-016-026  [P2] GAP  facet F06  effort M
- Legacy: Legacy gives proficiency Beginner/Intermediate/Advanced/Expert (SkillsAutocomplete.jsx:53-59).
- vNext now: New list has no proficiency selector (learner-skill-catalog-input.tsx:78-88).
- Fix: Restore exact four-value proficiency choices and badges.

## G2-6-016-032  [P2] GAP  facet F09  effort M
- Legacy: Autocomplete popup has Recent/Popular sections (SkillsAutocomplete.jsx:116-134).
- vNext now: New single PopoverListbox of suggestions (learner-skill-catalog-input.tsx:78-88).
- Fix: Clone grouped dropdown sections and dismissal behavior.

## G2-6-016-046  [P2] GAP  facet F16  effort M
- Legacy: Legacy AntD autocomplete layout and 8px header spacing (SkillsAutocomplete.jsx:116-134).
- vNext now: New popup full width, max-height 12rem, min 44px targets (learner-skill-catalog-input.tsx:78-85).
- Fix: Compare phone/tablet group wrapping, badge truncation and scroll height against real legacy screenshot.

## G2-6-016-048  [P2] GAP  facet F18  effort S
- Legacy: Legacy default placeholder Type to search skills (e.g., Java, Python, React)... (SkillsAutocomplete.jsx:33-42).
- vNext now: Search and select skills... (learner-skill-catalog-input.tsx:66).
- Fix: Restore literal copy at reused autocomplete.

## G2-6-016-049  [P2] GAP  facet F18  effort S
- Legacy: Legacy no-results/error copy surfaced from old search response; v1 failure message long (SkillController.java:70-75).
- vNext now: New No catalog suggestions found. You can still save your own skill name. (learner-skill-catalog-input.tsx:71-77).
- Fix: Compare old AntD Empty copy and error states; match literal old wording where it was visible.

## G2-6-016-051  [P2] GAP  facet F19  effort S
- Legacy: Legacy limits search 15 popular 10 category 50 by default (SkillController.java:63-64,81-82,158-159).
- vNext now: New global limit default15 (catalog-validation.ts:7).
- Fix: Set limits based on mode; retain 1-50 cap if safe.

## G2-6-016-054  [P2] GAP  facet F20  effort M
- Legacy: Legacy on-mount recent skills localStorage, 10 kept/5 shown (SkillsAutocomplete.jsx:90-112).
- vNext now: New no local recents (learner-skill-catalog-input.tsx:7-43).
- Fix: Ensure storage failures/private browsing graceful if restoring old recent list.

## G2-6-016-058  [P2] GAP  facet F22  effort M
- Legacy: Legacy has six individually named indexes (Skill.java:11-18).
- vNext now: Draft composite name/search/popularity indexes with lower(name) uniqueness (db10-skills-catalog.draft.ts:50-55).
- Fix: Prove query plans for active/category/sorted/popular; add missing beneficial indexes.

## G2-6-016-060  [P2] GAP  facet F22  effort S
- Legacy: Legacy updatedAt auto-managed on update (Skill.java:46-52).
- vNext now: Draft updatedAt default now but no update hook (db10-skills-catalog.draft.ts:47-48).
- Fix: Ensure mutation service updates updatedAt explicitly or DB trigger.

## G2-6-016-062  [P2] MISSING  facet F23  effort M
- Legacy: Legacy exposes cache stats and exists API (SkillsSearchController.java:103-122).
- vNext now: New read-only catalog lacks these modes (catalog-validation.ts:3-7; route.ts:12-36).
- Fix: Trace consumers; implement exists/stats endpoint if actually used, otherwise record deliberate retirement.

## G2-6-016-005  [P3] GAP  facet F03  effort S
- Legacy: Legacy displays per-group count in parentheses (SkillsAutocomplete.jsx:116-134).
- vNext now: New suggestions list no counts (learner-skill-catalog-input.tsx:78-88).
- Fix: Add count labels to Popular/Recent/Search groups.
