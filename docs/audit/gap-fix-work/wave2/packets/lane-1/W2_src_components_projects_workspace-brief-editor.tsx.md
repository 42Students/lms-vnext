# Work packet (wave 2): edit src/components/projects/workspace-brief-editor.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l18-u028-superadmin-workspace-overview.md, docs/audit/gap2/lane-7/u011-college-admin-workspace-overview.md

## G2-18-028-005  [P2] MISSING  facet F02  effort M
- Legacy: Project brief card begins eyebrow Learner & mentor view, h4 guidance, description; WorkspaceOverviewEditor.jsx:19-30
- vNext now: New collapsed Edit project brief has no equivalent intro; src/components/projects/workspace-brief-editor.tsx:36-39
- Fix: Restore intro, shared-card spacing, optionally default-open in Super Admin mode

## G2-18-028-006  [P2] GAP  facet F02  effort M
- Legacy: Old Goal full width, two boxed half-width fields Deliverables/Definition of done, Personas full width; WorkspaceOverviewEditor.jsx:32-112
- vNext now: New five textareas in vertical list; workspace-brief-editor.tsx:39-58
- Fix: Restore two-up LG middle section while keeping new Description

## G2-18-028-007  [P2] GAP  facet F03  effort S
- Legacy: Old primary Save project brief plus Changes update the Overview seen by mentors and students helper; WorkspaceOverviewEditor.jsx:112-117
- vNext now: New Save brief and Cancel, no helper; workspace-brief-editor.tsx:51-58
- Fix: Match button name, helper, sizes, pending state

## G2-18-028-014  [P2] GAP  facet F06  effort S
- Legacy: Goal legacy label Project goal / description, help and 4-9 rows autosize; WorkspaceOverviewEditor.jsx:37-46
- vNext now: New Project goal max2000, Description max4000 separated; workspace-brief-editor.tsx:40-43
- Fix: Restore label, sample placeholder, helper and row height

## G2-18-028-015  [P2] GAP  facet F06  effort S
- Legacy: Deliverables 7-12 row autosize, 3-line example and checklist helper; WorkspaceOverviewEditor.jsx:51-71
- vNext now: New generic one-per-line textarea; workspace-brief-editor.tsx:44-49
- Fix: Restore helper/placeholder/height and split layout

## G2-18-028-016  [P2] GAP  facet F06  effort S
- Legacy: Definition of done subsection, completion conditions hint and sample; WorkspaceOverviewEditor.jsx:75-90
- vNext now: New only Completion conditions text area; workspace-brief-editor.tsx:44-49
- Fix: Restore section header, verifiable completion guidance, examples

## G2-18-028-017  [P2] GAP  facet F06  effort S
- Legacy: Personas & ownership heading, sample two roles, 4-10 row autosize; WorkspaceOverviewEditor.jsx:95-109
- vNext now: New Personas list textarea; workspace-brief-editor.tsx:44-49
- Fix: Restore ownership wording, placeholder and rows

## G2-18-028-027  [P2] GAP  facet F10  effort S
- Legacy: Old success reload/error modal; overview.js:97-103
- vNext now: New router.refresh and inline alert; workspace-brief-editor.tsx:27-34
- Fix: Keep refresh but match save/error feedback and status semantics

## G2-18-028-034  [P2] GAP  facet F16  effort S
- Legacy: Old xs24/lg12 two-column Deliverables/Definition; WorkspaceOverviewEditor.jsx:49-93
- vNext now: New editor one-column regardless width; workspace-brief-editor.tsx:39-51
- Fix: At >=992px use equal halves gap20, stack on mobile

## G2-18-028-036  [P2] GAP  facet F17  effort S
- Legacy: Old semantic sections aria-labelledby, Form.Item help+validation; WorkspaceOverviewEditor.jsx:32-109
- vNext now: New wrapped labels but no subsection headings or described examples; workspace-brief-editor.tsx:40-49
- Fix: Restore heading hierarchy, label-describedby/help/error associations

## G2-18-028-038  [P2] GAP  facet F18  effort S
- Legacy: Old Project brief/Learner & mentor view/Make the project understandable before anyone opens the board; WorkspaceOverviewEditor.jsx:19-29
- vNext now: New Overview/Edit project brief; project-workspace.tsx:460-471;workspace-brief-editor.tsx:36-43
- Fix: Restore exact editor labels and lede text

## G2-18-028-039  [P2] GAP  facet F18  effort S
- Legacy: Old Save project brief/Overview updated/No changes to save/Failed to update overview; overview.js:72-102;WorkspaceOverviewEditor.jsx:112-116
- vNext now: New Save brief/no toast/Unable to save workspace brief; workspace-brief-editor.tsx:24-34,51-59
- Fix: Restore exact labels and state copy or document approved exceptions

## G2-7-011-015  [P2] GAP  facet F04  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:65-81: `personas` array persisted under overview.personas.
- vNext now: V/components/projects/workspace-brief-model.ts:2-8 and workspace-brief-editor.tsx:18: authoredBrief.personas array.
- Fix: Verify old personas persist on new workspace and document conversion.
