# SUPER_ADMIN bootstrap and recovery

This runbook defines the only bootstrap path for the first vNext SUPER_ADMIN.

## Security model

Bootstrap is an **operator-only CLI action**. There is deliberately no public API route that can create or self-assign a system role.

Normal application authorization treats SUPER_ADMIN as a global system role. A SUPER_ADMIN who has selected an organization/college safety scope cannot perform global system-role administration until that scope is cleared.

## Prerequisites

- a configured Identity Platform/Firebase Admin project
- Application Default Credentials, or `GOOGLE_APPLICATION_CREDENTIALS` locally
- `DATABASE_URL` pointing at the intended vNext database
- schema migrations applied
- dependencies installed

## Bootstrap command

```bash
npm run bootstrap:superadmin -- --phone="+919876543210" --display-name="Platform Admin" --email="admin@example.com"
```

`--email` is optional. Phone is required and normalized/validated as E.164.

The command:

1. resolves the Identity Platform identity by phone/email
2. creates the Identity Platform identity when absent
3. refuses ambiguous phone/email identity collisions
4. creates or reuses the canonical vNext `users` row
5. refuses a conflicting or disabled vNext user
6. assigns `SUPER_ADMIN` idempotently in `system_roles`
7. prints only the vNext user ID and Identity Platform UID

Rerunning the same command is safe.

## Recovery

If bootstrap fails because of an identity collision, do not delete or merge records blindly.

1. inspect the Identity Platform users owning the supplied phone/email
2. inspect the vNext `users` rows owning the Identity UID, phone and email
3. determine which identity represents the real person
4. correct the conflicting source data deliberately
5. rerun the same bootstrap command

If the vNext user is `DISABLED`, bootstrap refuses to reactivate it automatically. Reactivation must be a separate deliberate administrative/recovery action.

If the first SUPER_ADMIN identity is lost, use privileged operator access to the database/Identity Platform to establish a verified replacement identity, then rerun this CLI for that verified identity. Never add a temporary public bootstrap endpoint.

## Subsequent SUPER_ADMIN assignment

The domain service for system-role assignment requires the centralized `system-role.manage` permission. Only an active, **unscoped** SUPER_ADMIN has that permission. College membership roles, including COLLEGE_ADMIN, can never assign system roles.

A public API for this is intentionally not part of the bootstrap phase. If an admin UI/action is added later, it must call the same centralized policy and should gain activity/audit events before production use.
