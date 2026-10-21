# Work packet: edit src/components/tpo/tpo-custom-job-type-rename.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-types.md

## G2-3-011-025  [P1] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:60-98`
- vNext now: `src/components/tpo/tpo-custom-job-type-rename.tsx:14-17`
- Fix: Legacy confirm Rename on drives too? enumerates from/to and N drives changed; vNext says Existing drives are not rewritten by this change. Restore propagation and truthful confirmation.
