# Decision record: infrastructure cost, Cloudflare and the database

Date: 2026-11-13
Status: DECIDED for the database (stay on Postgres). Cloudflare web-side move is OPEN (first step proposed).
Nothing here was changed on any cloud. Prices were read from the providers' pages on 2026-11-13 unless marked "estimate"; re-check before acting.

## Decision

1. **Keep Postgres.** It handles our tenant isolation (row-level security), row and advisory locks, 343 migrations, triggers and the hash-chained audit trail. Fewest breakages with many colleges.
2. **Do not rewrite to Cloudflare D1** (SQLite). Cheap, but it would need a ground-up rewrite and the risks below.
3. **Stay on Cloud SQL for production for now.** Keep it small (about 2 vCPU, 8 GB) until a load test says otherwise.
4. **Use Cloudflare for the edge first** (firewall, rate limits, Turnstile on sign-in, Cloudflare for SaaS for college domains). Moving the web app to Workers is optional and only after a spike.
5. **Dev, CI and test databases may use a free managed Postgres** (Neon or Supabase free tier). Never real student data on a free tier.

## Why

- The cost saving from Cloudflare is on the web side (nodes, load balancer, outgoing data): roughly $100-200 a month at 10k users and $900-1,500 at 100k (estimates). The database cost is about the same wherever Postgres runs.
- At one college with 10k+ people, concurrency in one place matters more than total users (same timetable, same exam). A single D1 database per college would become the write hot spot. Postgres with a pooler is proven for that.
- SMS sign-in codes can cost more than the database at scale (estimate $200-360 a month at 100k users). Longer sessions and email codes cut it.

## Prices read on 2026-11-13

| Service | Price |
|---|---|
| Workers paid | $5/month minimum; 10M requests and 30M CPU-ms included; then $0.30 per M requests and $0.02 per M CPU-ms. Free plan: 100k requests/day, 10 ms CPU. |
| Hyperdrive | No per-query, connection or transfer charge. Free plan capped at 100k queries/day; paid plan unlimited. It is a pooler, not a database. |
| D1 | Free: 5M rows read/day, 100k written/day, 5 GB. Paid: 25B reads and 50M writes/month included, then $0.001 per M reads and $1 per M writes; $0.75 per GB-month above 5 GB. |
| Neon | Free: 1 GB per project, 100 compute-hours, 6 h recovery window. Launch: $0.106 per compute-hour, $0.35 per GB-month, 7 days recovery. Scale: $0.222 per compute-hour, 30 days recovery. One compute unit is about 1 vCPU and 4 GB. |
| Supabase | Free: 500 MB, pauses after a week idle. Pro from $25 (8 GB, 250 GB egress, $10 compute credit). Compute add-ons: Small $15, Medium $60, Large $110 (2 dedicated vCPU, 8 GB), XL $210 (4 vCPU, 16 GB), 2XL $410. |
| Cloud SQL (estimate, not fetched) | about $110-140 for 2 vCPU / 7.5 GB single zone; about $220+ highly available. |

## Estimates behind the comparison (assumptions, not our bill)

- 10k users: about 2,000 active a day, about 9M requests/month, about 450 GB out. GCP style about $250-400/month; Cloudflare web plus the same Postgres about $130-180.
- 100k users: about 90M requests/month, about 4.5 TB out. GCP style about $1,300-2,200/month; Cloudflare plus the same-size Postgres about $400-750.
- Steady-load database comparison (2 vCPU, 8 GB): Supabase about $135, Neon Launch always-on about $155 plus storage, Cloud SQL about $110-140. No managed host is clearly cheaper than Cloud SQL for production.

## Risks found before any move

- **Shared campus network address.** Thousands of students behind one public IP could trip per-IP sign-in or OTP limits. Check how our limits are keyed. (Not yet checked.)
- **Pooling and the per-request college setting.** In pooled (transaction) mode a plain `SET` can be lost or leak. It must be `SET LOCAL` inside a transaction. (Not yet checked.)
- **Hyperdrive caching must stay off.** Cached read results could be served across colleges.
- **Cloud SQL is on a private address**, reachable from Workers only via a public address with SSL enforced (an open security item: SSL is not required today) or a Cloudflare Tunnel. Untested.
- **Why not D1:** no row-level security, no row or advisory locks, different SQL, our Postgres triggers and functions would not carry over, a single writer per database, and cross-college reads (multi-college users, Super Admin, recruiters) need a central database anyway.

## Next steps (all read-only to start)

1. Check how rate limits treat a shared campus IP, and how bulk import behaves at 10k rows.
2. Check that the per-request college setting is safe under pooling.
3. Load test: about 3,000 simulated students signing in and submitting a quiz. Size the database from the result.
4. Cloudflare firewall and Turnstile in front of the current setup (cheap, reversible).
5. Re-evaluate the database host at about 30-50k users or when the bill or load justifies it.
