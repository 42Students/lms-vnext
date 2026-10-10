# DB09 scheduling persistence contract (staged)

**Status:** staged database contract; not registered, migrated or runtime verified  
**Worker:** Chat 3 / DB-012  
**Date:** 2026-10-11  
**Legacy backend oracle:** `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`

## Active source behavior

The frozen production `TpoScheduleService`, `TpoTeamService` and `RecruiterDriveWorkService` still persist and consume ordered rounds, proposed/confirmed slots, round/application assignments, learner reschedule requests, student confirmations and date-scoped student coordinators. Final recruiter-era stored actor code is `RECRUITER`.

The current vNext `placement_job_rounds` is a valid target for `job_round`, but it does not preserve the remaining scheduling relations.

## Existing round mapping

Use `placement_job_rounds` as canonical:

- `seq -> sequence`
- `scheduled_date -> scheduled_at`
- `test_link -> test_url`
- `results_due -> results_due_at`
- `added_by_recruiter_id -> created_by_user_id`, provided the actual recruiter canonical user is preserved and later authorization proves creator ownership.

## Required normalized relations

### placement_round_slots

Persist round, starts/ends, room, panel, capacity, proposer and status. Require `ends_at > starts_at`, capacity >= 1, proposer in `TPO|RECRUITER`, status in `PROPOSED|CONFIRMED`.

### placement_round_assignments

Persist one row per round/application, optional slot, room, student confirmation and notification timestamp. Carry `job_id` so the database can prove round and application belong to the same job. A slot FK must also prove the slot belongs to the same round.

### placement_round_reschedule_requests

Persist round/application/job, reason, preferred-times, `PENDING|MOVED|KEPT`, reply, deciding user, decision time and creation time. A MOVE must only use a confirmed slot in the same round.

### placement_drive_coordinator_assignments

Persist college, job, learner membership, assignment date, creator and creation time. Job and learner membership must both belong to the same college. Unique scope is `(job_id, learner_membership_id, on_date)`.

## Required negative witnesses

Before DB-012 can be DB-tested:

1. reject slot end <= start and capacity < 1;
2. reject stored proposer `HR`;
3. reject assignment whose application belongs to another job;
4. reject assignment whose slot belongs to another round;
5. reject duplicate round/application assignment;
6. reject reschedule request whose application and round belong to different jobs;
7. prove MOVE cannot attach an unconfirmed/cross-round slot;
8. prove slot change clears previous learner confirmation;
9. reject cross-college coordinator job/member pairs;
10. reject duplicate coordinator job/member/date;
11. race conflicting assignment writes and prove deterministic state;
12. replay the eventual registered migration from empty PostgreSQL.

**Gate:** source/staged design only. No migration/test pass is claimed.
