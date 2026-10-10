# DB10 Announcements — W06 migration and parity handoff

**Date:** 2026-10-10  
**Legacy oracle:** `lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5` (`Announcement.java`, `AnnouncementRepository.java`, `V127__announcement_schedule_expiry_pin.sql`)  
**State:** CODE_STAGED / MIGRATION_BLOCKED. W01 owns `drizzle/**`, schema barrel registration and replay.

## Source semantics accounted for

| Legacy field | vNext draft | Note |
|---|---|---|
| id | id UUID | Greenfield identifier |
| receiver_type | receiverType | COLLEGE, PROGRAM, DEPARTMENT, LEARNER, FACULTY, CLASS |
| receiver_value | receiverId UUID | Normalized target ID; target type determines table |
| title | title | 1–255 plain text |
| message | message | 1–10000 plain text; legacy relaxed HTML is intentionally not rendered as HTML |
| sender_type | senderType | Server-derived role snapshot |
| sender_id | senderUserId | Authenticated canonical user, never request JSON |
| created_at | createdAt | timestamptz |
| updated_at | updatedAt | timestamptz |
| is_deleted | deletedAt/deletedByUserId | Soft-delete lifecycle normalized and actor-attributed |
| scheduled_at | scheduledAt | Recipient-visible at/after instant |
| expires_at | expiresAt | Recipient-hidden at/after instant |
| is_pinned | isPinned | Recipient ordering pinned first |

Additional vNext safety fields: `organizationId`, `collegeId` for explicit tenant scope and `version` for optimistic concurrency.

## Staged code

- `src/db/schema/db10-announcements.draft.ts` — isolated Drizzle proposal, **not exported**.
- `src/modules/announcements/{validation,service,readiness,errors}.ts`.
- Admin API: `/api/announcements/admin`, item PATCH/DELETE, restore.
- Recipient API: `GET /api/announcements/mine`.
- Admin UI: `/college/announcements`, `/admin/announcements`.
- All DB-backed routes/pages are fail-closed unless `DB10_ANNOUNCEMENTS_READY=DB10_VERIFIED`.

## Security / behavior decisions

1. Target UUID never establishes tenant scope. Server resolves target→college→organization and authorizes that persisted scope.
2. Retargeting authorizes both the existing target scope and the new target scope.
3. College Admin cannot create/update announcements outside their membership college.
4. Super Admin selected organization/college safety scope is honored.
5. Recipient feed derives College/Program/Class/Department/direct Faculty/Learner targets from active persisted membership/enrollment/assignment state; client does not submit audience IDs.
6. Deleted, future-scheduled and expired announcements are filtered from recipient reads; admins may still manage them.
7. Legacy relaxed HTML is a deliberate safety exception: vNext stores/displays message as plain text until a separately audited rich-text sanitizer contract exists.
8. No fan-out into `in_app_notifications` is invented. Announcements remain a distinct shared communication model, matching legacy pull-based recipient semantics.

## Tests authored, not executed

- `tests/unit/announcement-validation.test.ts`
- `tests/db10-announcement-route-gates.test.mjs`
- `tests/integration/db10-announcements.test.ts` (requires `TEST_DATABASE_URL` + `DB10_ISOLATED_TEST_DATABASE=1` and the draft table applied)

Coverage includes exact receiver enums, schedule order, strict payloads, migration gate, cross-college writes, schedule/expiry/pin visibility, CAS races, soft-delete/restore and Super Admin scope.

## W01 activation checklist

- [ ] Review normalized source mapping and deliberate plain-text/security exceptions.
- [ ] Promote table into the shared schema barrel in the same migration commit.
- [ ] Generate/register migration + snapshot; do not hand-write journal sequence in W06.
- [ ] Replay from empty DB and current latest migration on disposable PostgreSQL.
- [ ] Run DB10 announcement integration tests and route-gate tests.
- [ ] Run typecheck/lint/build.
- [ ] Browser-test College Admin and Super Admin management, including retarget, schedule/expiry, deleted view and stale-version conflict.
- [ ] Hand `GET /api/announcements/mine` to W02 for Learner/Faculty notification-surface integration without modifying W02-owned pages from W06.
- [ ] Set `DB10_ANNOUNCEMENTS_READY=DB10_VERIFIED` only after the above evidence exists.
