import { useCallback, useMemo, useRef, useState } from "react";
import { Alert, Button, Checkbox, Modal, Space, Typography, message } from "antd";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { recordBulk } from "@/api/Services/TpoHubService";

/**
 * The one way every TPO list runs an action on many rows (docs/tpo-ux: "bulk-actions engine"):
 *
 *   preview  - who it applies to (count + names), who is skipped and why, what happens, whether it can be undone
 *   run      - one call for the whole set, or one call per row (a failed row never stops the others)
 *   result   - done / skipped / failed with each failure's reason; copy the failed names
 *   undo     - when the action can be put back exactly (the page says how), one click, and the result says so
 *   record   - one line in the audit log per run and per undo (what was picked, done, skipped, failed)
 *
 * const [startBulk, bulkElement] = useBulkAction();  ... render {bulkElement} once, then:
 * startBulk({
 *   title: "Mark higher studies",               // the action, shown as the heading and the button
 *   noun: ["student", "students"],
 *   items, nameOf: (r) => fullName(r),
 *   skip: (r) => (r.status === "PLACED" ? "Already placed" : null),   // optional
 *   consequence: "They are left out of placement %...",               // optional sentence
 *   danger: false,                             // a serious action: a red warning heads the confirmation
 *   ack: "I have checked their documents another way",  // optional: a box to tick before it runs (danger without an
 *                                                // undo always asks: "I understand this cannot be undone.")
 *   undoNote: "This cannot be undone: students are told straight away.",  // when there is no undo
 *   undoWhen: "You can undo for 30 seconds.",  // when there is an undo with a limit
 *   run: async (items) => apiResult,             // a whole-set call (fetchWithErrorHandling shape)...
 *   partial: (apiResult, items) => [{ item, reason }],  // ...optional: the rows a successful whole-set call still could not do
 *   runEach: async (item) => apiResult,          // ...or one call per row
 *   undo: async (doneItems, runResult) => apiResult,   // optional exact undo
 *   summary: (runResult, doneItems) => "12 students reminded",  // optional: what the server actually did, shown under Done
 *   onDone: () => { clear(); reload(); },        // after a run or an undo that changed something
 * });
 */
const plural = (n, [one, many]) => `${n.toLocaleString()} ${n === 1 ? one : many}`;
const errorOf = (res, fallback) => res?.data?.message || res?.data?.error || fallback;
const CONCURRENCY = 4;

/** Runs fn over items, a few at a time; returns [{ item, ok, res }]. */
export async function eachLimited(items, fn, limit = CONCURRENCY) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      try {
        const res = await fn(items[i]);
        out[i] = { item: items[i], ok: res?.success !== false, res };
      } catch (e) {
        out[i] = { item: items[i], ok: false, res: { data: { message: e?.message } } };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/** Splits picked rows into the ones the action applies to and the skipped ones, grouped by reason. */
export function planBulk(items, skip) {
  const apply = [];
  const skipped = new Map();
  (items || []).forEach((item) => {
    const why = skip ? skip(item) : null;
    if (why) skipped.set(why, [...(skipped.get(why) || []), item]);
    else apply.push(item);
  });
  return { apply, skipped: [...skipped.entries()].map(([reason, rows]) => ({ reason, rows })) };
}

function Names({ rows, nameOf, max = 8 }) {
  const names = rows.slice(0, max).map(nameOf).filter(Boolean);
  if (!names.length) return null;
  return <span>{names.join(", ")}{rows.length > max ? ` and ${(rows.length - max).toLocaleString()} more` : ""}</span>;
}

/**
 * One result for undo from every run of an action (the first run plus each Retry). Per-row results (arrays) are joined;
 * for one-call results, array fields of data (like "before") are joined and the rest comes from the first run.
 */
export function mergeRunResults(list) {
  const runs = (list || []).filter((r) => r != null);
  if (runs.length <= 1) return runs[0] ?? null;
  if (runs.every(Array.isArray)) return runs.flat();
  const base = runs.find((r) => r && typeof r === "object" && !Array.isArray(r)) || runs[0];
  const merged = { ...base, data: { ...(base?.data || {}) } };
  runs.forEach((r) => {
    if (r === base || !r || Array.isArray(r) || !r.data || typeof r.data !== "object") return;
    Object.entries(r.data).forEach(([key, value]) => {
      if (Array.isArray(value)) merged.data[key] = [...(Array.isArray(merged.data[key]) ? merged.data[key] : []), ...value];
    });
  });
  return merged;
}

export default function useBulkAction() {
  const [state, setState] = useState(null); // { spec, phase: preview|running|result, plan, done, failed, runRes, undone, undoing, retrying }
  const busy = useRef(false);

  const record = (spec, plan, done, failed, undone = false) => {
    // Fire and forget: the record must never block or fail the action itself.
    fetchWithErrorHandling(recordBulk({
      action: spec.title, total: (spec.items || []).length, done: done.length,
      skipped: plan.skipped.reduce((n, g) => n + g.rows.length, 0), failed: failed.length, undone,
    })).catch(() => {});
  };

  const start = useCallback((spec) => {
    const plan = planBulk(spec.items, spec.skip);
    setState({ spec, phase: "preview", plan, done: [], failed: [], runRes: null, undone: false, undoing: false, retrying: false, acked: false });
  }, []);

  const close = () => { if (!busy.current) setState(null); };

  const go = async () => {
    if (!state || busy.current) return;
    const { spec, plan } = state;
    busy.current = true;
    setState((s) => ({ ...s, phase: "running" }));
    let done = [];
    let failed = [];
    let runRes = null;
    if (spec.runEach) {
      const results = await eachLimited(plan.apply, spec.runEach);
      runRes = results; // [{ item, ok, res }]: what summary() reads for a one-call-per-row action
      done = results.filter((r) => r.ok).map((r) => r.item);
      failed = results.filter((r) => !r.ok).map((r) => ({ item: r.item, reason: errorOf(r.res, "Could not be saved") }));
    } else {
      try {
        runRes = await spec.run(plan.apply);
      } catch (e) {
        runRes = { success: false, data: { message: e?.message } };
      }
      if (runRes?.success === false) failed = plan.apply.map((item) => ({ item, reason: errorOf(runRes, "Could not be saved") }));
      else {
        failed = spec.partial ? spec.partial(runRes, plan.apply) || [] : [];
        const notDone = new Set(failed.map((f) => f.item));
        done = plan.apply.filter((item) => !notDone.has(item));
      }
    }
    busy.current = false;
    record(spec, plan, done, failed);
    if (done.length) spec.onDone?.();
    setState((s) => ({ ...s, phase: "result", done, failed, runRes, runResAll: [runRes] }));
  };

  const retryFailed = async () => {
    if (!state || busy.current || !state.failed?.length) return;
    const { spec, failed, done: alreadyDone = [] } = state;
    const retryItems = failed.map((entry) => entry.item).filter(Boolean);
    if (!retryItems.length) return;

    busy.current = true;
    setState((s) => ({ ...s, retrying: true }));
    let newlyDone = [];
    let stillFailed = [];
    let runRes = null;

    try {
      if (spec.runEach) {
        const results = await eachLimited(retryItems, spec.runEach);
        runRes = results;
        newlyDone = results.filter((r) => r.ok).map((r) => r.item);
        stillFailed = results
          .filter((r) => !r.ok)
          .map((r) => ({ item: r.item, reason: errorOf(r.res, "Could not be saved") }));
      } else {
        try {
          runRes = await spec.run(retryItems);
        } catch (e) {
          runRes = { success: false, data: { message: e?.message } };
        }
        if (runRes?.success === false) {
          stillFailed = retryItems.map((item) => ({ item, reason: errorOf(runRes, "Could not be saved") }));
        } else {
          stillFailed = spec.partial ? spec.partial(runRes, retryItems) || [] : [];
          const notDone = new Set(stillFailed.map((f) => f.item));
          newlyDone = retryItems.filter((item) => !notDone.has(item));
        }
      }

      const combinedDone = [...alreadyDone, ...newlyDone.filter((item) => !alreadyDone.includes(item))];
      if (newlyDone.length) spec.onDone?.();
      record(
        // The retry is its own record: its total is the rows retried, not the original batch.
        { ...spec, title: `${spec.title} retry`, items: retryItems },
        { apply: retryItems, skipped: [] },
        newlyDone,
        stillFailed
      );
      setState((s) => ({
        ...s,
        done: combinedDone,
        failed: stillFailed,
        runRes,
        runResAll: [...(s.runResAll || [s.runRes]), runRes],
        retrying: false,
      }));
    } finally {
      busy.current = false;
      setState((s) => s ? ({ ...s, retrying: false }) : s);
    }
  };

  const undo = async () => {
    if (!state || busy.current) return;
    const { spec, plan, done, runRes, runResAll } = state;
    busy.current = true;
    setState((s) => ({ ...s, undoing: true }));
    let res;
    // BE-0118: after a Retry, undo needs every run's snapshot (the first run's "before" rows too), not just the retry's.
    try { res = await spec.undo(done, mergeRunResults(runResAll && runResAll.length ? runResAll : [runRes])); } catch (e) { res = { success: false, data: { message: e?.message } }; }
    busy.current = false;
    if (res?.success === false) {
      message.error(errorOf(res, "Could not undo"));
      setState((s) => ({ ...s, undoing: false }));
      return;
    }
    record(spec, plan, done, [], true);
    spec.onDone?.();
    message.success("Undone. Everything is back as it was.");
    setState((s) => ({ ...s, undoing: false, undone: true }));
  };

  const element = useMemo(() => {
    if (!state) return null;
    const { spec, phase, plan, done, failed, undone, undoing, retrying, runRes } = state;
    const noun = spec.noun || ["row", "rows"];
    const nameOf = spec.nameOf || ((r) => r?.name);
    const skippedCount = plan.skipped.reduce((n, g) => n + g.rows.length, 0);
    const skippedBlock = plan.skipped.length > 0 && (
      <div className="tpo-bulk__skipped" data-testid="bulk.skipped">
        <Typography.Text strong>Skipped: {plural(skippedCount, noun)}</Typography.Text>
        <ul>{plan.skipped.map((g) => <li key={g.reason}>{g.reason}: <Names rows={g.rows} nameOf={nameOf} max={5} /></li>)}</ul>
      </div>
    );

    if (phase === "preview" || phase === "running") {
      const none = plan.apply.length === 0;
      // What has to be ticked first: the action's own words, or for a serious action with no undo, that it is final.
      const ack = spec.ack || (spec.danger && !spec.undo ? "I understand this cannot be undone." : null);
      const blocked = Boolean(ack) && !state.acked;
      return (
        <Modal open title={`${spec.title}: ${plural(plan.apply.length, noun)}`} onCancel={close} maskClosable={phase !== "running"}
          footer={(
            <Space>
              <Button onClick={close} disabled={phase === "running"}>Cancel</Button>
              <Button type="primary" danger={spec.danger} disabled={none || blocked} loading={phase === "running"} onClick={go} data-testid="bulk.confirm">
                {none ? "Nothing to do" : `${spec.title} (${plan.apply.length.toLocaleString()})`}
              </Button>
            </Space>
          )}>
          <div className={`tpo-bulk${spec.danger ? " tpo-bulk--danger" : ""}`} data-testid="bulk.preview">
            {spec.danger && !none && (
              <Alert type="error" showIcon className="tpo-bulk__danger" data-testid="bulk.danger"
                message={`This is a serious action for ${plural(plan.apply.length, noun)}`}
                description={spec.consequence || null} />
            )}
            {!none && <Typography.Paragraph><Names rows={plan.apply} nameOf={nameOf} /></Typography.Paragraph>}
            {none && <Alert type="info" showIcon message={`None of the ${plural((spec.items || []).length, noun)} you picked can take this action.`} />}
            {skippedBlock}
            {spec.consequence && !spec.danger && <Typography.Paragraph className="tpo-bulk__consequence">{spec.consequence}</Typography.Paragraph>}
            <Typography.Text type={spec.danger && !spec.undo ? "danger" : "secondary"} strong={spec.danger && !spec.undo} className="tpo-bulk__undo-note">
              {spec.undo ? spec.undoWhen || "You can undo this straight after." : spec.undoNote || "This cannot be undone from here."}
            </Typography.Text>
            {ack && !none && (
              <Checkbox className="tpo-bulk__ack" data-testid="bulk.ack" checked={state.acked} disabled={phase === "running"}
                onChange={(e) => setState((s) => ({ ...s, acked: e.target.checked }))}>
                {ack}
              </Checkbox>
            )}
          </div>
        </Modal>
      );
    }

    const copyFailed = () => {
      const text = failed.map((f) => `${nameOf(f.item)}\t${f.reason}`).join("\n");
      navigator.clipboard?.writeText(text);
      message.success("Copied");
    };
    return (
      <Modal open title={spec.title} onCancel={close}
        footer={(
          <Space>
            {failed.length > 0 && <Button onClick={copyFailed} disabled={retrying}>Copy failed</Button>}
            {failed.length > 0 && (
              <Button onClick={retryFailed} loading={retrying} disabled={undoing} data-testid="bulk.retry-failed">
                Retry failed ({failed.length.toLocaleString()})
              </Button>
            )}
            {spec.undo && done.length > 0 && !undone && <Button onClick={undo} loading={undoing} disabled={retrying} data-testid="bulk.undo">Undo</Button>}
            <Button type="primary" onClick={close} disabled={retrying || undoing}>Close</Button>
          </Space>
        )}>
        <div className="tpo-bulk" data-testid="bulk.result">
          {undone ? (
            <Alert type="info" showIcon message={`Undone for ${plural(done.length, noun)}.`} />
          ) : done.length > 0 && (
            <Alert type="success" showIcon message={`Done for ${plural(done.length, noun)}.`} description={<Names rows={done} nameOf={nameOf} />} />
          )}
          {!undone && spec.summary && done.length > 0 && spec.summary(runRes, done) && (
            <Typography.Paragraph className="tpo-bulk__summary" data-testid="bulk.summary">{spec.summary(runRes, done)}</Typography.Paragraph>
          )}
          {failed.length > 0 && (
            <Alert type="error" showIcon className="tpo-bulk__failed" message={`Not done for ${plural(failed.length, noun)}`}
              description={<ul>{failed.slice(0, 20).map((f, i) => <li key={i}>{nameOf(f.item)}: {f.reason}</li>)}{failed.length > 20 && <li>and {(failed.length - 20).toLocaleString()} more (Copy failed lists them all)</li>}</ul>} />
          )}
          {skippedBlock}
        </div>
      </Modal>
    );
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  return [start, element];
}
