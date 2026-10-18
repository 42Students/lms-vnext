# UX route: `/tpo/batches/[batchId]/history`

**Lane:** chat-12 · first third of TPO routes · source review 8/42. **Archetype:** existing authenticated TPO surface.

**Before:** Legacy page controls had locally authored mobile/contrast/landmark patterns needing the signed-off shared UI conventions.

**Changes:** accessible links; teal contrast; single shell main. Existing PageHeader, role checks, routes, forms, saved values and copy remain intact.

**State and permission review:** Kept original permission checks, loading, empty, error, pagination and transaction controls where already implemented; absent states are not falsely treated as tested. No database or data-policy changes.

**Test:** `tests/unit/UX-tpo-batches-batchid-history-01.test.ts`. Static source contract prepared. **Browser/TypeScript/Vitest evidence:** pending orchestrator run; route should only be ticked in pages-tpo.md after tests pass.

## Shared-component completion

Reused shared PageHeader and/or Input, Select, Button with native keyboard behavior, 44px minimum targets, focus outlines and 16px phone form text. Original labels, defaults and URL GET semantics remain unchanged.

**Source tests:** `tests/unit/UX-tpo-batches-batchid-history-02.test.ts` (where applicable). No permission, notification, write path or API response was altered. Device/AT/typecheck acceptance remains with the orchestrator.
