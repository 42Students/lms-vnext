# Lane 16 cross-file handoffs

- G2-3-011-020 | `src/components/tpo/tpo-job-types-editor.tsx`: replace generic `TPO_JOB_TYPE_EXISTS` toast with `"<normalized offending name>" is already a job type` using create/rename context; align server error detail. Owned outside lane-16 packet.
- G2-14-025-024 | `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/page.tsx`: consume `?changed=CREATED|UPDATED|REMOVED` after 303 POST redirect and show legacy success toast/notice. Do not change `hrRoundMutationReceiptSchema` strict JSON receipt.
- G2-6-026-017 | `src/modules/placements/public-join/send-code-service.ts` and linked-company verified-domain lookup: replace the sole `link.companyDomain` argument in BOTH preflight and locked transactional validation with all verified domains for the link's company; verify same-company ownership and never accept domain arrays from the anonymous request. Policy now accepts trusted arrays but currently receives a single domain.
