# Quiz authoring selection controls

Six interactive Quiz authoring checkboxes now use the signed-off shared `Checkbox` control. Existing shuffle, show-answer-key, invalid-only, correct-option and publish-now labels, state transitions and permissions remain identical. Each checkbox gains a 44px label touch target and visible focus outline. Disabled answer previews remain native and noninteractive.

Test `UX-teacher-courses-deliveryId-quizzes-manage-10`: `tests/unit/UX-teacher-quiz-builder-selection-controls.test.ts`. CI/browser evidence pending.
