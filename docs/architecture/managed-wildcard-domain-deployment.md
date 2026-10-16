# Managed college subdomain — manual deployment acceptance
Gap: **SA-tenants-modules-20**. Owner decision: wildcard-domain acceptance is a **manual deployment step**, not a reason to block source commits.

## Operator prerequisites (never handled by a chat code push)
1. Provision a wildcard DNS record for `*.TENANT_MANAGED_BASE_DOMAIN` pointing to the same ingress as the platform application.
2. Provision valid TLS for the wildcard and its chain. Configure the ingress to route these hosts without treating them as the platform host.
3. Set `TENANT_MANAGED_BASE_DOMAIN` to the registered platform-owned base domain. Set `TENANT_MANAGED_WILDCARD_READY=true` **only after** wildcard DNS and HTTPS are operational.
4. Verify that the base domain belongs to the platform, that reserved-label validation cannot allot platform, auth, www, admin or other reserved hosts, and that two colleges cannot claim one host.
5. In Super Admin → Colleges → the selected college → Web address, use **Allot**; check the shown host resolves over HTTPS, login branding is for the same college, and a different college's cookie cannot grant access on that host.
6. Exercise **Change** (old host ceases to resolve to the college, new host works), **Remove** (host is no longer routed to that college), taken-name collision, and unknown-host fail-closed behavior.
7. Verify the platform host remains usable throughout; keep the readiness flag disabled if any check fails. Record hostname, TLS issuer/expiry, operator, acceptance time, and rollback owner in the deployment runbook.

## Operational boundaries
- This work does **not** provision DNS/TLS or modify live infrastructure.
- `src/modules/tenant-domains/managed-subdomain-service.ts` stores a verified managed address only when the wildcard readiness flag is enabled and checks Super Admin central permissions.
- `src/modules/auth/request-tenant.ts` and `src/modules/auth/tenant-access.ts` enforce host-to-college routing and membership isolation.
- No one-click allotment may bypass these fail-closed checks. Source-complete and deployment-verified are separate statuses.
