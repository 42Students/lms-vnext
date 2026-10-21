# Work packet (wave 2): edit src/components/tracker/tracker-issue-saved-views.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u004-tracker-issues-index.md

## G2-16-004-030  [P2] GAP  facet F06  effort M
- Legacy: `issues/index.js:140-149`: applying saved preset resets page and restores status/env/reporter/search/sort.
- vNext now: `tracker-issue-saved-views.tsx:24-31,69-77`: saved URL filter includes q/reporter/status/severity/env/sort; different key shape.
- Fix: Migrate legacy saved preset state with explicit key translation and apply semantics.

## G2-16-004-031  [P2] GAP  facet F06  effort S
- Legacy: `issues/index.js:367-385`: save-name modal maxLength 40, Save disabled for blanks, Enter submits.
- vNext now: `tracker-issue-saved-views.tsx:55-67`: input maxLength 60, Save button allowed then error on blank.
- Fix: Restore modal, 40-character max and disabled blank save, Enter shortcut.

## G2-16-004-039  [P2] GAP  facet F09  effort M
- Legacy: `issues/index.js:367-385`: `Save this view` modal, input `e.g. Open production bugs`, Save/Cancel buttons.
- vNext now: `tracker-issue-saved-views.tsx:55-84`: expanded details with `Name these filters`, no modal.
- Fix: Implement modal trigger, exact placeholder, focus/escape and Save disabled until valid.

## G2-16-004-040  [P2] GAP  facet F09  effort M
- Legacy: `issues/index.js:280-289`: saved views dropdown anchored on starred button, with delete × on row.
- vNext now: `tracker-issue-saved-views.tsx:69-80`: inline list of named and Delete buttons.
- Fix: Restore compact overlay menu, visible preset count and row delete icon.

## G2-16-004-047  [P2] GAP  facet F12  effort M
- Legacy: `trackerSavedFilters.js:1-4,36-42`: max 10 saved presets, names trimmed to 40 chars, case-insensitive replace and newest-first.
- vNext now: `tracker-issue-saved-views.tsx:9-21,45-53`: max 12, names 60, case-sensitive replace, append to bottom.
- Fix: Use same max 10, 40-char names, case-folded identity, newest-first ordering; migrate storage key.

## G2-16-004-048  [P2] GAP  facet F12  effort S
- Legacy: `issues/index.js:183-186`: Save current filters disabled unless at least one nondefault filter.
- vNext now: `tracker-issue-saved-views.tsx:45-54,64-67`: can save all-empty view.
- Fix: Disable Save current filters when all settings match default.

## G2-16-004-061  [P2] GAP  facet F17  effort M
- Legacy: `issues/index.js:367-385`: save modal autofocusses Input, Enter saves, escape cancel via Ant Modal.
- vNext now: `tracker-issue-saved-views.tsx:55-84`: inline input with no modal focus trap.
- Fix: Restore focus trap/return, autofocus, Enter/Escape interactions in saved-view dialog.

## G2-16-004-074  [P2] GAP  facet F20  effort S
- Legacy: `trackerSavedFilters.js:37-42`: duplicate names case-insensitive replaced, saved first.
- vNext now: `tracker-issue-saved-views.tsx:45-53`: case-sensitive duplicate check and append last.
- Fix: Implement lowercase normalized name key and newest-first update.

## G2-16-004-080  [P2] GAP  facet F22  effort M
- Legacy: `trackerSavedFilters.js:1-14`: separate per-browser state key tracker_saved_filters with fields search/status/env/reporter/sort.
- vNext now: `tracker-issue-saved-views.tsx:9-31`: key 42tracker_saved_issue_views_v1, fields q/reporter/status/severity/env/sort.
- Fix: Migrate stored saved views, enforce same max/name/id semantics.

## G2-16-004-083  [P2] GAP  facet F23  effort M
- Legacy: `issues/index.js:367-385`: save-view Modal.
- vNext now: `tracker-issue-saved-views.tsx:55-84`: details disclosure rather than modal, extra explanatory empty text.
- Fix: Restore modal, compact dropdown and exact save behavior.

## G2-16-004-010  [P3] GAP  facet F03  effort S
- Legacy: `issues/index.js:279-281`: starred Saved views button with count in label.
- vNext now: `tracker-issue-saved-views.tsx:55-57`: plain disclosure label `Saved views`, no count or star.
- Fix: Use starred trigger and `Saved views (N)` when nonzero.

## G2-16-004-068  [P3] GAP  facet F18  effort S
- Legacy: `issues/index.js:383`: preset input placeholder `e.g. Open production bugs`.
- vNext now: `tracker-issue-saved-views.tsx:61`: `Name these filters`.
- Fix: Restore placeholder.
