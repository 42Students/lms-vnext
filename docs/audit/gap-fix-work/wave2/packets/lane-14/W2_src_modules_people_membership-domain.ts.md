# Work packet (wave 2): edit src/modules/people/membership-domain.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/admin-user-lifecycle-controller.md

## G2-1-001-029  [P2] GAP  facet F12  effort M
- Legacy: `AdminUserLifecycleController.java:97-98,129-130` always resets suspension timestamp on repeated suspend; reactivate nulls both (`:149-150,163-164`).
- vNext now: `membership-domain.ts:42-54` retains first suspendedAt on repeated suspension and returns no patch when same reason; `:56-73` clears both on reactivation.
- Fix: Record intentional timestamp semantics and standardize whether resuspend changes suspended_at; reflect in audit expectations.

## G2-1-001-042  [P2] GAP  facet F20  effort M
- Legacy: `AdminUserLifecycleController.java:97-102,129-134` accepts repeated PUT suspend without precondition; repeated call changes timestamp and logs anew.
- vNext now: `membership-domain.ts:42-48` treats equal-reason repeat as no-op; `repository.ts:815-823` skips audit on null patch.
- Fix: Specify expected idempotency/audit treatment for retries; ensure UI communicates no-op distinctly if needed.
