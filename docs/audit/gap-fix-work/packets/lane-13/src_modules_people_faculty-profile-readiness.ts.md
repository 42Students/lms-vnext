# Work packet: edit src/modules/people/faculty-profile-readiness.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/faculty-model.md

## G2-4-020-033  [P1] GAP  facet F09  effort L
- Legacy: Legacy profile entity itself defines no drawer/popconfirm controls. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:19-24`)
- vNext now: New About & details editor loads only when DB04 profile storage columns are ready. (`src/app/(authenticated)/teacher/profile/details/page.tsx:13-24`; `src/modules/people/faculty-profile-readiness.ts:5-15`)
- Fix: Register tested profile storage migration so existing profile editing works.
