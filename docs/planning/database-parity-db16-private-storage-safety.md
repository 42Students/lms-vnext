# DB-016 — private document, identity and storage schema safety

**State:** SOURCE RECONCILIATION / STAGED HARDENING — runtime unverified  
**Worker:** Chat 1 · **Global phase:** DATABASE  
**Date:** 2026-10-11  
**Legacy backend oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Legacy frontend oracle:** `42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`

DB-016 is cross-domain. It does not declare a domain database complete and it does not authorize a migration by itself. The goal is to prevent private files, identity secrets, object URLs and retention/revocation state from becoming inconsistent merely because each feature invented a different persistence shape.

## Current main drift correction — 31 October 2026

The previous GCS-specific assertions and the expectation that DB04 profile
verification was not in the schema barrel no longer matched `main`. The
current application uses **private Cloudflare R2** with an exact
`private/{collegeId}/{ownerMembershipId}/{namespace}/{objectId}` key,
one-to-fifteen-minute signed grants, scope validation, token-hash and
CLEAN-scan attestation. DB04 profile-verification tables are already
barrel-exported/registered; DB06 assignment upload receipts and the DB16
revocation/retention overlay remain separate staged work.

Neither source visibility nor a storage adapter guarantees a deployed bucket
is private, encryption/lifecycle policies are correctly configured or an
independent scanner actually ran. Those runtime/security gates remain OPEN.
This reconciliation cannot be used as production privacy sign-off.

## Safety baseline

A persisted private-object reference is not sufficient merely because it points at a bucket key. Before a private file can become effective evidence or an application attachment, the owning domain must be able to prove:

1. explicit owner/scope and purpose/target binding;
2. a non-public canonical object key, never a signed/public URL as identity;
3. immutable object generation/version;
4. actual MIME type and size;
5. cryptographic digest;
6. privileged malware-scan attestation;
7. upload-grant replay resistance where browser uploads are used;
8. created/uploaded actor and time;
9. explicit revocation state with actor/time/reason;
10. explicit retention/deletion policy;
11. authorization before every signed read;
12. immutable or append-only access/security audit evidence where policy requires it;
13. storage configuration evidence for public-access prevention and encryption policy.

A domain may intentionally expose an ordinary HTTP(S) link. That is an external-link product type, not a private-object receipt, and must not be misrepresented as protected private storage.

## Current source matrix

| Surface | Current source state | Strong controls present | Missing / decision before promotion | Disposition |
| --- | --- | --- | --- | --- |
| Shared R2 private-object adapter | Runtime code exists in `src/modules/storage/private-object-storage.ts` | tenant/member exact five-segment key; short-lived PUT/GET; upload-token hash; object generation; actual size/MIME; SHA-256; CLEAN privileged-scanner metadata; fail-closed scope/key verification | no source proof of R2 bucket privacy, lifecycle/retention/versioning or approved encryption-key policy; no durable cross-domain receipt/audit table | **GOOD BASE, INFRA EVIDENCE BLOCKED** |
| Learner raw Aadhaar/PAN | Current learner profile service/repository | two independent write guards reject raw Aadhaar/PAN with `PRIVATE_IDENTITY_STORAGE_NOT_READY`; verification snapshots require masked identity | encrypted/private identity-vault design and key lifecycle not provisioned | **FAIL-CLOSED — KEEP UNAVAILABLE** |
| Faculty identity | Structured staged Faculty document | raw Aadhaar/PAN forbidden; masked summary + receipt UUIDs only | receipt schema + Faculty profile columns are not registered; KMS/private-vault path still blocked | **STAGED / FAIL-CLOSED** |
| Profile verification documents | registered `src/db/schema/profile-verification.ts` (barrel-exported) plus separate DB16 source overlay | owner, purpose, related target, generation, digest, MIME/size, scan status, revocation time, retention time; service reattests object and scanner | add explicit revocation actor/reason and durable scan attester/time; DB04 base is registered; DB16 revocation/attester overlay remains unregistered, and actual R2 bucket/scanner proof is absent | **REGISTERED BASE; OVERLAY STAGED** |
| DB04 proposed SQL | candidate-only | normalized verification/history/receipts and receipt-backed education/images | file was source-corrupted; repaired in DB-016; still unregistered and unexecuted | **REPAIRED SOURCE INPUT** |
| Assignment submission files | staged `course-upload-receipts-staged.ts`, runtime-gated | owner/college/purpose/target; token hash; generation/actual MIME/size/SHA; consumed submission; shared GCS attestation | `revoked boolean` has no actor/time/reason; no retention field; scanner result/attester not durably captured; DB053 source-only hardening exists; schema, scanner+provider and runtime cutover not registered | **STAGED — PRIVACY GATED** |
| Course resource uploads | purpose exists in staged course receipt model | same base receipt machinery can support private course resources | final material binding and lifecycle/retention still staged; do not treat a presigned URL as persistent identity | **STAGED** |
| Project resources | live schema stores optional HTTP(S) `url` and description | validation makes this explicitly an HTTP(S) external-link surface | shared adapter exposes a `project-resource` namespace but no receipt-backed project file relation is active. Decide external-link-only vs private-file product type before using upload storage | **EXTERNAL LINK ONLY TODAY** |
| Project task/final submission URLs | current project schema/service stores HTTP(S) submission/source/demo URLs | explicitly validated external URLs | these are not private uploads; if private artifacts are added, use a separate receipt-backed file relation rather than overloading URL columns | **EXTERNAL LINK ONLY TODAY** |
| Bug tracker screenshots | DB10 schema/service are draft/gated | private intent, size/MIME/count checks, key not returned from admin reads | draft attachment has only key/name/MIME/size: no immutable generation, digest, scan, revocation, retention; current `bug-tracker/<issue>/...` owner model is not compatible with membership-scoped private adapter | **STAGED — NEED ISSUE/REPORTER PRIVATE OWNER CONTRACT** |
| Placement academic evidence / offers | live normalized numeric/verification + structured offer lifecycle fields | academic source/verifier metadata; offer status/CTC/joining lifecycle; no private evidence or offer-letter object key in the reviewed live tables | document evidence such as resume/offer-letter must not be inferred from numeric or offer rows. DB04's staged receipt-purpose names do not create an active placement document relation | **DATA ONLY; DOC CONTRACT SEPARATE** |
| Learner profile JSON | live `learner_profiles.profile_document` | validated structured JSON; raw Aadhaar/PAN blocked | contains ordinary PII such as address/DOB/contact data at application level. Database/storage encryption and retention policy must be explicitly documented; do not add national-ID secrets to this JSON | **LIVE PII, SECRET-ID FAIL-CLOSED** |

## Source-confirmed privacy decisions

### Raw government identity secrets remain unavailable

Current learner self-profile persistence parses the legacy-shaped identity fields only to preserve input compatibility, then rejects non-empty Aadhaar/PAN before persistence. The repository repeats the guard. This deliberate fail-closed behavior is safer than placing national ID values into `learner_profiles.profile_document`.

Verification event/snapshot code separately rejects unmasked identity values and public/object URLs. Faculty staged profile state likewise stores only masked identity summary plus receipt IDs.

**Do not remove these guards merely to achieve legacy storage parity.** An encrypted identity-vault/KMS design, key rotation, privileged access logging, retention and deletion policy must be approved first.

### Project URL fields are external links, not private storage

Current project validation restricts project resources, task submission URLs and final source/demo URLs to HTTP(S). They are therefore external references. The presence of a dormant `project-resource` namespace in the shared private storage adapter does not convert those columns into secure private-object identity.

If Project later accepts file uploads, add a receipt-backed file relation with project/member/college binding and audit history. Do not put signed GCS URLs into `project_resources.url` or submission URL columns.

### Bug reporter ownership needs its own private scope

Bug reports may originate from a reporter-access identity rather than a college membership. Forcing bug screenshots into the current `private/<college>/<membership>/...` shape would invent fake membership ownership.

Before DB10 promotion, define a private issue/report-owner key namespace and persist the same generation/hash/scan/revocation/retention guarantees as membership-owned objects. The parent issue/report owner must be the authorization anchor, and signed reads must remain server-authorized.

### Placement object-path exception

The reviewed placement schema has one `placement_companies.logo_object_path`. This is company branding metadata, not candidate identity/evidence. It should be treated as a public/brand asset contract (with its own upload/type/cache policy) rather than forced into the private evidence receipt model. Candidate academic evidence and offers currently contain structured data only; there is no active resume/offer-letter private-object FK in those rows.

## Cross-domain minimum receipt contract

The migration integrator should treat the following as the minimum conceptual contract, even when individual domains keep separate physical tables:

- `id`
- explicit scope owner (membership, issue/report owner, or other approved owner class)
- `purpose`
- explicit target relation where applicable
- `object_key`
- `object_generation`
- `sha256_hex`
- actual `mime_type`
- actual `size_bytes`
- `scan_status`
- `scan_attested_by`
- `scan_attested_at`
- upload-token hash / grant expiry when browser PUT is used
- `created_by_*` / `uploaded_by_*`
- `created_at` / `uploaded_at`
- `revoked_at`, `revoked_by_*`, `revocation_reason`
- `retention_until` or an explicit domain retention class/policy
- deletion/tombstone evidence if physical object deletion is asynchronous
- immutable generation+key uniqueness

For consumed receipts, ownership/purpose/object identity must become immutable. Revocation/retention/deletion metadata may evolve only through explicit state transitions; changing the object key or generation in-place is not an update path.

## Staged lifecycle overlay

`docs/planning/sql/db16-private-object-receipt-overlay-candidate.sql` is the migration-integrator overlay for existing **staged** DB04/DB06 receipt models. It adds scan attester/time, auditable revocation, retention/deletion state and object-identity immutability. It deliberately does not register a migration and does not create bug/project file tables.

## Storage configuration gate

Source code currently proves only that the shared private bucket refuses operation unless:

- Uniform Bucket-Level Access is enabled; and
- Public Access Prevention is enforced.

DB-016 does **not** have execution evidence for the actual bucket, scanner principal, lifecycle rules, versioning, retention policy, or encryption-key configuration. Those are RELEASE/database-security gate items, not assumptions.

If the product requires CMEK rather than provider-managed at-rest encryption, the expected KMS key identity and rotation/access policy must be a fail-closed runtime configuration check. Until that decision is explicit, do not mark “encryption controls verified.”

## Required negative/runtime witnesses

Before DB-016 can be `DONE_VERIFIED`:

- raw Aadhaar/PAN cannot reach generic profile JSON or verification event JSON;
- cross-college/member receipt attachment fails;
- wrong-purpose and wrong-related-target receipt use fails;
- non-CLEAN, revoked, expired, wrong-generation, wrong-size, wrong-MIME and wrong-hash objects fail;
- consumed receipt object identity cannot be mutated;
- revocation records actor/time/reason and immediately blocks new reads/use;
- retention/deletion transitions cannot silently erase required audit evidence;
- assignment receipt can only bind to the exact owner/assignment/submission;
- bug screenshot can only bind to the exact issue/report owner and is never publicly addressable;
- external project URLs remain ordinary links and cannot masquerade as private object keys;
- private signed reads are short-lived and authorization-scoped;
- private R2 bucket/public-access policy + scanner + approved encryption/lifecycle configuration are witnessed against real infrastructure;
- clean migration replay and schema/snapshot drift checks pass.

## Current blockers

1. DB-001 still prevents disposable PostgreSQL/runtime verification.
2. DB04 and DB06 receipt schemas are staged and not in the schema barrel/journal.
3. DB10 bug tracker is still a draft/gated domain.
4. actual private R2 bucket/scanner/encryption/lifecycle configuration has not been executed in this worker.
5. government-ID secret storage remains intentionally unavailable until an encrypted vault policy exists.

Source work may be marked complete when every current private-file/identity surface has a disposition, but none of these blockers may be converted into a green runtime claim.
