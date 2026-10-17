# Graceful-operation verification — chat-11 learner and public surfaces

The items below have source implementations and **written but unrun tests**.
Core hook adoption (GR-30/31/60), widget boundaries (GR-70), offline and maintenance UX await chat-14's helpers and chat-15 browser tests; do not mark them closed prematurely.

| ID | Status | Evidence |
|---|---|---|
| GR-90 | DONE | src/components/auth/login-form.tsx; tests/unit/public-auth-chooser-graceful-gap.test.ts — `it("GR-90 alerts auth failures and focuses the error summary or invalid input")` |
| GR-91 | DONE | src/components/public/error-recovery-actions.tsx; src/app/(authenticated)/learn/projects/error.tsx; tests/unit/public-auth-chooser-graceful-gap.test.ts — `it("GR-91 retry and recovery buttons are keyboard-accessible")` |
| GR-71 | DONE | src/app/(authenticated)/learn/projects/loading.tsx; src/app/(authenticated)/learn/projects/error.tsx; src/modules/projects/learner-project-list-empty-model.ts; tests/unit/public-auth-chooser-graceful-gap.test.ts — `it("GR-71 learner project lists distinguish loading, empty, filtered empty and failure")` |
| GR-73 | DONE | src/app/(authenticated)/learn/projects/error.tsx; src/components/projects/project-participant-list-controls.tsx; tests/unit/public-auth-chooser-graceful-gap.test.ts — `it("GR-73 failed-list retry retains the same route and query filters")` |
