# CI unit-test packet (round 10)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat15-missed-quiz-release.test.ts (1 failing)
- chat-15 learner missed quiz, release, and progress parity > LEARNER-learning-misc-27 releasing results requires the authored deadline to pass

  ```
  AssertionError: expected 'import { shuffleQuizForLearner } from…' to contain 'dueIsPast &&'
  - Expected
  + Received
  - dueIsPast &&
  + import { shuffleQuizForLearner } from "./learner-quiz-shuffle-model";
  + import {learnerQuizResultsReleased} from "./learner-quiz-result-release-policy";
  + import { commandFacultyQuiz } from "./faculty-quiz-authoring-service";
  + import { facultyQuizLegacyEdit } from "./faculty-quiz-authoring-model";
  ```
