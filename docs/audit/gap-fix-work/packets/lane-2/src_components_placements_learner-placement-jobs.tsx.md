# Work packet: edit src/components/placements/learner-placement-jobs.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/learner-placement-jobs.md, docs/audit/gap2/lane-15/u005-learner-placement-job-detail.md

## G2-14-005-015  [P1] GAP  facet F04  effort L
- Legacy: Legacy card title job.jobTitle, companyName, raw jobType chip; vNext job+role option may produce multiple role cards per drive — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:165-193`
- vNext now: `src/app/(authenticated)/learn/my-placements/jobs/page.tsx:12-56`; `src/components/placements/learner-placement-jobs.tsx:520-540`
- Fix: Retain role-option data but present legacy job-level grouping with role subchoices

## G2-14-005-059  [P1] GAP  facet F12  effort M
- Legacy: Legacy application badges use applicationStatus and map statuses; vNext typed channel/status, but display Applied · channel instead of stage — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:425-430,165-173`
- vNext now: `src/components/placements/learner-placement-jobs.tsx:286-293`
- Fix: Display actual screening/interview/offer status chip where available

## G2-14-005-089  [P1] GAP  facet F22  effort M
- Legacy: Legacy applicationStage from job.applicationStatus; vNext placementApplications.status plus eligibility, different enum semantics — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:418-431`
- vNext now: `src/modules/placements/learner-job-service.ts:78-88`; `src/components/placements/learner-placement-jobs.tsx:286-293`
- Fix: Map statuses to legacy application-stage chip vocabulary

## G2-15-005-038  [P1] MISSING  facet F09  effort M
- Legacy: Legacy resume Preview modal width860 iframe PDF and fallback DOC notice (JobDetailContent.jsx:1440-1465)
- vNext now: VNext no Preview action or modal in job detail (learner-placement-job-detail.tsx:44-300; learner-placement-jobs.tsx:429-490)
- Fix: Restore secure signed resume preview dialog and non-PDF fallback/download link

## G2-15-005-056  [P1] MISSING  facet F14  effort M
- Legacy: Legacy JD PDF/URL link, resume preview link; no direct resume upload per drive (JobDetailContent.jsx:1023-1042,1256-1269,1440-1465)
- vNext now: VNext no JD download and no resume preview in job detail (learner-placement-job-detail.tsx:168-197; learner-placement-jobs.tsx:429-490)
- Fix: Restore safe stored JD and signed resume preview links, no unapproved upload

## G2-15-005-059  [P1] GAP  facet F16  effort L
- Legacy: Legacy sticky right application rail and mobile fixed apply bar visible whenever !hasApplied (JobDetailContent.jsx:1320-1344)
- vNext now: VNext all role actions inline at bottom; no fixed mobile apply bar (learner-placement-job-detail.tsx:283-299; learner-placement-jobs.tsx:394-429)
- Fix: Restore sticky right rail at desktop and mobile fixed CTA respecting notch/safe area
