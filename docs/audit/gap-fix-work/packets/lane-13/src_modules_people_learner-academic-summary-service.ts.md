# Work packet: edit src/modules/people/learner-academic-summary-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/learner-placement-profile-controller.md

## G2-1-009-008  [P1] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:29-30`: cgpa BigDecimal mapped.
- vNext now: `src/modules/people/learner-academic-summary-service.ts:58-90`: selects program/cohort/department but not academic evidence; `src/app/(authenticated)/learn/profile/academic-record/page.tsx:17-24` no CGPA.
- Fix: Project confirmed CGPA from scoped academic evidence, show precision and fallback.

## G2-1-009-012  [P1] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:43-44`: ugPct BigDecimal.
- vNext now: `src/app/(authenticated)/learn/profile/academic-record/page.tsx:17-24`: not displayed; `src/modules/people/learner-academic-summary-service.ts:58-90` no UG score selected.
- Fix: Map UG percentage evidence and represent unavailable field truthfully.

## G2-1-009-035  [P1] MISSING  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:13-16`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:72-74`: VERIFIED always wins over SELF eligibility score.
- vNext now: `src/modules/people/learner-academic-summary-service.ts:19-21`,`src/app/(authenticated)/learn/profile/academic-record/page.tsx:28-30`: enrollment-only summary, no placement score provenance.
- Fix: Resolve VERIFIED-versus-SELF precedence in academic record against published evidence.
