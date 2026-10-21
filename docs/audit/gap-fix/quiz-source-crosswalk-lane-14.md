# Quiz source crosswalk — lane 14

Legacy Quiz, Question, Option, Attempt and Answer integer IDs are source identities. Resolve them through college-scoped legacy_id_map into a UUID quiz/lesson/delivery, question, option, membership, and writer; never cast IDs directly or trust the old role string for current authorization.

Legacy quiz active and enabled are independent source flags; native status and resultsPublished continue to control audience. Legacy attempt status SUBMITTED, bigint score/maxScore, updatedAt, deleted and learner int are retained as source metadata. Immutable vNext attempts are not physically deleted. Quarantine any bigint that overflows the native integer or any invalid enrollment/delivery/grade; use verified timezone when translating the source naive submittedAt.

Legacy quiz_answers selected_option_ids is nullable comma-separated ordered numeric option IDs. Convert only after resolving source option IDs to verified per-quiz UUIDs. A source NULL becomes [] only if an approved unanswered policy says so; numeric sorting is not proof of click order. History/deletion flags are not new permissions.

Legacy QuizQuestionRequestDTO caps points at 100; the schema is now aligned with 100, but 0223 remains unregistered until 101..1000 historical records and teacher authoring validation are reconciled. Migration has not run.