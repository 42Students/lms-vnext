# Work packet (wave 3): edit src/modules/people/membership-domain.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l18-u031-people-management.md

## G2-18-031-085  [P1] MISSING  facet F23  effort L
- Legacy: Legacy destructive DELETE student/faculty, bulk-import undo, admin impersonation and OTP lockout control visible; Students.js:990-1085;Faculty.js:837-935;SuperAdminUserAdminController.java:266-385
- vNext now: vNext no verified exact hard-delete or bulk-undo in scoped people pages; lifecycle END and profile entry delete not account delete; membership-domain.ts:75-89;learner-profile-delete-confirm-model.ts:1-7
- Fix: Decide each intentionally removed admin action, add safe service or documented replacement and conspicuous UI explanation
