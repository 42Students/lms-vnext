# Work packet (wave 2): edit src/modules/courses/faculty-quiz-authoring-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u016-quiz-question.md

## G2-16-016-018  [P2] GAP  facet F10  effort 
- Legacy: QuizQuestionRepository.java:11-12 read nondeleted, hard delete all by quiz ID.
- vNext now: faculty-quiz-authoring-service.ts:119-171 delete/recreate on draft edit; writes activity.
- Fix: Preserve existing IDs when editing an unchanged question if answer/history references require stable identity.
