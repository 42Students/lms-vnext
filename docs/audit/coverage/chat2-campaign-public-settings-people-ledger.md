# chat-2 TPO campaigns, public links and settings people service ledger

Status: **partial Pass B coverage; runtime CI, PostgreSQL and browser tests not executed**. A row marked source-contract below is deliberately not described as full behavioural integration coverage.

| Export / route | Coverage evidence | Scenarios demonstrated | Still required |
| --- | --- | --- | --- |
| `campaignRecipientDisposition` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts`; `chat2-campaign-recipient-snapshot-boundaries.test.ts` | Consent, bounce, invalid/no email, Not-now | Live DB selection |
| `assertCampaignRecipientCap` | Same files | Boundaries, negative/fractional/overflow, suppressed 650-contact roster | Provider load |
| `planTpoCampaignRecipients` | `chat2-campaign-recipient-snapshot-boundaries.test.ts` | Unique email **and** lead identity, 500 send cap, no PII in output | SQL snapshot race |
| `campaignRecipientStillMatchesSnapshot` | Same file | Current and historical opt-outs, bounced contact, changed destination | In-flight opt-out race |
| `previewTpoCampaignText` | `chat2-ledger-campaign-public-link-and-settings.test.ts` | Plain-text placeholders and body length | Browser markup |
| `tpoCampaignDraftSchema` | Same file | Required metadata and distinct selected IDs | Provider provisioning |
| `issueTpoCampaignRecipientToken` / `verifyTpoCampaignRecipientToken` | Same file | HMAC secret length, purpose and token tamper | Secret rotation |
| `dispatchTpoCampaign` | Same file — dispatch service source contract | Live suppression, persisted actor, once-only claim, receipts, audit | PostgreSQL crash/restart at each row |
| `getTpoPublicJoinLinkStatus` | Same file — link service source contract; `chat2-tpo-public-link-bounded-json.test.ts` — GET route specific outside POST suite | College/member scope and one-time token non-disclosure | Read-state integration |
| `changeTpoPublicJoinLink` | `chat2-ledger-campaign-public-link-and-settings.test.ts`; `chat2-settings-people-trusted-links-cas.test.ts` | Confirmation, observed link CAS, scope, one-time token | Parallel POST winner |
| `setTpoPublicJoinLinkEnabled` | Same files | Observed link CAS, enabled/disabled strict fields | Parallel toggle winner |
| `tpoPublicJoinLinkChangeSchema` | `chat2-settings-people-trusted-links-cas.test.ts` | CREATE, REPLACE, stale identity, foreign keys | Route 413 integration |
| `tpoPublicJoinLinkToggleSchema` | Same file | Company ID and observed link ID required | Route 409 integration |
| `publicJoinLinkPath` | Same file | Encodes raw token path segment | Raw token expiry |
| `getTpoPlacementTeam` | `chat2-ledger-campaign-public-link-and-settings.test.ts` — scoped service read source contract | Active team membership and tenant id | Active/inactive DB roles |
| `getTpoTrustedCompanies` | Same file — scoped service read source contract | College-scoped explicit trust evidence | Relationship expiry DB |
| `buildTpoTeamRoster` / `summarizeTpoTeam` | `chat2-settings-people-trusted-links-cas.test.ts` | Persisted roles, active identities, dated duty dedupe and summary | Pagination/high volume |
| `buildTpoTrustedCompanies` / `buildTpoTrustedDomains` | Same file | Explicit domains only, ordering, case folding, oldest row, counts | SQL provenance |
| `getTpoCommunicationSettings` | `chat2-ledger-campaign-public-link-and-settings.test.ts` — source contract | Locked persisted actor read | Failure injection |
| `updateTpoCommunicationSettings` | Same file; `chat2-settings-people-trusted-links-cas.test.ts` — schema/model | Locked college CAS, idempotent retry without double audit | Double-session DB race |
| `tpoCommunicationChangeSchema` / `tpoCommunicationChanges` / `tpoCommunicationUpdateAlreadyApplied` | `chat2-settings-people-trusted-links-cas.test.ts` | Section-specific fields, timezone-offset-normalized revision, no-op retry | Reject malformed date in HTTP |
| `readTpoSettingsBody` | `chat2-tpo-public-link-bounded-json.test.ts` | JSON media-type, invalid body, incorrect content length, streaming cap, bounded parse | Stream cancellation testing |
| `POST /api/placements/tpo/public-join-links` | Same file — route source assertions | Origin guard, bounded JSON, 413 and no direct unbounded `request.json` | Auth/forbidden PostgreSQL |
| `POST /api/placements/tpo/public-join-links/enabled` | Same file — route source assertions | Origin guard, bounded JSON, 413 and no direct unbounded `request.json` | CAS race integration |
| `POST /api/placements/tpo/settings/recruiter-grants` | Same file — route source assertions | Origin guard, bounded JSON, 413 and no direct unbounded `request.json` | Grant lifecycle |
| `PATCH /api/placements/tpo/settings/communication` | `chat2-ledger-campaign-public-link-and-settings.test.ts`; `chat2-tpo-public-link-bounded-json.test.ts` (shared bounded reader) | Body size/schema, same-origin guard, error mapping | DB rollback and audit count |

## Next remaining work

Continue full route and function inventory (including draft/history/dispatch endpoints and the recruiter grant service). The rows above satisfy **named source/model tests only**, not the queue's complete role matrix, friendly-error browser checks, PostgreSQL constraint and rollback cases, or full property-based abuse cases. Do not represent the queue as finished.
