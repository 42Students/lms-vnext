# Work packet: edit src/modules/placements/recruiter-profile-details-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/recruiter-profile.md, docs/audit/gap2/lane-15/recruiter.md

## G2-1-035-033  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:160: 'First name is required' field error from AntD.
- vNext now: src/modules/placements/recruiter-profile-details-model.ts:4 and 11-18: server Zod validation; E:61 generic feedback by status.
- Fix: Show First name required directly under input before request.

## G2-1-035-034  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:106-108: INVALID_MOBILE sets phone field and 'Check the mobile number.' summary.
- vNext now: src/modules/placements/recruiter-profile-details-model.ts:16-18,22-27: schema error but generic save feedback instead of field binding.
- Fix: Map INVALID_MOBILE/400 Zod path to mobile input, retain old summary.

## G2-15-016-029  [P2] GAP  facet F08  effort S
- Legacy: Suspended reason stored for admin. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:65-66`)
- vNext now: New profile access ended message directs ask placement cell. (`src/modules/placements/recruiter-profile-details-model.ts:24-27`)
- Fix: Surface suspension reason to authorized support user only.
