import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, InputNumber, Select, Skeleton, Space, Typography, message } from "antd";
import { PanelError } from "@/components/Common/PanelStates";
import { ListSkeleton } from "@/components/Common/Skeletons";
import Router from "next/router";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { getBatchRules, saveBatchRules } from "@/api/Services/BatchesService";

const errorText = (res, fallback) => res?.data?.error || res?.data?.message || res?.message || fallback;
const PLACED_AT = { OFFER_RELEASED: "the offer is released", OFFER_ACCEPTED: "the offer is accepted" };

/** The rules a batch can change for itself. Empty = the college's. */
const RULES = [
  { key: "countsAsPlacedAt", label: "Counts as placed when", kind: "select", options: Object.entries(PLACED_AT).map(([value, label]) => ({ value, label })), show: (v) => PLACED_AT[v] || v },
  { key: "maxHeldOffers", label: "Offers a student can hold", kind: "number", min: 1, max: 5, show: (v) => String(v) },
  { key: "upliftPct", label: "Once placed, can apply again for at least", kind: "number", min: 0, max: 200, suffix: "% more CTC", show: (v) => `${v}% more CTC` },
  { key: "minResponseHours", label: "Time to respond to an offer", kind: "number", min: 12, max: 168, suffix: "hours", show: (v) => `${v} hours` },
];

/**
 * A batch's own placement rules on top of the college's (e.g. a final-year batch that counts only accepted offers).
 * Each rule says what the college has and lets this batch use a different value; Reset goes back to the college's.
 */
export default function BatchRulesTab({ batchId, batchName }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState({});
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState("");
  const saveRef = useRef(false);
  const busyRef = useRef(false);

  const load = useCallback(async () => {
    const res = await fetchWithErrorHandling(getBatchRules(batchId));
    if (!res.success) { setError(errorText(res, "Could not load the rules")); return; }
    setError(null);
    setSaveError("");
    setData(res.data);
    setDraft(res.data?.batch || {});
  }, [batchId]);
  useEffect(() => { load(); }, [load]);

  const own = data?.batch || {};
  const changed = Boolean(data) && JSON.stringify(own) !== JSON.stringify(draft);

  useEffect(() => {
    if (!changed || busyRef.current || typeof window === "undefined") return undefined;
    const beforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const beforeRouteChange = () => {
      if (window.confirm("Discard your unsaved batch-rule changes?")) return;
      const addressBar = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (addressBar !== Router.asPath) window.history.pushState(null, "", Router.asPath);
      // eslint-disable-next-line no-throw-literal
      throw "Route change aborted to preserve unsaved batch rules.";
    };
    window.addEventListener("beforeunload", beforeUnload);
    Router.events.on("routeChangeStart", beforeRouteChange);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      Router.events.off("routeChangeStart", beforeRouteChange);
    };
  }, [changed]);

  if (error && !data) return <PanelError title={error} onRetry={load} />;
  if (!data) return <ListSkeleton rows={4} avatar={false} label="Loading batch placement rules" />;

  const set = (key, value) => setDraft((d) => {
    const next = { ...d };
    if (value === null || value === undefined || value === "" || value === data.college?.[key]) delete next[key]; else next[key] = value;
    return next;
  });
  const save = async (body) => {
    if (saveRef.current || busy) return;
    saveRef.current = true;
    setBusy(true);
    setSaveError("");
    try {
      const res = await fetchWithErrorHandling(saveBatchRules(batchId, body));
      if (!res.success) {
        const errorMessage = errorText(res, "Could not save the rules");
        setSaveError(errorMessage);
        message.error(errorMessage);
        return;
      }
      message.success(Object.keys(body).length ? `Rules saved for ${batchName}` : `${batchName} follows the college rules`);
      setData(res.data);
      setDraft(res.data?.batch || {});
    } finally {
      saveRef.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="tpo-batch-rules" data-testid="batch-rules">
      <Alert type="info" showIcon className="tpo-batch-rules__note"
        message={Object.keys(own).length ? `${batchName} has its own rules` : `${batchName} follows the college rules`}
        description="Change a rule only for this batch; everything you leave alone stays the college's. An internship offer never counts as placed." />
      {saveError ? (
        <Alert type="error" showIcon closable message="Batch rules were not saved" description={saveError}
          action={<Button size="small" onClick={() => save(draft)} disabled={busy}>Retry</Button>}
          onClose={() => setSaveError("")} style={{ marginBottom: 12 }} />
      ) : null}
      <div className="tpo-batch-rules__list">
        {RULES.map((r) => {
          const college = data.college?.[r.key];
          const value = draft[r.key];
          return (
            <div key={r.key} className={`tpo-batch-rules__row${value !== undefined ? " is-own" : ""}`}>
              <div className="tpo-batch-rules__label">
                <strong>{r.label}</strong>
                <Typography.Text type="secondary">College: {r.show(college)}</Typography.Text>
              </div>
              <Space wrap>
                {r.kind === "select" ? (
                  <Select style={{ minWidth: 220 }} value={value ?? college} options={r.options} onChange={(v) => set(r.key, v)} aria-label={r.label} />
                ) : (
                  <InputNumber min={r.min} max={r.max} value={value ?? college} onChange={(v) => set(r.key, v)} addonAfter={r.suffix} aria-label={r.label} />
                )}
                {value !== undefined && <Button size="small" type="link" onClick={() => set(r.key, undefined)}>Use the college&apos;s</Button>}
              </Space>
            </div>
          );
        })}
      </div>
      <Space wrap>
        <Button type="primary" loading={busy} disabled={!changed} onClick={() => save(draft)} data-testid="batch-rules.save">Save</Button>
        {Object.keys(own).length > 0 && <Button disabled={busy} onClick={() => save({})}>Follow the college rules</Button>}
      </Space>
    </div>
  );
}
