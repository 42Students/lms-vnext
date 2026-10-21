# Work packet: edit src/components/hr/recruiter-round-inline-editor.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-jobid.md

## G2-11-002-063  [P1] GAP  facet F12  effort S
- Legacy: Edit only own unused round and unfinished drive `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:463`
- vNext now: Own + PENDING only `src/components/hr/recruiter-round-inline-editor.tsx:85`
- Fix: Align inUse/backend policy

## G2-11-002-039  [P2] GAP  facet F07  effort S
- Legacy: Round name error Give the round a name `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:423`
- vNext now: VNext Enter a round name `src/components/hr/recruiter-round-inline-editor.tsx:53`
- Fix: Exact validation copy

## G2-11-002-040  [P2] GAP  facet F07  effort S
- Legacy: Ant Form.Item field error placement `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:422`
- vNext now: Generic InlineNotice form error `src/components/hr/recruiter-round-inline-editor.tsx:114`
- Fix: Attach to field
