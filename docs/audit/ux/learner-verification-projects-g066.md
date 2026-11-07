# UX-G066 — Learner verification, projects and quizzes

The verification load error now links back to the learner's profile, project-list load errors have an explicit learner-home exit, and the project detail tab-specific skeleton now inherits the shared 12-second slow-load recovery option. Existing private verification disclosures, project-scope read, board controls, explicit not-found behavior, and quiz alias remain unchanged.

Acceptance: `tests/ux-cross-role-g043-g066-g095.test.mjs` tests the exact inventory and important privacy/routing contract; desktop/mobile preview of the route's real error/loading components in `tests/e2e/ux-cross-role-g043-g066-g095.spec.ts`. [Executed CI](https://github.com/42Students/lms-vnext/actions/runs/42397390851) passed 4/4 grouped source tests, scoped lint and 6/6 grouped browser cases. [Screenshots](https://github.com/42Students/lms-vnext/actions/runs/42397390851/artifacts/13583464464) include learner desktop/mobile. The separate global TypeScript step failed in two unowned HR loading files. **Privileged data reads and mutations are not simulated by the preview**.

Regression/security review: no changed session, identity, role, tenant, project permission, private receipt, or quiz logic. Route failures are never presented as verification rejection or an empty project list.
