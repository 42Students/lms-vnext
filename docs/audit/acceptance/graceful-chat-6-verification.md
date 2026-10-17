# Chat-6 graceful operation adoption (source-authored; tests not executed)

| ID | Status | Evidence |
|---|---|---|
| GR-04 | DONE (source authored, orchestrator runtime pending) | `src/components/college/college-person-edit-action.tsx`, `src/components/placements/placement-employer-relationships.tsx`, `src/components/placements/college-drive-archive-action.tsx`, `src/components/courses/admin-course-actions.tsx`; `tests/unit/chat6-friendly-fetch-adoption.test.ts` → `GR-04 chat-6 client mutations use guarded apiFetch without raw error codes` |
| GR-32 | DONE (source authored, orchestrator runtime pending) | Same components preserve their editing state on failed mutations and surface shared 409 copy; `tests/unit/chat6-friendly-fetch-adoption.test.ts` → `GR-32 chat-6 edit forms keep draft state and show shared conflict message` |
| GR-90 | DONE (source authored, orchestrator a11y pending) | `src/components/college/college-person-edit-action.tsx`, `src/components/placements/college-drive-archive-action.tsx`; `tests/unit/chat6-friendly-fetch-adoption.test.ts` → `GR-90 chat-6 inline fetch failures have alert semantics` |
