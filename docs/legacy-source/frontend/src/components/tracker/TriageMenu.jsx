import { useState } from "react";
import { Button, Dropdown, Input, Modal, message } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import {
  getCloudLogDetail,
  getLogContext,
  linkKnownErrorIssue,
  muteKnownError,
  setKnownErrorStatus,
} from "@/api/Services/SuperAdminLogsService";
import { createBugReport } from "@/api/Services/BugTrackerService";
import { copyTextToClipboard } from "@/utils/bugTrackerUtils";
import { attachSignatures, contextRequestFor } from "@/utils/logReportSource";
import { issuePayloadFor, singleGroupPrompt } from "@/utils/logListModel";
import { buildReportModel, shortCommit } from "@/utils/logReport";

const MODAL_COPY = {
  fixed: { title: "Mark as fixed", okText: "Mark fixed", noteLabel: "Note (optional)", needsCommit: true },
  expected: { title: "Mark as expected", okText: "Mark expected", noteLabel: "Why is this expected?", needsNote: true },
  mute: { title: "Mute this error", okText: "Mute", noteLabel: "Why mute it? It comes back on its own if it spikes.", needsNote: true },
};

/**
 * What can be done about one error group, in one place: hand it to Claude, get its SQL, open a
 * tracker issue, or record the decision (fixed in a commit / expected / muted) so the next report
 * and the daily digest already know.
 */
export default function TriageMenu({ group, known, environment, deploys, onChanged }) {
  const [busy, setBusy] = useState("");
  const [mode, setMode] = useState(null);
  const [commit, setCommit] = useState("");
  const [note, setNote] = useState("");

  const entry = group.entry;
  const tracked = Boolean(known && known.id);
  const trackedHint = "Tracked once the alerting poller has seen it (production errors).";

  async function occurrencesWithDetail() {
    let occurrences = group.occurrences || [entry];
    if (entry.insertId && entry.logName) {
      try {
        const detail = await getCloudLogDetail({ environment, insertId: entry.insertId, logName: entry.logName });
        occurrences = occurrences.map((e, i) => (i === 0 ? { ...e, ...detail } : e));
      } catch {
        // The compact list entries are enough; the stack trace is a bonus.
      }
    }
    const sample = occurrences.slice(0, 200).map((e) => ({ ...e }));
    await attachSignatures(sample);
    return sample;
  }

  async function copyForClaude() {
    setBusy("claude");
    try {
      const occurrences = await occurrencesWithDetail();
      const context = await getLogContext(contextRequestFor(occurrences)).catch(() => ({ users: [], colleges: [] }));
      const text = singleGroupPrompt(occurrences, { environment, knownErrors: known ? [known] : [], context, deploys });
      await copyTextToClipboard(text);
      message.success("Copied. Paste it into Claude.");
    } catch {
      message.error("Could not copy here. Open the error and copy from there.");
    } finally {
      setBusy("");
    }
  }

  async function copySql() {
    setBusy("sql");
    try {
      const occurrences = await occurrencesWithDetail();
      const times = occurrences.map((e) => new Date(e.timestamp).getTime()).filter(Number.isFinite);
      const model = buildReportModel({
        entries: occurrences,
        since: new Date(Math.min(...times)).toISOString(),
        until: new Date(Math.max(...times) + 1000).toISOString(),
        environment,
      });
      const lines = model.groups[0]?.sqlLines || [];
      if (!lines.length) {
        message.info("No user, college or record ids on this error, so there is no SQL to suggest.");
      } else {
        await copyTextToClipboard(lines.join("\n"));
        message.success(`Copied ${lines.length} SQL line${lines.length === 1 ? "" : "s"}.`);
      }
    } catch {
      message.error("Could not copy here.");
    } finally {
      setBusy("");
    }
  }

  async function createIssue() {
    setBusy("issue");
    try {
      const url = new URL(window.location.href);
      url.search = "";
      if (entry.insertId && entry.logName) {
        url.searchParams.set("insertId", entry.insertId);
        url.searchParams.set("logName", entry.logName);
        url.searchParams.set("env", environment);
      }
      const issue = await createBugReport(issuePayloadFor(group, { environment, permalink: url.toString() }));
      let linked = false;
      if (tracked && issue?.publicId) {
        linked = await linkKnownErrorIssue(known.id, issue.publicId).then(() => true, () => false);
      }
      if (tracked && !linked) {
        // BE-0063: the issue exists but the link to this error did not save; say so instead of claiming both.
        message.warning(`Created ${issue?.publicId || "the issue"}, but it could not be linked to this error. Link it from the issue, or try again.`);
      } else {
        message.success(`Created ${issue?.publicId || "the issue"}${tracked ? " and linked it to this error" : ""}.`);
      }
      onChanged?.();
    } catch (err) {
      message.error(err?.message || "Could not create the issue.");
    } finally {
      setBusy("");
    }
  }

  async function reopen() {
    setBusy("status");
    try {
      await setKnownErrorStatus(known.id, { status: "OPEN" });
      if (known.muted) await muteKnownError(known.id, false);
      message.success("Reopened.");
      onChanged?.();
    } catch {
      message.error("Could not update this error.");
    } finally {
      setBusy("");
    }
  }

  function openModal(next) {
    setMode(next);
    setNote("");
    setCommit(next === "fixed" ? shortCommit(deploys?.[0]?.commit || entry.commit || "") : "");
  }

  async function submitModal() {
    const copy = MODAL_COPY[mode];
    if ((copy.needsNote && !note.trim()) || (copy.needsCommit && !commit.trim())) return;
    setBusy("status");
    try {
      if (mode === "fixed") await setKnownErrorStatus(known.id, { status: "FIXED", commit: commit.trim(), note: note.trim() || null });
      if (mode === "expected") await setKnownErrorStatus(known.id, { status: "EXPECTED", note: note.trim() });
      if (mode === "mute") await muteKnownError(known.id, true, note.trim());
      message.success("Saved.");
      setMode(null);
      onChanged?.();
    } catch {
      message.error("Could not save that.");
    } finally {
      setBusy("");
    }
  }

  const items = [
    { key: "claude", label: "Copy for Claude", onClick: copyForClaude },
    { key: "sql", label: "Copy SQL to check the data", onClick: copySql },
    { key: "issue", label: known?.issuePublicId ? `Create another issue (has ${known.issuePublicId})` : "Create tracker issue", onClick: createIssue },
    { type: "divider", key: "d1" },
    ...(tracked
      ? [
          { key: "fixed", label: "Mark fixed…", onClick: () => openModal("fixed") },
          { key: "expected", label: "Mark expected…", onClick: () => openModal("expected") },
          known.muted
            ? { key: "unmute", label: "Unmute", onClick: reopen }
            : { key: "mute", label: "Mute with a reason…", onClick: () => openModal("mute") },
          ...(known.fixStatus !== "OPEN" || known.regressedAt ? [{ key: "reopen", label: "Reopen", onClick: reopen }] : []),
        ]
      : [{ key: "hint", label: trackedHint, disabled: true }]),
  ];

  const copy = mode ? MODAL_COPY[mode] : null;

  return (
    <>
      <Dropdown menu={{ items }} trigger={["click"]} overlayClassName="tracker-popover-scope">
        <Button
          size="small"
          icon={<MoreOutlined />}
          loading={Boolean(busy)}
          aria-label="Triage actions"
          onClick={(event) => event.stopPropagation()}
        >
          Triage
        </Button>
      </Dropdown>
      <Modal
        open={Boolean(mode)}
        title={copy?.title}
        okText={copy?.okText}
        onOk={submitModal}
        onCancel={() => setMode(null)}
        okButtonProps={{
          loading: busy === "status",
          disabled: copy && ((copy.needsNote && !note.trim()) || (copy.needsCommit && !commit.trim())),
        }}
        destroyOnClose
        wrapClassName="tracker-popover-scope"
      >
        {copy?.needsCommit && (
          <label className="tracker-triage__field">
            <span>Fixed in commit</span>
            <Input value={commit} onChange={(e) => setCommit(e.target.value)} placeholder="e.g. abc1234" maxLength={64} />
            <small>If it shows up again on this release, or a day later, it is flagged as a regression.</small>
          </label>
        )}
        <label className="tracker-triage__field">
          <span>{copy?.noteLabel}</span>
          <Input.TextArea rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={255} />
        </label>
      </Modal>
    </>
  );
}
