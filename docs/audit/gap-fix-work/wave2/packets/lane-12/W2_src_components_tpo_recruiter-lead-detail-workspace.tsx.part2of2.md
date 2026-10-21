# Work packet (wave 2): edit src/components/tpo/recruiter-lead-detail-workspace.tsx (part 2 of 2)

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l11-u019-tpo-recruiter-lead-detail.md

## G2-11-019-074  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:14-14`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:490-549`
- Fix: Legacy invite email workflow vs vNext copied template/mailto and no automatic provider, verify DLT/SMTP decisions.

## G2-11-019-078  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:266-285`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:622-646`
- Fix: Add follow-up modal/presets changed to inline; reconcile old UX and new enhancement.

## G2-11-019-017  [P3] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:220-224`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:480-489`
- Fix: Legacy Came from source display from shared configurable values, vNext `lead.source \|\| Added by hand`, leaks raw enum.

## G2-11-019-018  [P3] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:250-255`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:649-662`
- Fix: Legacy due date `ddd D MMM, h:mm A` uses Asia/Kolkata dj, vNext formatDateTimeIst absolute with year and different punctuation.

## G2-11-019-056  [P3] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:250-250`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:666-666`
- Fix: Legacy No next step yet, so this recruiter can go quiet. plus Add follow-up action vs vNext No next step yet. Add a follow-up above.

## G2-11-019-065  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:235-245`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:563-595`
- Fix: Legacy Log an interaction, What was said? (optional) and Save vs vNext Log activity, Notes and Log activity.

## G2-11-019-066  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:319-323`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:698-715`
- Fix: Legacy Not now confirm and Why? / Revisit on vs vNext Reason and Mark not now CTA.

## G2-11-019-067  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:219-221`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:482-489`
- Fix: Legacy Came from label vs vNext Source; exact source labels differ.
