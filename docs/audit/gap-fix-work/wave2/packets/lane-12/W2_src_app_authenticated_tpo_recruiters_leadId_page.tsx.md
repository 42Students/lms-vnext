# Work packet (wave 2): edit src/app/(authenticated)/tpo/recruiters/[leadId]/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l11-u019-tpo-recruiter-lead-detail.md

## G2-11-019-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:37-40`
- vNext now: `src/app/(authenticated)/tpo/recruiters/[leadId]/page.tsx:12-38`
- Fix: Legacy /tpo/recruiters/[recruiterLeadId], vNext /tpo/recruiters/[leadId]; same surface but param UUID versus legacy int, old deep-link translation.
