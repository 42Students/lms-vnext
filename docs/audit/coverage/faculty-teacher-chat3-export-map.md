# Faculty source export inventory — chat-3

GitHub source declaration review, October 19, 2026. **This is a symbol map, not behavioral or passing test evidence.** It complements `faculty-teacher-chat3-inventory.md` and `chat3-faculty-teacher-ledger.md`. No CI, TypeScript, PostgreSQL or UI tests were executed.

**Target:** 114 `src/modules/courses/faculty-*.ts` files; other attendance, shared course, UI and API files are tracked separately.

| Source file | Named runtime exports | Type/interface exports | LOC | Evidence status |
|---|---|---|---:|---|
| `src/modules/courses/faculty-assessment-batch-model.ts` | `facultyAssessmentVisibleToDelivery`, `nextFacultyLessonContentSequence` | — | 24 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-assessment-editor-model.ts` | `facultyAssessmentLimitEditable`, `facultyAssessmentLimitPatch`, `facultyAssessmentCanArchive`, `facultyAssessmentEditReceiptMatches`, `facultyAssessmentArchiveReceiptMatches` | — | 38 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-assessment-filter.ts` | `filterFacultyAssessments` | `FacultyAssessmentFilterQuery` | 34 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-assessment-report-service.ts` | `facultyReportCurrentRosterRows`, `buildScoreDistribution`, `latestQuizAttemptsByLearner`, `questionAccuracy`, `assignmentScoreSummary`, `scoreSummary`, `getFacultyQuizReport`, `getFacultyAssignmentReport` | `ScoreDistributionBucket` | 362 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-assessment-route-boundary.ts` | `parseFacultyAssessmentReportRoute`, `facultyAssignmentReportHidden`, `facultyQuizReportHidden` | — | 24 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-assessment-service.ts` | `getFacultyAssessmentOverview` | — | 159 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-assignment-authoring-model.ts` | `facultyAssignmentParamsSchema`, `facultyAssignmentCommandSchema`, `assignmentFieldsChanged`, `facultyAssignmentMethodsChanged`, `facultyAssignmentVersionMatches`, `facultyAssignmentLegacyEdit`, `facultyAssignmentEditLockedBySubmissions` | `FacultyAssignmentCommand` | 88 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-assignment-authoring-service.ts` | `commandFacultyAssignment`, `getFacultyAssignmentMethods` | — | 167 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-assignment-editor-ui-model.ts` | `facultyAssignmentDraftDirty`, `facultyAssignmentDraftIssue`, `facultyAssignmentCommandReceipt`, `facultyAssignmentMaySubmit`, `facultyAssignmentConfirmationOnEdit`, `facultyAssignmentSwitchNeedsConfirmation`, `facultyAssignmentArchiveWarning`, `facultyAssignmentPublishIssue`, `facultyAssignmentCommandError`, `facultyAssignmentCanSaveDraft` | `FacultyAssignmentAction` | 100 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-assignment-grading-policy.ts` | `facultyAssignmentGradingAllowed`, `facultyAssignmentGradePublicationAllowed` | — | 8 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-assignment-method-load-model.ts` | `verifiedFacultyAssignmentMethodsResponse`, `facultyAssignmentMethodsLoadVersion` | — | 24 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-assignment-methods-query.ts` | `parseFacultyAssignmentMethodsQuery` | — | 17 | Declared; behavioral verification pending |
