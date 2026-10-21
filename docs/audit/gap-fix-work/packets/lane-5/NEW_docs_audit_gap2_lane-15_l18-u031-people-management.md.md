# Work packet: NEW / MISSING items from docs/audit/gap2/lane-15/l18-u031-people-management.md

1 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-15/l18-u031-people-management.md

## G2-18-031-054  [P1] GAP  facet F12  effort M
- Legacy: Legacy suspension sets suspendedAt/reason and revokes sessions/token version, reactivation clears state; AdminUserLifecycleController.java:83-167,178-198
- vNext now: vNext SUSPENDED/ACTIVE/ENDED on membership and on suspend/end revokes user-wide device sessions; repository.ts:782-848
- Fix: Document cross-college device-session revocation vs membership-only access and exact reactivation semantics
