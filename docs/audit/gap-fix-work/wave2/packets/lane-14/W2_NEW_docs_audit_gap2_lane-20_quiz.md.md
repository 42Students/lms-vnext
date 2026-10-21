# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-20/quiz.md

3 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-20/quiz.md

## G2-20-016-009  [P2] GAP  facet F04  effort S
- Legacy: Legacy totalPoints long integer `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Quiz.java:37-38`
- vNext now: New integer 1..10000, calculated from questions [D:46-47,130-133,V:115-143]
- Fix: Handle legacy quizzes >10000 or points0 in migration and UI

## G2-20-016-012  [P2] GAP  facet F06  effort S
- Legacy: JPA dueAt nullable local datetime `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Quiz.java:33-34`
- vNext now: New required offset-aware ISO date if present, store timestamptz [V:26-28,155-157,D:40-42]
- Fix: Parse old local dates in IST before persist and format due time consistently

## G2-20-016-038  [P2] GAP  facet F21  effort S
- Legacy: JPA quiz model is consumed by QuizService and QuizController [S:12-41,C:55-153]
- vNext now: New courses service, shuffle service and attempt module [Q:1-42,H:15-35]
- Fix: Verify end-to-end route completeness and activity logs, not only schema parity
