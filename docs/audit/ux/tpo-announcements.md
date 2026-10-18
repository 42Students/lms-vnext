# UX route: `/tpo/announcements`

**Lane:** chat-12 · first third of TPO routes · source review 2/42. **Archetype:** existing authenticated TPO surface.

**Before:** Legacy page controls had locally authored mobile/contrast/landmark patterns needing the signed-off shared UI conventions.

**Changes:** touch targets; accessible links; teal contrast; single shell main. Existing PageHeader, role checks, routes, forms, saved values and copy remain intact.

**State and permission review:** Kept original permission checks, loading, empty, error, pagination and transaction controls where already implemented; absent states are not falsely treated as tested. No database or data-policy changes.

**Test:** `tests/unit/UX-tpo-announcements-01.test.ts`. Static source contract prepared. **Browser/TypeScript/Vitest evidence:** pending orchestrator run; route should only be ticked in pages-tpo.md after tests pass.

## UX form-component follow-up (chat-12)

Replaced page-local controls with shared `Input`, `Textarea`, `Button` where applicable. Form field names, labels, default values, GET URL filtering, safe post actions, required validation and legacy copy are unchanged. Shared controls supply 16px phone input text, a 44px target and visible keyboard focus. Existing authorization checks, error branches and mobile navigation remain in place.

Source contract: `tests/unit/UX-tpo-announcements-04.test.ts`. Browser, TypeScript and unit execution remain orchestrator acceptance tasks, not claimed passing here.
