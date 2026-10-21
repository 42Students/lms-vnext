# Work packet (wave 2): edit src/modules/placements/recruiter-college-branch-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/recruiter-self-controller.md

## G2-10-025-012  [P2] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:196-200 — College item has studentsTotal and branches list.
- vNext now: src/app/(authenticated)/hr/home/page.tsx:60-72; src/modules/placements/recruiter-college-branch-service.ts:9-19 — College chooser lacks totals and branch chips.
- Fix: Add student count/branches to rich recruiter Colleges page

## G2-10-025-017  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:193-200 — studentsTotal excludes deleted/suspended; branches distinct alphabetical.
- vNext now: src/modules/placements/recruiter-college-branch-service.ts:15-18; src/app/(authenticated)/hr/home/page.tsx:60-72 — Departments branch suggestions capped 200, not learner-derived.
- Fix: Reproduce learner-filtered branches and student count

## G2-10-025-097  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:193-215 — Learner/job/faculty tables used for colleges summary.
- vNext now: src/modules/placements/recruiter-college-branch-service.ts:15-18; src/app/(authenticated)/hr/home/page.tsx:60-72 — New departments and placement jobs/roles require joins.
- Fix: Rebuild counts/contacts with new memberships and placements tables

## G2-10-025-066  [P3] GAP  facet F13  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:193-220 — Empty branches/TPO list returns empty/omits contact fields.
- vNext now: src/modules/placements/recruiter-college-branch-service.ts:15-18; src/app/(authenticated)/hr/home/page.tsx:60-72 — Branch suggestions empty when none, chooser lacks missing-contact placeholder.
- Fix: Show 'No TPO contact available' and 'No branches recorded'
