# Work packet: edit src/components/courses/faculty-course-roster.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/course-student-roster.md

## G2-3-009-054  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:64-95`
- vNext now: `src/components/courses/faculty-course-roster.tsx:15-23`; `src/modules/courses/faculty-student-detail-service.ts:15-29`
- Fix: Old numeric learnerId/classId and fields first_name,last_name,roll_number,contact_mobile,contact_mail map to UUID membershipId,displayName,rollNumber,phoneE164,email. Verify current membership and class mapping.

## G2-3-009-023  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:295-308`
- vNext now: `src/components/courses/faculty-course-roster.tsx:186-190`
- Fix: Legacy no-match subtitle `Try searching by name, roll number, or contact number.`, new `Try another name, roll number, phone number or email.`

## G2-3-009-025  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:352-382`
- vNext now: `src/components/courses/faculty-course-roster.tsx:180-183`
- Fix: Live region count only on active filter in legacy, always shown in new; restore exact filter confirmation placement and condition.
