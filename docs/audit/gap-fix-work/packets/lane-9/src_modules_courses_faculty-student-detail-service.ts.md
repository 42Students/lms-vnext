# Work packet: edit src/modules/courses/faculty-student-detail-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/course-student-roster.md

## G2-3-009-054  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:64-95`
- vNext now: `src/components/courses/faculty-course-roster.tsx:15-23`; `src/modules/courses/faculty-student-detail-service.ts:15-29`
- Fix: Old numeric learnerId/classId and fields first_name,last_name,roll_number,contact_mobile,contact_mail map to UUID membershipId,displayName,rollNumber,phoneE164,email. Verify current membership and class mapping.
