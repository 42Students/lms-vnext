# Faculty UX refinement round 6 — five routes

- `/teacher/report/assignment/[contentId]/submissions`: 1 native fields use 16px mobile typography; 1 undersized links expanded to 44px; 10 deep-teal focus outlines added.
- `/teacher/report/quiz/[quizId]/attempts`: 1 native fields use 16px mobile typography; 1 undersized links expanded to 44px; 10 deep-teal focus outlines added.
- `/teacher/response-followups`: 5 native fields use 16px mobile typography; 1 undersized links expanded to 44px; 13 deep-teal focus outlines added.
- `/teacher/results`: 7 native fields use 16px mobile typography; 2 undersized links expanded to 44px; 16 deep-teal focus outlines added.
- `/teach/courses/[deliveryId]`: 0 native fields use 16px mobile typography; 1 undersized links expanded to 44px; 4 deep-teal focus outlines added.

No field values, validation logic, tenant scopes, paging, filters, link destinations or legacy wording changed. Test: `tests/unit/UX-teacher-native-controls-round6.test.ts`, five `UX-*-02` cases. CI, 320/360/390 browser verification and assistive-technology evidence pending.
