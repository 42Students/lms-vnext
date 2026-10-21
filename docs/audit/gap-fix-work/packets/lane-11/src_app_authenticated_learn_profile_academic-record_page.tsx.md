# Work packet: edit src/app/(authenticated)/learn/profile/academic-record/page.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/learner-placement-profile-controller.md

## G2-1-009-007  [P1] MISSING  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:58-60`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:72-74`: source VERIFIED versus SELF status exists.
- vNext now: `src/app/(authenticated)/learn/profile/academic-record/page.tsx:15-30`: no provenance badge or label in current-enrollment block.
- Fix: Display actual evidence source/verified state with nonmisleading badge and explanation.

## G2-1-009-008  [P1] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:29-30`: cgpa BigDecimal mapped.
- vNext now: `src/modules/people/learner-academic-summary-service.ts:58-90`: selects program/cohort/department but not academic evidence; `src/app/(authenticated)/learn/profile/academic-record/page.tsx:17-24` no CGPA.
- Fix: Project confirmed CGPA from scoped academic evidence, show precision and fallback.

## G2-1-009-009  [P1] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:34-35`: tenthPct BigDecimal.
- vNext now: `src/app/(authenticated)/learn/profile/academic-record/page.tsx:17-24`: not present; `src/db/schema/placements.ts:749-749`: tenthPctBasisPoints available elsewhere.
- Fix: Read verified 10th percent, convert basis points to percentage, label source.

## G2-1-009-010  [P1] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:37-38`: twelfthPct BigDecimal.
- vNext now: `src/app/(authenticated)/learn/profile/academic-record/page.tsx:17-24`: absent; `src/db/schema/placements.ts:750`: twelfthPctBasisPoints stored.
- Fix: Read verified 12th percent and format percent accurately.

## G2-1-009-011  [P1] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:40-41`: diplomaPct BigDecimal.
- vNext now: `src/app/(authenticated)/learn/profile/academic-record/page.tsx:17-24`: absent; `src/db/schema/placements.ts:751`: diplomaPctBasisPoints stored.
- Fix: Add diploma percentage and absence placeholder.

## G2-1-009-012  [P1] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:43-44`: ugPct BigDecimal.
- vNext now: `src/app/(authenticated)/learn/profile/academic-record/page.tsx:17-24`: not displayed; `src/modules/people/learner-academic-summary-service.ts:58-90` no UG score selected.
- Fix: Map UG percentage evidence and represent unavailable field truthfully.

## G2-1-009-017  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:58-60`: source SELF or VERIFIED.
- vNext now: `src/app/(authenticated)/learn/profile/academic-record/page.tsx:28-30`: text says not proof, no actual source.
- Fix: Display provenance per specific data row rather than universal unverifiable caveat.

## G2-1-009-035  [P1] MISSING  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:13-16`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:72-74`: VERIFIED always wins over SELF eligibility score.
- vNext now: `src/modules/people/learner-academic-summary-service.ts:19-21`,`src/app/(authenticated)/learn/profile/academic-record/page.tsx:28-30`: enrollment-only summary, no placement score provenance.
- Fix: Resolve VERIFIED-versus-SELF precedence in academic record against published evidence.

## G2-1-009-026  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/LearnerPlacementProfileService.java:27-34`: absent record is returned as empty object with defaults, not 404.
- vNext now: `src/app/(authenticated)/learn/profile/academic-record/page.tsx:25-27`: missing active enrollment explanatory copy.
- Fix: Separate not-imported score record and no-enrollment error strings.
