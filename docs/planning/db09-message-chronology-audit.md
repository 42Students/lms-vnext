# DB-061 — DB09 message chronology and thread projection

**Date:** 2026-10-11 IST  
**Worker:** Chat 3  
**Legacy BE oracle:** `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`

## Source contract

Legacy `TpoMessagesService.send` inserts a new message without `read_at` and updates the owning thread's `last_message_at = NOW()` in the same transaction. Reading a thread advances unread opposite-side messages to `read_at = NOW()`. Message identity/body/history is never deleted or rewritten.

Current vNext `sendThreadMessage` has the same two-write shape: insert message, then update thread `lastMessageAt`; `listThreadMessages` only advances unread opposite-side `readAt`.

## Gap

Before DB-061 the staged DB09 SQL did not enforce several source invariants:

- a message could be inserted already read;
- message rows could be deleted;
- the first `read_at` could predate creation or be arbitrarily future-dated;
- a message insert could commit without advancing `thread.last_message_at`;
- a thread could advertise a timestamp that was not the maximum persisted message time.

## Staged correction

- INSERT guard requires `read_at IS NULL`.
- Message creation/read timestamps may not be more than five minutes ahead of DB statement time. The tolerance avoids false rejects while the current producer still supplies application-clock timestamps.
- Published message identity/body/creation time are immutable and DELETE is rejected.
- Thread identity is also immutable: college, recruiter, optional job binding and creation time cannot be reassigned around an existing conversation; thread DELETE is rejected. Only the derived last-message projection may move.
- A first read must be at/after message creation; once set it cannot be changed or cleared.
- Deferred constraint triggers on both message INSERT and thread INSERT/UPDATE require:
  `thread.last_message_at IS NOT DISTINCT FROM MAX(message.created_at)`.
  A thread with no messages therefore requires null `last_message_at`.

The deferred check preserves the existing application write order within one transaction while making the projection a database invariant.

## PostgreSQL witnesses required after registration

- new message with non-null read_at fails;
- future-dated creation beyond tolerance fails;
- message DELETE/content/identity rewrite fails;
- thread DELETE or college/recruiter/job/created-at rewrite fails;
- valid first read succeeds;
- pre-creation/far-future read fails;
- read rewind/rewrite fails;
- empty thread + null last_message_at succeeds;
- empty thread + non-null last_message_at fails at commit;
- message insert + matching thread advance succeeds;
- message insert without thread advance fails at commit;
- thread timestamp not equal to max message timestamp fails;
- concurrent sends preserve exact max chronology.

**Gate:** staged/source implementation only; no registered migration or PostgreSQL execution claimed.
