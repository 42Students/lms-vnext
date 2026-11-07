# SEC-17 cloud, network and infrastructure: assessment from the dev cluster (2026-11-08)

Method: read-only `kubectl` on namespace `lms-dev-2026` and the deployment manifest. No GCP console or `gcloud` calls (the owner's GCP settings are not read here). Nothing VERIFIED; production is a different namespace and is not covered.

| Area | Finding | Proposed state |
|---|---|---|
| Container hardening | vNext pod: non-root (uid 1001), `RuntimeDefault` seccomp, `allowPrivilegeEscalation: false`, read-only root filesystem with `emptyDir` for `/tmp` and the Next cache, all capabilities dropped, CPU and memory limits, service-account token not mounted (`automountServiceAccountToken: false`) | IMPLEMENTED_UNVERIFIED |
| Network ingress | NetworkPolicy `lms-vnext-ingress-from-lb-only` selects `app=lms-vnext` | IMPLEMENTED_UNVERIFIED |
| Network egress | No egress policy exists: the pod can reach any address (provider APIs, the internet, other namespaces) | GAP: allow only DNS, Cloud SQL (10.180.16.3:5432), the providers' hosts |
| Namespace sharing | The dev namespace also runs the legacy backend and frontend and `ai-lab` pods, with the same `default` service account; vNext jobs and the legacy app share a flat network apart from the ingress policy | PARTIAL: dedicated namespace and policy for vNext would isolate it |
| RBAC | No RoleBindings in the namespace; workloads use `default` and cannot read the API (token not mounted for vNext). Cluster-level RBAC and who holds `kubectl` access are not read here | PARTIAL |
| Secrets | Kubernetes Secrets (`vnext-db`, `vnext-db-migrator`, `vnext-auth`, `vnext-keys`, `vnext-integrations`); encryption at rest is GKE's default (Google-managed keys), not customer-managed | PARTIAL |
| Database path | Cloud SQL private IP only; two logins (runtime, migrator) with the privileges described in SEC-07; TLS not enforced by the instance | PARTIAL (SSL enforcement is owner item 4) |
| Ingress and TLS | Google HTTP(S) load balancer with 10 pre-shared certificates; HSTS header set by the app; HTTP to HTTPS redirect not read | PARTIAL |
| Public exposure | `/api/internal/*` and webhook routes reachable from the internet behind secrets (owner item 11); `/e2e/*` blocked in production builds | PARTIAL |
| Image supply chain | Images built on GitHub Actions, pushed with `crane` to Artifact Registry by sha tag, deployed by explicit run id; no image signing, no vulnerability scan gate, tags (not digests) in the manifest | GAP: pin by digest, scan in CI |
| Cluster access | The API accepts only approved IPs (master authorized networks); the developer machine IP was added on 2026-10-13 and should be removed when work ends | PARTIAL (owner: review the list) |
| Cost guardrail | No paid resource is created by this program; image storage in Artifact Registry grows by roughly one image pair per deploy (about 20 deploys today) | note |

Safe next steps without the owner: an egress NetworkPolicy for the vNext pod tested on dev (can break provider calls, so staged), digest pinning in the manifest, an image scan step in CI. I have not applied the egress policy: a wrong rule silently breaks database access; it deserves a staged rollout with the owner watching.
