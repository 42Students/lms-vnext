# DB04 historic education/image and tenant bootstrap compatibility (lane-14)

No live DB04 schema activation or import has occurred. `db04-profile-education-images.staged.ts` remains explicitly staged and not exported from `src/db/schema/index.ts`; SQL 0222 **must not be journal-registered** until the learner-education/image parent tables and receipt FK are created and reviewed in dependency order.

- Source `qualification.id` is retained as nullable `legacyQualificationId` under the owning membership (use scoped `legacy_id_map`); original `startYear/endYear` strings remain separate from validated integer years, and `isDeleted` has separate nullable provenance.
- The legacy degree/field/score/description and `certificateUpload` are source values; `legacyCertificateUpload` is **not** a grant, link or renderable file. Only CLEAN, owner/purpose-matched private document receipts can authorize signed reads. Existing composite education-document FK and profile-image receipt FK intentionally remain intact.
- Source `student_image` numeric ID/URL/deletion are import-only snapshots; `receiptId` is still the only intended runtime storage reference. A legacy URL cannot be activated or exposed without receipt/ownership/scanning verification.
- The partial unique recent-education index enforces **at most one**, not the legacy **exactly one** per nonempty application qualification set. Exact-one belongs to the transactional profile/application service; an optional empty profile must remain valid. The legacy `currentlyPursuing` end-year flexibility and vNext stricter rule require explicit UX/import review.
- Photo API exact validation and response copy is service-owned: `Image URL cannot be empty`, `imageUrls cannot contain empty values`, `Image URL is not from allowed storage`, `Image must be uploaded under your profile-images folder`, `Image deactivated successfully.`. Do not echo private object keys or raw cloud links in error bodies.
- All nonimage source read/write parity, old qualification upload references and new receipt verification must be resolved before switching active JSON profiles to normalized DB04 tables.

## Public tenant resolver contract

- Existing `resolveRequestTenant` remains server-only and backward compatible: platform / college / unknown / unavailable; college fields remain UUID identities, not old numeric IDs.
- A college result may additionally expose optional `canonicalHost` and `shouldRedirectToCanonicalHost` only when the host is independently verified and repository reports an exact tenant-matching **verified PRIMARY** domain. No guessed `www`, unverified aliases or X-Forwarded-Host are accepted.
- `normalizeRequestHost` canonicalizes the trusted Host before cache keying; malformed, schemed, comma-delimited or spoofed hosts fail closed as unknown, while database lookup failures remain unavailable (no permanent negative cache).
- The resolver does not do browser redirects or accept path/search/hash; the eventual UI/HTTP layer must preserve them and avoid loops. A public versioned `GET /api/v1/public/tenant-bootstrap` adapter, old `tenantKey`, loginMethods/branding and canonical-navigation behavior require a separately reviewed, authenticated-source public response contract. Do not fabricate tenantKey from a UUID or hostname.
- Legacy dedicated JNTU/DGIPUC landing-page variants remain explicit product/UX decisions, not special-case tenant auth. No code or CI executed.
