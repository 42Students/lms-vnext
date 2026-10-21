# Work packet: edit src/modules/people/membership-protection.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/admin-user-lifecycle-controller.md

## G2-1-001-017  [P2] GAP  facet F07  effort S
- Legacy: `ProtectedFacultyRoles.java:50-54` says `Only a super admin can manage ADMIN/TPO accounts` in forbidden exception.
- vNext now: `membership-protection.ts:16-23` throws `MEMBERSHIP_PROTECTED`; `person-membership-actions.tsx:156-164` displays `The membership state could not be changed.`
- Fix: Translate protected-account code into explicit role and actor remediation instead of generic failure.
