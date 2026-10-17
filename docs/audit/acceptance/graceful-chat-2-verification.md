# Graceful operation — builder chat-2

Scope: the TPO Inbox, Team, Everyone and Announcements surfaces touched in this lane. **No tests or checks were run by chat-2.** The orchestrator executes tests and certifies the platform-wide GR checklist. Entries below are page-scoped source adoptions, not platform-wide completion.

| ID | Status | Evidence (source and named test) |
| --- | --- | --- |
| GR-30 | DONE — page-scoped | Mutating Everyone, recruiter reply, read receipts use guarded pending refs and bounded fetches; `src/components/tpo/tpo-everyone-controls.tsx`, `tpo-recruiter-message-reply.tsx`, `tpo-notice-read-progress.tsx`; `tests/unit/tpo-inbox-team-round4-graceful.test.ts` **GR-30**. |
| GR-31 | DONE — page-scoped | The touched message/bell/receipt controls use `src/lib/api-fetch.ts` with friendly errors and timeout; same test **GR-31**. Other controls remain for ongoing gap work. |
| GR-35 | PARTIAL — open | Recruiter draft discard requires explicit second confirmation and announcement deletion has a native dialog; test **GR-35**. Remaining destructive workflows require the shared accessible dialog. |
| GR-60 | PARTIAL — open | Everyone draft persists in session storage; test **GR-60**. Platform hook and expiry semantics remain chat-14. |
| GR-61 | PARTIAL — open | Everyone and recruiter replies keep unsent drafts on failed sends; test **GR-61**. Other long forms remain. |
| GR-62 | DONE — page-scoped | Everyone and recruiter reply warn before navigating away with unsent text; test **GR-62**. |
| GR-70 | PARTIAL — open | Everyone history has isolated failure/Retry without blank page; test **GR-70**. More cards remain. |
| GR-71 | PARTIAL — open | Everyone history distinguishes empty/unavailable/failed; Team filter shows filtered-empty + clear; tests **GR-71**, **TPO-inbox-team-18**. |
| GR-72 | DONE — page-scoped | Everyone title and Team navigation remain after history failure; test **GR-72**. |
| GR-73 | DONE — page-scoped | Announcement progress keeps last successful data when refresh fails, provides Retry; test **GR-73**. |
| GR-75 | PARTIAL — open | Bell acknowledgments use timeout and safe errors; test **GR-75**. Additional background refresh retries remain. |
| GR-90 | PARTIAL — open | All touched errors have `role="alert"`; test **GR-90**. Moving focus to first invalid input still pending. |
| GR-91 | PARTIAL — open | Everyone Retry and guarded controls have keyboard-visible focus; test **GR-91**. |
| GR-92 | PARTIAL — open | Errors include textual messages and role alerts, not color alone; test **GR-92**. WCAG review remains with orchestrator. |

These rows record authored source and authored tests only; no execution or release certification is asserted.
