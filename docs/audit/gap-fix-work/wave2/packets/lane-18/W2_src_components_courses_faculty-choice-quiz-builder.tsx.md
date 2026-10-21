# Work packet (wave 2): edit src/components/courses/faculty-choice-quiz-builder.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/quiz-option-entity.md

## G2-17-016-005  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/QuizOption.java:19-25 — Field names questionId, optionText, correct, sequence.
- vNext now: src/components/courses/faculty-choice-quiz-builder.tsx:21-28 — Editor model text/correct/sequence; lacks persisted ID in local Option type.
- Fix: Preserve stable option IDs during edits and attempted quiz locking.
