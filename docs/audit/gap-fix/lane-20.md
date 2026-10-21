# Lane chat-20 — gap-fix evidence

- `docs/audit/gap-fix-work/packets/lane-2/src_modules_placements_tpo-team-internal-reply-service.ts.md` | G2-19-031-053: returned `notified: 1` for private counterpart notifications (initial send and idempotent replay); group Everyone already reports its actual recipient count in `tpo-team-everyone-service.ts`. Legacy multi-member mention semantics remain outside two-member private threads.
- `docs/audit/gap-fix-work/packets/lane-2/src_modules_placements_tpo-drive-deadline-model.ts.md` | G2-2-016-091: date input now emits legacy required/invalid wording; exported policy decision-to-actionable-message mapping for invalid, past, not-later and read-only. UI/service consumers require cross-lane adoption (handoff).
