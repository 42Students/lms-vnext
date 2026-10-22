# Legacy job eligibility override decision

Legacy rule: manual INCLUDE/EXCLUDE was evaluated before normal academic thresholds.

vNext decision: manual EXCLUDE denies participation. INCLUDE can exempt ordinary
grade and backlog thresholds only. It cannot create a college membership, extend
a learner's academic target audience, grant access to an unpublished drive, or
turn unverified academic evidence into verified evidence.

Order:
1. Verify the actor's scoped authority, learner membership, college and job.
2. Enforce program/cohort/section audience and verified-only requirements.
3. Apply the latest active learner/job override (EXCLUDE then INCLUDE).
4. When there is no override, check normal academic thresholds.

This deliberate difference prevents a legacy override from crossing a tenant,
audience or evidence boundary. Drive previews use batched, college-scoped override
reads; applying still repeats the authoritative eligibility check.
