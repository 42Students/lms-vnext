# Work packet: edit drizzle/0007_courses_c4b_quizzes.sql

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u016-quiz-question.md

## G2-16-016-035  [P1] GAP  facet F22  effort 
- Legacy: QuizQuestionRequestDTO.java:23-25 max100 points.
- vNext now: quizzes.ts:175-182 max1000; drizzle/0007_courses_c4b_quizzes.sql:23-34 check.
- Fix: Align DB and validator maximum to100 if literal legacy parity.
