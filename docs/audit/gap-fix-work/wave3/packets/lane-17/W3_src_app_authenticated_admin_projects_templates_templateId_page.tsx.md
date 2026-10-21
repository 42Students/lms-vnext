# Work packet (wave 3): edit src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u035-superadmin-template-overview.md

## G2-7-035-024  [P1] MISSING  facet F06  effort L
- Legacy: overview.js:629-649 lifecycle and initial workspace status Selects; Archived disabled
- vNext now: admin/projects/templates/[templateId]/page.tsx:63-101 lifecycle actions but no initial status picker
- Fix: Restore editable initial workspace status or document deliberate enum replacement

## G2-7-035-027  [P1] MISSING  facet F06  effort L
- Legacy: overview.js:810-819 create-from-template title max160 and optional numeric Class ID
- vNext now: admin/projects/templates/[templateId]/page.tsx:63-101 no create modal
- Fix: Recreate form with selected-college+class boundary and template preselect

## G2-7-035-038  [P1] MISSING  facet F09  effort L
- Legacy: overview.js:797-822 Create workspace Modal with title and classId
- vNext now: admin/projects/templates/[templateId]/page.tsx:63-101 no Create modal
- Fix: Restore modal and validation

## G2-7-035-043  [P1] MISSING  facet F10  effort L
- Legacy: overview.js:409-443 createProjectFromTemplate API with collegeId and optional classId
- vNext now: admin/projects/templates/[templateId]/page.tsx:63-101 no create-from-template POST
- Fix: Restore mutation path or prefilled workspace creation

## G2-7-035-078  [P1] MISSING  facet F23  effort L
- Legacy: overview.js:589-725 global form edits project goal, task seed status and submission instructions
- vNext now: admin/projects/templates/[templateId]/page.tsx:113-155 read-only blueprint plus metadata only
- Fix: Record full authoring parity gap; do not treat current read-only page as equivalently editable

## G2-7-035-079  [P1] MISSING  facet F23  effort L
- Legacy: overview.js:761-822 Preview and Create workspace modals
- vNext now: admin/projects/templates/[templateId]/page.tsx:63-101 no equivalent direct actions
- Fix: Restore both workflows or document product deletion and replacement
