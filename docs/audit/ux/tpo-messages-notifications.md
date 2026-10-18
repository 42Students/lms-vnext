# UX route: `/tpo/messages/notifications`

**Lane:** chat-12 · first third of TPO routes · source review 35/42. **Archetype:** canonical redirect.

**Before:** Alias route, no independent UI copy.

**Changes:** Retained canonical destination and any encoded dynamic identifiers.

**States:** Canonical destination handles ready/denied/error states. TypeScript, Vitest, phone and WebView checks remain to be run.

**Test:** `tests/unit/UX-tpo-messages-notifications-01.test.ts`; source acceptance only until orchestrator runs it. **Page list:** do not tick until tested.
