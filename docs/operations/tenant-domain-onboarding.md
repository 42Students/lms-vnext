# College domain onboarding

How a college gets its own address for vNext. Routing (ingress + TLS) and
tenancy (the `tenant_domains` row) are separate; both are required.

| Layer | What it does | Who/what owns it |
| --- | --- | --- |
| DNS | name -> load balancer IP | Cloudflare zone for `42lms.com` (or the college's DNS) |
| TLS | certificate for the name | wildcard cert (dev subdomains) or a per-domain cert |
| Ingress | routes the host to the vNext service | `scripts/ops/add-college-host.sh` |
| Tenancy | host -> college, verified | Domains page / `POST /api/tenant-domains` + verify |

A host that is routed but not registered, or registered but not routed,
does not work. An unknown host fails closed in the app.

## A. Dev test colleges under `*.development.42lms.com`

DNS (wildcard record) and TLS (wildcard certificate) already cover any host
exactly one level below `development.42lms.com`.

1. Route it (dry run first; refuses prod namespaces and multi-level hosts):

   ```bash
   scripts/ops/add-college-host.sh testc.development.42lms.com
   APPLY=1 scripts/ops/add-college-host.sh testc.development.42lms.com
   ```

2. Register it for the college. As College/Super Admin use the Domains page
   (or `POST /api/tenant-domains`), then verify. Verification reads a DNS TXT
   record at `_lms-vnext.<host>` with value `lms-vnext-verification=<token>`;
   that zone is Cloudflare, so the TXT record must be added there. For the
   fictitious test colleges, `scripts/seed-test-tenants.ts` marks the host
   verified directly (dev only).

Undo: `kubectl apply -f <backup file the script printed>`.

## B. A real college's own domain (e.g. `lms.somecollege.edu`)

1. The college (or you) adds `CNAME`/`A` to the load balancer address and the
   TXT verification record above. Nothing routes until this resolves.
2. TLS. Current mechanism is one Google-managed certificate per domain,
   attached through the ingress `pre-shared-cert` annotation:

   ```bash
   gcloud compute ssl-certificates create <name> --domains=<host> --global
   ```

   **Hard limit:** a Google load balancer takes at most **15 certificates**.
   Development already holds 10 and production 4, so this approach tops out
   at roughly 5-10 custom domains per environment.
3. Route it with `ALLOW_CUSTOM_DOMAIN=1 APPLY=1 scripts/ops/add-college-host.sh <host>`
   once the certificate is ACTIVE.
4. Register and verify the host in the app (Domains page).

### Scaling past the certificate cap (decision needed before ~8 colleges)

- **Cloudflare for SaaS (custom hostnames):** college domains point at a
  Cloudflare hostname; Cloudflare issues and renews certificates, no per-
  domain Google certificate. The DNS zone is already on Cloudflare. This is
  the most natural fit.
- **Google Certificate Manager with certificate maps:** removes the 15-cert
  limit within Google, but needs DNS authorizations per domain.
- A **wildcard under a vNext-owned domain** (`<college>.<vnext domain>`) needs
  no per-college certificate at all; colleges keep only that name.

## Known limits

- Any `*.development.42lms.com` host with no exact rule falls through to the
  legacy dev app (the old wildcard rule), so an unrouted vNext host shows the
  old LMS, not an error.
- Production ingress is intentionally not touched by this script.
