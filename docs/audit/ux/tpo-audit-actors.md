# UX route: `/tpo/audit/actors`

**Lane:** chat-12 · first third of TPO routes · source review 4/42. **Archetype:** existing authenticated TPO surface.

**Before:** Legacy page controls had locally authored mobile/contrast/landmark patterns needing the signed-off shared UI conventions.

**Changes:** touch targets; accessible links; teal contrast. Existing PageHeader, role checks, routes, forms, saved values and copy remain intact.

**State and permission review:** Kept original permission checks, loading, empty, error, pagination and transaction controls where already implemented; absent states are not falsely treated as tested. No database or data-policy changes.

**Test:** `tests/unit/UX-tpo-audit-actors-01.test.ts`. Static source contract prepared. **Browser/TypeScript/Vitest evidence:** pending orchestrator run; route should only be ticked in pages-tpo.md after tests pass.

## Responsive data-table follow-up

Replaced the dense fixed-width native table with shared `DataTable`, keeping the exact existing empty-state text through the required `empty` prop. The phone renders primary/action cells with further fields in the accessible disclosure. Row identity, permission and persisted business facts remain unchanged. Source contract: `tests/unit/UX-tpo-audit-actors-02.test.ts`; TypeScript/browser confirmation pending.
