# UX route: `/tpo/batches/[batchId]/invitation-prep`

**Lane:** chat-12 · first third of TPO routes · source review 9/42. **Archetype:** canonical redirect.

**Before:** Canonical redirect; no independent UI should be invented.

**Changes:** Preserved the canonical redirect and dynamic scope without introducing a second page.

**State and permission review:** Redirect behavior is the expected state and relies on the destination's guard. No database or data-policy changes.

**Test:** `tests/unit/UX-tpo-batches-batchid-invitation-prep-01.test.ts`. Static source contract prepared. **Browser/TypeScript/Vitest evidence:** pending orchestrator run; route should only be ticked in pages-tpo.md after tests pass.
