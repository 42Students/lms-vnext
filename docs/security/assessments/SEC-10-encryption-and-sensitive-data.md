# SEC-10 encryption and sensitive data protection: assessment (2026-11-08)

Method: code read, dev probes, project memory of provider settings. Nothing VERIFIED.

| Control | Finding | Proposed state |
|---|---|---|
| 001 TLS for external traffic | HTTPS terminates at the Google load balancer (10 managed or pre-shared certificates); the app sends `Strict-Transport-Security: max-age=31536000` (no `includeSubDomains` or preload, owner item 10). HTTP to HTTPS redirect not read | IMPLEMENTED_UNVERIFIED |
| 002 TLS to the database | Cloud SQL private IP; the instance does not require SSL and the client does not verify the certificate | GAP (owner item 4) |
| 003 encryption at rest | Cloud SQL, Artifact Registry, Kubernetes Secrets (GKE) and Cloudflare R2 encrypt at rest with provider-managed keys; backups inherit the instance's encryption. Customer-managed keys are not used | IMPLEMENTED_UNVERIFIED (provider default) |
| 004 field-level encryption | Outbound email and SMS payloads are sealed with AES-256-GCM (`DB10_OUTBOUND_ENCRYPTION_KEY_BASE64`, `outbound-delivery-envelope.ts`); mentor Google Calendar connection tokens are encrypted before storage. Contact details, marks and resumes are stored as plain columns; login codes and session credentials are stored only as HMAC digests | PARTIAL |
| 005 classification | `data-inventory.md` lists 96 tables with personal or sensitive columns by class; no written sensitivity levels per class | PARTIAL |
| 006, 007 minimisation, minimal API fields | Not measured. API responses are built per route; some return whole rows (to be sampled) | UNASSESSED |
| 008 data handling rules per role | The role matrix baseline (`role-matrix-baseline.json`) shows what each role can read; no written handling rules | PARTIAL |
| 009 no sensitive data in errors | Unhandled errors answer `{"error":"INTERNAL_ERROR","message":"Something went wrong on our side."}` with a request id; database errors are logged server-side, never returned (checked on dev with several 500s) | IMPLEMENTED_UNVERIFIED |
| 010, 011 analytics and pseudonymisation | Log alerts hash account ids with `LOG_ALERT_ACCOUNT_HASH_KEY`; logs carry user ids and one-way IP tags, not contacts or codes; no analytics warehouse exists | IMPLEMENTED_UNVERIFIED |
| 012 elevated authorization for bulk exports | Exports and imports require step-up (a login within 15 minutes) through `route({ stepUp })` (owner decision 2026-11-06); each export is written to the audit trail as `api.export`; the anomaly tripwire flags ten exports by one user in ten minutes | IMPLEMENTED_UNVERIFIED |
| 013 sensitive data in browser state | The session cookie is HttpOnly; no token in `localStorage` was found in the bundle scan; client state not otherwise reviewed | PARTIAL |
| 014 caching | Pages `private, no-cache, no-store`, APIs `private, no-store` (evidence file) | IMPLEMENTED_UNVERIFIED |
| 015 key loss and rotation | Not tested; no key versioning for the outbound key (rotation strands sealed payloads), the registry has no rotation dates | GAP |
| 016 no real student data in dev or test | Dev holds the NSRIT college (154 memberships) loaded on 2026-10-17 from the legacy LMS dev database, plus fictitious seed colleges. Whether those people are real students is not known from the repository | OWNER (item added to OWNER-ACTIONS.md) |
