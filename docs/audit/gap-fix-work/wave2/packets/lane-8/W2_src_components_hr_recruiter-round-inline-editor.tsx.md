# Work packet (wave 2): edit src/components/hr/recruiter-round-inline-editor.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-jobid.md

## G2-11-002-014  [P2] GAP  facet F03  effort S
- Legacy: Per-row Change and Remove controls `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:463`
- vNext now: Combined Change/Remove action `src/components/hr/recruiter-round-inline-editor.tsx:93`
- Fix: Use per-row link actions

## G2-11-002-031  [P2] GAP  facet F06  effort S
- Legacy: Round kind TEST label Test `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:349`
- vNext now: VNext Online test `src/components/hr/recruiter-round-inline-editor.tsx:20`
- Fix: Change dropdown wording

## G2-11-002-032  [P2] GAP  facet F06  effort S
- Legacy: Add a round at the end modal title `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:420`
- vNext now: Add a round modal title `src/components/hr/recruiter-round-inline-editor.tsx:97`
- Fix: Match exact title

## G2-11-002-033  [P2] GAP  facet F06  effort S
- Legacy: Round name placeholder For example: Managerial round `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:423`
- vNext now: No example placeholder `src/components/hr/recruiter-round-inline-editor.tsx:102`
- Fix: Restore placeholder

## G2-11-002-034  [P2] GAP  facet F06  effort S
- Legacy: Where Decide later with allowClear `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:424`
- vNext now: Where has Date to be decided option `src/components/hr/recruiter-round-inline-editor.tsx:109`
- Fix: Restore placeholder/cancel state

## G2-11-002-035  [P2] GAP  facet F06  effort S
- Legacy: Placement cell date/venue helper text `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:425`
- vNext now: No equivalent help in modal `src/components/hr/recruiter-round-inline-editor.tsx:114`
- Fix: Show same helper

## G2-11-002-052  [P2] GAP  facet F09  effort S
- Legacy: Discard these round changes confirm `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:390`
- vNext now: Discard unsaved round changes confirm `src/components/hr/recruiter-round-inline-editor.tsx:125`
- Fix: Exact strings

## G2-11-002-078  [P2] GAP  facet F16  effort S
- Legacy: Round Form layout vertical `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:422`
- vNext now: VNext modal switches md:grid-cols2 `src/components/hr/recruiter-round-inline-editor.tsx:100`
- Fix: Single vertical column

## G2-11-002-081  [P2] GAP  facet F17  effort S
- Legacy: Field-level name required message `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:423`
- vNext now: InlineNotice not attached to name input `src/components/hr/recruiter-round-inline-editor.tsx:114`
- Fix: aria-describedby field error

## G2-11-002-083  [P2] GAP  facet F18  effort S
- Legacy: Test (not Online test) exact label `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:349`
- vNext now: Online test option `src/components/hr/recruiter-round-inline-editor.tsx:20`
- Fix: Rename

## G2-11-002-056  [P3] GAP  facet F10  effort S
- Legacy: POST rounds; PUT/DELETE round operations `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterDriveController.java:147`
- vNext now: Single POST FormData action `src/components/hr/recruiter-round-inline-editor.tsx:61`
- Fix: Map contracts

## G2-11-002-095  [P3] GAP  facet F22  effort S
- Legacy: Legacy DELETE rounds `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterDriveController.java:157`
- vNext now: VNext POST action REMOVE `src/components/hr/recruiter-round-inline-editor.tsx:50`
- Fix: Verify service semantics
