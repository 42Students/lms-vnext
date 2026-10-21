import { useEffect, useRef, useState } from "react";
import { Alert, Button, Modal, Progress, Segmented, Switch, message } from "antd";
import { CopyOutlined, DownloadOutlined, FileTextOutlined } from "@ant-design/icons";
import {
  exportLogs,
  getDeployHealth,
  getDeploys,
  getKnownErrors,
  getLogContext,
} from "@/api/Services/SuperAdminLogsService";
import { listBugReports } from "@/api/Services/BugTrackerService";
import { generateReport } from "@/utils/logReportSource";
import { copyTextToClipboard } from "@/utils/bugTrackerUtils";
import { downloadText } from "@/utils/downloadText";

const RANGES = [
  { value: "6H", label: "6 hours", ms: 6 * 3_600_000 },
  { value: "24H", label: "24 hours", ms: 24 * 3_600_000 },
  { value: "3D", label: "3 days", ms: 3 * 86_400_000 },
  { value: "7D", label: "7 days", ms: 7 * 86_400_000 },
];

const PHASE_LABEL = {
  logs: "Fetching logs",
  context: "Looking up names, deploys and open issues",
  previous: "Comparing with the previous period",
  building: "Writing the report",
};

const api = { exportLogs, getKnownErrors, getDeploys, getDeployHealth, getLogContext, listBugReports };

/**
 * One click from "something is wrong" to a file Claude can act on: fetches the range in pieces,
 * groups the errors, attaches what the backend already decided about each, names the users and
 * colleges hit, and hands back a markdown report (plus the raw lines as an appendix).
 */
export default function ClaudeReportModal({ open, onClose, environment }) {
  const [range, setRange] = useState("24H");
  const [level, setLevel] = useState("ERROR");
  const [comparePrevious, setComparePrevious] = useState(true);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!open) {
      cancelledRef.current = true;
      setRunning(false);
      setProgress(null);
      setError("");
      setResult(null);
    }
  }, [open]);

  const rangeMs = RANGES.find((r) => r.value === range).ms;

  async function build() {
    cancelledRef.current = false;
    setRunning(true);
    setError("");
    setResult(null);
    setProgress({ phase: "logs", done: 0, total: 1 });
    const until = new Date();
    const since = new Date(until.getTime() - rangeMs);
    try {
      const generated = await generateReport({
        environment,
        level,
        since: since.toISOString(),
        until: until.toISOString(),
        includePrevious: comparePrevious && rangeMs <= 24 * 3_600_000,
        api,
        onProgress: setProgress,
        isCancelled: () => cancelledRef.current,
      });
      if (!cancelledRef.current) setResult(generated);
    } catch (err) {
      if (!cancelledRef.current) {
        setError(err?.message || "The report could not be built. Try a shorter range.");
      }
    } finally {
      setRunning(false);
    }
  }

  function cancel() {
    cancelledRef.current = true;
    setRunning(false);
    setProgress(null);
  }

  const percent =
    progress && progress.total ? Math.min(100, Math.round(((progress.done || 0) / progress.total) * 100)) : 0;
  const phaseText = progress
    ? `${PHASE_LABEL[progress.phase] || "Working"}${progress.phase === "logs" && progress.total > 1 ? ` (${progress.done} of ${progress.total})` : "…"}`
    : "";

  async function copyReport() {
    try {
      await copyTextToClipboard(result.markdown);
      message.success("Report copied. Paste it into Claude.");
    } catch {
      message.error("Could not copy here; use Download instead.");
    }
  }

  const model = result?.model;

  return (
    <Modal
      open={open}
      onCancel={running ? undefined : onClose}
      title="Report for Claude"
      footer={null}
      width={620}
      destroyOnClose
      wrapClassName="tracker-popover-scope"
      maskClosable={!running}
    >
      <p className="tracker-report__lead">
        Builds one file with the grouped errors, who and where each one hit, what was already decided about it, and
        instructions. Hand it to Claude and it takes it from there.
      </p>

      <div className="tracker-report__options">
        <div>
          <span className="tracker-report__label">Range ({environment.toLowerCase()})</span>
          <Segmented
            value={range}
            onChange={setRange}
            disabled={running}
            options={RANGES.map((r) => ({ value: r.value, label: r.label }))}
          />
        </div>
        <div>
          <span className="tracker-report__label">Include</span>
          <Segmented
            value={level}
            onChange={setLevel}
            disabled={running}
            options={[
              { value: "ERROR", label: "Errors" },
              { value: "WARNING", label: "Warnings + errors" },
            ]}
          />
        </div>
        {rangeMs <= 24 * 3_600_000 && (
          <label className="tracker-report__toggle">
            <Switch size="small" checked={comparePrevious} onChange={setComparePrevious} disabled={running} />
            <span>Compare with the previous {range === "6H" ? "6 hours" : "24 hours"}</span>
          </label>
        )}
      </div>

      {rangeMs > 24 * 3_600_000 && !running && !result && (
        <Alert
          type="info"
          showIcon
          message="Longer ranges are fetched in 6-hour pieces, so they take a minute or two."
          className="tracker-report__note"
        />
      )}

      {running && (
        <div className="tracker-report__progress" aria-live="polite">
          <Progress percent={percent} status="active" showInfo={false} />
          <span>{phaseText}</span>
          <Button size="small" onClick={cancel}>Cancel</Button>
        </div>
      )}

      {error && <Alert type="error" showIcon message={error} className="tracker-report__note" />}

      {!running && !result && (
        <Button type="primary" icon={<FileTextOutlined />} onClick={build} block size="large">
          Build report
        </Button>
      )}

      {result && model && (
        <div className="tracker-report__result">
          <div className="tracker-report__stats">
            <div><strong>{model.totalEvents}</strong><span>error events</span></div>
            <div><strong>{model.groups.length}</strong><span>error types</span></div>
            <div className={model.newTypes ? "is-alert" : ""}><strong>{model.newTypes}</strong><span>new</span></div>
            <div className={model.regressions ? "is-alert" : ""}><strong>{model.regressions}</strong><span>regressions</span></div>
          </div>

          {model.truncated && (
            <Alert
              type="warning"
              showIcon
              message="Some entries were cut off"
              description="This range had more entries than one export can hold. Counts are a lower bound; try a shorter range."
              className="tracker-report__note"
            />
          )}

          <div className="tracker-report__actions">
            <Button type="primary" icon={<DownloadOutlined />} onClick={() => downloadText(result.filename, result.markdown, "text/markdown")}>
              Download report (.md)
            </Button>
            <Button icon={<CopyOutlined />} onClick={copyReport}>Copy report</Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => downloadText(result.filename.replace(/\.md$/, ".ndjson"), result.rawText, "application/x-ndjson")}
            >
              Raw lines (.ndjson)
            </Button>
          </div>

          <details className="tracker-report__preview">
            <summary>Preview</summary>
            <pre>{result.markdown.split("\n").slice(0, 70).join("\n")}</pre>
          </details>

          <Button type="link" onClick={() => setResult(null)}>Build another</Button>
        </div>
      )}
    </Modal>
  );
}
