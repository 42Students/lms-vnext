# Work packet (wave 2): edit src/components/tpo/tpo-company-visibility-editor.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/tpo-settings-controller.md

## G2-6-022-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy SeeTab has switches card followed by How sharing works card (settings.js:470-489).
- vNext now: vNext page renders intro, editor, College sharing policy, Recruiter-visible fields disclosures (see/page.tsx:46-65,65-115; tpo-company-visibility-editor.tsx:38-58).
- Fix: Restore original sections/order while retaining genuinely new policy source explanations separately.

## G2-6-022-053  [P2] GAP  facet F16  effort M
- Legacy: Legacy Rule forms inline wrap using AntD Space wrap (settings.js:334-341), switches vertical card (settings.js:471-479).
- vNext now: vNext rules sm:grid-cols-2, visibility checkbox rows min-h11 (tpo-college-rules-control.tsx:94-114; tpo-company-visibility-editor.tsx:42-55).
- Fix: Align 1280/768/375 line wrapping, button alignment, and switch touch targets to legacy.
