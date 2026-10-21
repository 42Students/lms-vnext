# Work packet: edit src/components/admin/descendant-feature-rule-editor.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-module-access.md

## G2-10-019-014  [P1] GAP  facet F03  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:506-513 — 'Placement cell decides' textual state with tooltip for eligibility-controlled cells.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:245-250; src/components/admin/descendant-feature-rule-editor.tsx:53-66 — Placements mutable selector appears for academic scope.
- Fix: Determine where eligibility is authoritative; avoid falsely editable cells.

## G2-10-019-030  [P1] GAP  facet F06  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:524-527 — Clicking an editable module cell opens Segmented Inherit/On/Off in-place.
- vNext now: src/components/admin/descendant-feature-rule-editor.tsx:43-65 — Select scope+module, Recheck, then separate dropdown and Save rule.
- Fix: Restore in-cell tri-state editing and immediate apply behavior.

## G2-10-019-031  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:528-539 — Lock icon appears only Super Admin and explicit value; toggle via confirmation.
- vNext now: src/components/admin/descendant-feature-rule-editor.tsx:64-66 — Lock checkbox exposed when rule loaded; dropdown save submits combined lock/value.
- Fix: Match explicit-only lock availability and confirmation.

## G2-10-019-046  [P1] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:398-433 — Broad (>100 students or college/dept/program) On/Off/Inherit opens confirmation with blast-radius text.
- vNext now: src/components/admin/descendant-feature-rule-editor.tsx:30-41 — Generic confirm 'Apply this module rule to selected academic scope?' lacks count.
- Fix: Show actual scope population, implications, and danger style for Off.

## G2-10-019-047  [P1] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:459-499 — Broad Lock/Unlock confirm with warnings about ignored lower settings.
- vNext now: src/components/admin/descendant-feature-rule-editor.tsx:30-41,63-66 — Generic confirmation, lacks lock-specific ramifications.
- Fix: Separate lock confirm with exact consequences and current value.

## G2-10-019-065  [P1] GAP  facet F12  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:515-576 — Ancestor locked causes disabled control and explicit shadow strikeout.
- vNext now: src/components/admin/descendant-feature-rule-editor.tsx:43-66 — Selector doesn't explain shadowing; relies backend reject.
- Fix: Resolve ancestor lock before offering mutating control.

## G2-10-019-111  [P1] MISSING  facet F23  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:398-499 — Scope-population warnings for actions affecting many students.
- vNext now: src/components/admin/descendant-feature-rule-editor.tsx:30-41 — Generic confirm in descendant editor.
- Fix: Require selected-scope blast-radius and warning, no guessed number.

## G2-10-019-040  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:367-371 — Save failure uses server response or 'Could not save — please retry'.
- vNext now: src/components/admin/descendant-feature-rule-editor.tsx:33-42 — Surface raw API error / 'Save failed' text, no Ant toast.
- Fix: Map precise operation-specific save errors in action context.

## G2-10-019-041  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:363-366 — Hierarchy cell mutation toast 'Saved'.
- vNext now: src/components/admin/descendant-feature-rule-editor.tsx:36-41 — In-page 'Module access saved.'
- Fix: Use source confirmation toast and refresh tree.

## G2-10-019-045  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:625-636 — Refresh is local action with spinner.
- vNext now: src/components/admin/descendant-feature-rule-editor.tsx:59-65 — Recheck checks one rule; feedback 'Module access saved' only.
- Fix: Surface reload spinner and result state.
