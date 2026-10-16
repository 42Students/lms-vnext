# Phase 2 audit tracker

`scripts/audit/build-gap-register.mjs` turns the per-page audits (`docs/audit/pages/**`, Round A audits plus Round R reviews) into the gap register and tracks how many gaps have been closed, using the git history as the source of truth.

## Files it generates (do not edit by hand)

| File | What it is |
|---|---|
| `gap-register.md` | One row per gap, with Status, proposed lane and a `Fixed by` column (commit sha) |
| `PROGRESS.md` | Totals by status per account, severity and lane, percentage closed, per-lane throughput (last 24 h and per day), the 20 most recent fixes, citation parse problems |
| `live-check-list.md` | UNCONFIRMED items grouped by how they can be settled |
| `progress-history.csv` | Appended on each run when any count changed. Long format: `date,time,dimension,key,total,<one column per status>,closed_pct`. Dimensions: `all`, `account`, `severity`, `lane` (UTC time) |
| `tracker-data.json` | Per gap: id, page, account, type, severity, status, lane, fixedBy, fixedAt, verifiedBy, reviewStatus, note |
| `tracker-summary.json` | The counts (by status, account, severity, lane, fixed in last 24 h) for a dashboard |

## How to run it

Locally, to look at the numbers (writes into the current checkout, so use a scratch worktree or discard the diff):

```bash
git fetch origin
node scripts/audit/build-gap-register.mjs
```

To refresh and publish, without touching your checkout:

```bash
bash scripts/audit/refresh-tracker.sh            # fetch, regenerate in a temp worktree off origin/main, commit, push to main
NO_PUSH=1 bash scripts/audit/refresh-tracker.sh  # same, but stop before pushing
```

The script commits `chore(audit): refresh tracker` only when something other than a generation timestamp changed, and removes its temporary worktree on exit. On Windows, if git converts line endings, run it as `bash <(tr -d '\r' < scripts/audit/refresh-tracker.sh)`.

Environment overrides for the generator: `TRACK_SINCE` (default `2026-10-15`, the start of the git window), `TRACK_MAIN_REF` (default `origin/main`).

## How statuses work

A gap starts with the status its audit and review give it:

| Status | Meaning |
|---|---|
| OPEN | Confirmed or not yet reviewed, no citing commit |
| UNCONFIRMED | A row or review says it needs a live or database check, no citing commit |
| CLOSED-SINCE | A review says it was already fixed on main when reviewed |
| WRONG | A review says the Round A claim is incorrect |

The tracker then applies git evidence, in this order:

1. **IN-BRANCH**: no commit on `origin/main` cites the ID, but a commit on an `origin/chatgpt/chat-N` branch that is not yet on main does. `Fixed by` shows `chat-N:sha`.
2. **FIXED-ON-MAIN**: at least one commit on `origin/main` since `TRACK_SINCE` cites the ID. `Fixed by` is the latest citing commit (sha, with its date in `tracker-data.json`). A citation overrides OPEN, UNCONFIRMED and CLOSED-SINCE (a note records the earlier review status). A gap a review marks WRONG stays WRONG; the note records the citation. A later review that still calls a FIXED-ON-MAIN gap open does not reopen it.
3. **VERIFIED**: the gap is FIXED-ON-MAIN and a test file under `tests/` (unit or integration) or an acceptance report under `docs/audit/acceptance/` names the ID. The files are listed as `verifiedBy`. A commit message alone never makes a gap VERIFIED, and a test that names an ID with no citing commit leaves the gap as it was (a note is added).

Open work is OPEN + UNCONFIRMED + IN-BRANCH. Closed percentage is (FIXED-ON-MAIN + VERIFIED + CLOSED-SINCE) divided by all rows except WRONG.

Commits of type `docs`, `chore` or `audit`, and commits touching only `docs/` or `scripts/audit/`, are ignored as citations: they list gap IDs without fixing them.

Lane in the tracker is the lane branch that carried the latest citing commit when that can be found, otherwise the proposed lane from the register.

## How lanes must cite gap IDs

Put the full gap ID in the subject or the body of every commit that fixes (or partly fixes) a gap:

```
fix(tpo): TPO-batches-18 add Invite action
fix(tpo): TPO-batches-18 TPO-batches-19 preserve exact toast wording
```

Accepted shorthand, applied to the prefix of the first ID:

- lists: `TPO-drive-workspace-13, 21, 25` (bare numbers need at least two digits and must not look like a count such as `30 rows`)
- slash and "and": `LEARNER-projects-24/25`, `TPO-batches-18 and 19`
- ranges: `TPO-recruiters-01..05`
- review-missed IDs: `TPO-home-R01`

The prefix must be one that exists in the register (for example `TPO-drive-workspace`, `SA-academics-people`, `REC-home-drives`, `LEARNER-placements`, `FAC-courses`, `COL-people`, `MEN-projects-meetings`, `PUB-auth-public`). IDs that do not exist in the register, and misspelt prefixes, are listed under "Citation parse problems" in `PROGRESS.md`. Cite only what the commit actually fixes: a cited ID counts as fixed. To get VERIFIED, put the ID in the name or body of the test that proves the behaviour.
