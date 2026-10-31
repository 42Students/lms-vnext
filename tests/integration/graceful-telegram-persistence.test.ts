import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Pool } from "pg";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import { closeDatabaseConnection } from "@/db/client";
import { observedEventHash, reportErrorForAlert } from "@/modules/log-alerts/reporter";
import { errorSignatureHash } from "@/modules/log-alerts/signature";

const enabled = process.env.DB10_DISPOSABLE_TEST_DATABASE === "true" &&
  Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DATABASE_URL === process.env.TEST_DATABASE_URL;
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const path = "/api/gr-125-integration";
const message = "GR125 durable alert unique fixture";
const hash = errorSignatureHash({ environment: "DEVELOPMENT", message, path });
const failureMessage = "GR125 rejected provider unique fixture";
const failureHash = errorSignatureHash({ environment: "DEVELOPMENT", message: failureMessage, path });
const dedupRequestId = "91a2b3c4";
const dedupHash = observedEventHash("DEVELOPMENT", hash, dedupRequestId);

const env = { app: process.env.APP_ENV, ready: process.env.DB10_LOG_ALERTS_READY,
  bot: process.env.TELEGRAM_ALERT_BOT_TOKEN, chat: process.env.TELEGRAM_ALERT_CHAT_ID };

describe.skipIf(!enabled)("GR-125 PostgreSQL Telegram alert delivery and counters", () => {
  beforeAll(async () => {
    assertDb018DisposableTarget(process.env, { serviceBound: true });
    if (!pool) throw new Error("Disposable DB required");
    process.env.APP_ENV = "development";
    process.env.DB10_LOG_ALERTS_READY = "DB10_VERIFIED";
    process.env.TELEGRAM_ALERT_BOT_TOKEN = "test-bot";
    process.env.TELEGRAM_ALERT_CHAT_ID = "123";
    const columns = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='log_alert_daily_counts'",
    );
    if (!columns.rows.length) throw new Error("GR-125 registered DB10 daily-count migration required");
    await pool.query("delete from log_alert_signatures where environment='DEVELOPMENT' and signature_hash=$1", [hash]);
    await pool.query("delete from log_alert_signatures where environment='DEVELOPMENT' and signature_hash=$1", [failureHash]);
    if (dedupHash) await pool.query("delete from log_alert_observed_events where event_hash=$1", [dedupHash]);
    await pool.query("delete from log_alert_states where state_key='TELEGRAM_BURST_DEVELOPMENT'");
  });
  afterAll(async () => {
    vi.unstubAllGlobals();
    if (pool) {
      await pool.query("delete from log_alert_signatures where environment='DEVELOPMENT' and signature_hash=$1", [hash]);
      await pool.query("delete from log_alert_signatures where environment='DEVELOPMENT' and signature_hash=$1", [failureHash]);
      if (dedupHash) await pool.query("delete from log_alert_observed_events where event_hash=$1", [dedupHash]);
      await pool.query("delete from log_alert_states where state_key='TELEGRAM_BURST_DEVELOPMENT'");
      await pool.end();
    }
    for (const [key, value] of Object.entries({
      APP_ENV: env.app, DB10_LOG_ALERTS_READY: env.ready,
      TELEGRAM_ALERT_BOT_TOKEN: env.bot, TELEGRAM_ALERT_CHAT_ID: env.chat,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await closeDatabaseConnection();
  });

  it("GR-115 and GR-116 sends a new signature once then only increments durable counts", async () => {
    const transport = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", transport);
    const input = { event: "test.error", error: new Error(message), path };
    await reportErrorForAlert(input);
    await reportErrorForAlert(input);
    expect(transport).toHaveBeenCalledTimes(1);
    const rows = await pool!.query(
      "SELECT occurrence_count::text AS count, alerted_at FROM log_alert_signatures WHERE signature_hash=$1", [hash],
    );
    expect(rows.rows[0]?.count).toBe("2");
    expect(rows.rows[0]?.alerted_at).toBeTruthy();
    const days = await pool!.query(
      "SELECT occurrence_count::text AS count FROM log_alert_daily_counts WHERE signature_id=(SELECT id FROM log_alert_signatures WHERE signature_hash=$1)", [hash],
    );
    expect(days.rows[0]?.count).toBe("2");
  });
  it("GR-115 GR-116 GR-125 does not persist an undelivered signature and retries after Telegram recovers", async () => {
    const failed = vi.fn(async () => new Response(JSON.stringify({ ok: false }), { status: 200 }));
    vi.stubGlobal("fetch", failed);
    const input = { event: "test.error", error: new Error(failureMessage), path };
    await reportErrorForAlert(input);
    expect(failed).toHaveBeenCalledTimes(1);
    const before = await pool!.query(
      "select id from log_alert_signatures where environment='DEVELOPMENT' and signature_hash=$1", [failureHash],
    );
    expect(before.rows).toHaveLength(0);
    const accepted = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", accepted);
    await reportErrorForAlert(input);
    expect(accepted).toHaveBeenCalledTimes(1);
    const after = await pool!.query(
      "select occurrence_count::text as count from log_alert_signatures where environment='DEVELOPMENT' and signature_hash=$1",
      [failureHash],
    );
    expect(after.rows[0]?.count).toBe("1");
  });
  it("GR-114 GR-115 GR-125 deduplicates immediate and Cloud Logging reports using only a hash", async () => {
    const transport = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal("fetch", transport);
    const before = await pool!.query<{ count: string }>(
      "select occurrence_count::text as count from log_alert_signatures where environment='DEVELOPMENT' and signature_hash=$1",
      [hash],
    );
    const baseline = Number(before.rows[0]?.count ?? 0);
    const input = { event: "test.error", error: new Error(message), path, requestId: dedupRequestId };
    expect(await reportErrorForAlert(input)).toBe(true);
    expect(await reportErrorForAlert(input)).toBe(true);
    const after = await pool!.query<{ count: string }>(
      "select occurrence_count::text as count from log_alert_signatures where environment='DEVELOPMENT' and signature_hash=$1",
      [hash],
    );
    expect(Number(after.rows[0]?.count)).toBe(baseline + 1);
    const recorded = await pool!.query(
      "select event_hash from log_alert_observed_events where event_hash=$1",
      [dedupHash],
    );
    expect(recorded.rows).toHaveLength(1);
    expect(transport).not.toHaveBeenCalled();
  });

  it("P5-R10 serializes two workers per signature and exactly one fixed-error regression", async () => {
    const raceMessage = "DB18 P5-R10 registered concurrent incident";
    const raceHash = errorSignatureHash({environment: "DEVELOPMENT", message: raceMessage, path});
    const input = {event: "test.error", error: new Error(raceMessage), path};
    const removeRace = () => pool!.query(
      "delete from log_alert_signatures where environment='DEVELOPMENT' and signature_hash=$1",
      [raceHash],
    );
    await removeRace();
    // Hold the real provider callback while the first worker owns the
    // persisted alert state lock. The second worker must block in PostgreSQL,
    // rather than simply executing after a sequential await in JavaScript.
    let startedSend: () => void = () => {};
    let releaseSend: () => void = () => {};
    const started = new Promise<void>((resolve) => { startedSend = resolve; });
    const released = new Promise<void>((resolve) => { releaseSend = resolve; });
    const transport = vi.fn(async () => {
      if (transport.mock.calls.length === 1) {
        startedSend();
        await released;
      }
      return Response.json({ok: true});
    });
    vi.stubGlobal("fetch", transport);
    const first = reportErrorForAlert(input);
    let second: Promise<boolean> | null = null;
    try {
      await started;
      second = reportErrorForAlert(input);
      const deadline = Date.now() + 5_000;
      let blocked = false;
      while (Date.now() < deadline) {
        const waiting = await pool!.query<{blocked: string}>(
          `select count(*)::text as blocked from pg_stat_activity
            where datname=current_database() and pid <> pg_backend_pid()
              and wait_event_type='Lock' and query ilike '%log_alert_states%'`,
        );
        if (Number(waiting.rows[0]?.blocked ?? 0) > 0) {
          blocked = true;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      expect(blocked, "Second log-alert producer never reached the PostgreSQL state lock").toBe(true);
    } finally {
      releaseSend();
    }
    expect(await Promise.all([first, second!])).toEqual([true, true]);
    const original = await pool!.query<{
      occurrence_count: string; first_seen_at: Date; last_seen_at: Date; fix_status: string;
    }>(
      `select occurrence_count::text,first_seen_at,last_seen_at,fix_status
       from log_alert_signatures where environment='DEVELOPMENT' and signature_hash=$1`,
      [raceHash],
    );
    expect(original.rows).toHaveLength(1);
    expect(original.rows[0]?.occurrence_count).toBe("2");
    expect(original.rows[0]?.first_seen_at.getTime()).toBeLessThanOrEqual(
      original.rows[0]!.last_seen_at.getTime(),
    );
    expect(transport).toHaveBeenCalledTimes(1);
    // Two more simultaneous reports after a recorded FIXED resolution must
    // count both occurrences but reopen the regression exactly once.
    await pool!.query(
      `update log_alert_signatures set fix_status='FIXED',
         fixed_at=clock_timestamp()-interval '2 days',
         acknowledged_at=clock_timestamp(),regressed_at=null
       where environment='DEVELOPMENT' and signature_hash=$1`,
      [raceHash],
    );
    const regressions = await Promise.all([reportErrorForAlert(input), reportErrorForAlert(input)]);
    expect(regressions).toEqual([true, true]);
    const final = await pool!.query<{
      occurrence_count: string; fix_status: string; regressed_at: Date | null;
      acknowledged_at: Date | null; first_seen_at: Date; last_seen_at: Date;
    }>(
      `select occurrence_count::text,fix_status,regressed_at,acknowledged_at,
         first_seen_at,last_seen_at from log_alert_signatures
       where environment='DEVELOPMENT' and signature_hash=$1`,
      [raceHash],
    );
    expect(final.rows).toHaveLength(1);
    expect(final.rows[0]).toMatchObject({
      occurrence_count: "4", fix_status: "OPEN", acknowledged_at: null,
    });
    expect(final.rows[0]?.regressed_at).toBeInstanceOf(Date);
    expect(final.rows[0]!.last_seen_at.getTime()).toBeGreaterThanOrEqual(
      final.rows[0]!.first_seen_at.getTime(),
    );
    expect(transport).toHaveBeenCalledTimes(2);
    const daily = await pool!.query<{occurrence_count: string}>(
      `select d.occurrence_count::text from log_alert_daily_counts d
         join log_alert_signatures s on s.id=d.signature_id
       where s.environment='DEVELOPMENT' and s.signature_hash=$1`,
      [raceHash],
    );
    expect(daily.rows).toHaveLength(1);
    expect(daily.rows[0]?.occurrence_count).toBe("4");
    await removeRace();
  });

});
