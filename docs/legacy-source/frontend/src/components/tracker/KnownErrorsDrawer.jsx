import { Alert, Drawer, Empty, Input, Modal, Skeleton, Switch, Tag, message } from "antd";
import { useEffect, useState } from "react";
import { getKnownErrors, muteKnownError } from "@/api/Services/SuperAdminLogsService";
import { statusChip } from "@/utils/logListModel";
import { shortCommit } from "@/utils/logReport";

const show = (value) => (value == null || value === "" ? "—" : String(value));
const TONE_COLOR = { danger: "red", success: "green", warning: "orange", muted: "default" };

/**
 * Every tracked error signature for an environment ("known errors"), not just whatever happens to
 * be in the current live log window -- lets an admin find and mute a known-noisy error even after
 * it's scrolled out of the recent log view, see what was decided about it (fixed in a commit,
 * expected, muted and why, linked issue), and see blast radius (distinct accounts hit) where it's
 * known.
 */
export default function KnownErrorsDrawer({ open, onClose, environment }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [mutingId, setMutingId] = useState(null);
  const [pendingMute, setPendingMute] = useState(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    getKnownErrors(environment)
      .then((data) => {
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load known errors.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, environment]);

  async function applyMute(row, muted, why) {
    setMutingId(row.id);
    try {
      await muteKnownError(row.id, muted, why);
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, muted, mutedReason: muted ? why : null } : r)));
      message.success(muted ? "Muted" : "Unmuted");
    } catch {
      message.error("Could not update mute state.");
    } finally {
      setMutingId(null);
    }
  }

  function handleToggleMute(row, checked) {
    if (checked) {
      setPendingMute(row);
      setReason("");
    } else {
      applyMute(row, false);
    }
  }

  return (
    <Drawer title="Known errors" open={open} onClose={onClose} width={580} destroyOnClose rootClassName="tracker-popover-scope">
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      {loading && <Skeleton active paragraph={{ rows: 6 }} />}
      {!loading && !error && rows.length === 0 && <Empty description="No tracked errors yet" />}
      {!loading &&
        rows.map((row) => {
          const chip = statusChip(row);
          return (
            <div
              key={row.id}
              style={{
                border: "1px solid var(--t-border, #e5e7eb)",
                borderRadius: 8,
                padding: "10px 12px",
                marginBottom: 10,
              }}
            >
              <div style={{ fontFamily: "monospace", fontSize: 12, marginBottom: 6, wordBreak: "break-word" }}>
                {show(row.sampleMessage)}
              </div>
              {row.samplePath && <div style={{ fontSize: 11, marginBottom: 6, opacity: 0.75 }}>{row.samplePath}</div>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {chip && <Tag color={TONE_COLOR[chip.tone]} title={chip.title}>{chip.label}</Tag>}
                <Tag>{row.occurrenceCount} occurrence{row.occurrenceCount === 1 ? "" : "s"}</Tag>
                {row.distinctAccountCount != null && (
                  <Tag color="blue">{row.distinctAccountCount} account{row.distinctAccountCount === 1 ? "" : "s"} hit</Tag>
                )}
                {row.lastSeenCommit && <Tag>release {shortCommit(row.lastSeenCommit)}</Tag>}
                <Tag>First seen {show(row.firstSeenAt && new Date(row.firstSeenAt).toLocaleString())}</Tag>
                <Tag>Last seen {show(row.lastSeenAt && new Date(row.lastSeenAt).toLocaleString())}</Tag>
                {row.issuePublicId && (
                  <a href={`/tracker/issues/${row.issuePublicId}`}><Tag color="geekblue">{row.issuePublicId}</Tag></a>
                )}
              </div>
              {(row.statusNote || row.mutedReason) && (
                <div style={{ fontSize: 12, marginBottom: 8 }}>
                  {row.statusNote && <div>Note: {row.statusNote}</div>}
                  {row.mutedReason && <div>Muted because: {row.mutedReason}</div>}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>Muted</span>
                <Switch
                  size="small"
                  checked={!!row.muted}
                  loading={mutingId === row.id}
                  onChange={(checked) => handleToggleMute(row, checked)}
                />
              </div>
            </div>
          );
        })}

      <Modal
        open={Boolean(pendingMute)}
        title="Mute this error"
        okText="Mute"
        onCancel={() => setPendingMute(null)}
        onOk={() => {
          const row = pendingMute;
          setPendingMute(null);
          applyMute(row, true, reason.trim());
        }}
        okButtonProps={{ disabled: !reason.trim() }}
        destroyOnClose
        wrapClassName="tracker-popover-scope"
      >
        <p>Why is it safe to ignore? It comes back on its own if it suddenly spikes.</p>
        <Input.TextArea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={255} />
      </Modal>
    </Drawer>
  );
}
