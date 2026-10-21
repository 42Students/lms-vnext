import { Alert, Button, Drawer, Skeleton, message } from "antd";
import { LinkOutlined, BugOutlined, BellOutlined, RobotOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import renderStructuredValue from "@/components/admin/projects/renderStructuredValue";
import { muteLogSignature } from "@/api/Services/SuperAdminLogsService";
import { collegeSql, pathEntities, shortCommit, userSql } from "@/utils/logReport";
import { frameLabel, frameLink, loggerSearchLink, parseAppFrames } from "@/utils/logSourceLinks";
import { singleGroupPrompt } from "@/utils/logListModel";

const show = (value) => value == null || value === "" ? "—" : String(value);

// The alerting poller only ever records a signature for ERROR-and-above entries (it queries Cloud
// Logging with severity>=ERROR) -- muting a WARNING/INFO entry would always 404 since it was never
// tracked in the first place. Gating the button on the same severities the poller itself watches
// avoids offering an action that can't do anything.
const MUTABLE_SEVERITIES = new Set(["ERROR", "CRITICAL", "ALERT", "EMERGENCY"]);

export default function TrackerLogDetailsDrawer({
  summary,
  entry,
  loading,
  error,
  open,
  onClose,
  environment,
  onReportThis,
}) {
  const [copied, setCopied] = useState("");
  const [muting, setMuting] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (!open) {
      setCopied("");
      setMuted(false);
    }
  }, [open]);

  const copy = async (value, label) => {
    if (!value || typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(label);
      setTimeout(() => setCopied(""), 1400);
    } catch (_) {}
  };

  const display = entry || summary;

  const sqlLines = useMemo(() => {
    if (!display) return [];
    const lines = [userSql(display.userType, display.userId), collegeSql(display.collegeId)];
    pathEntities(display.httpPath).forEach((e) => lines.push(e.sql));
    return lines.filter(Boolean);
  }, [display]);
  const frames = useMemo(() => parseAppFrames(entry?.exception), [entry]);

  const copyForClaude = () => {
    if (!display) return;
    const text = singleGroupPrompt([{ ...display, exception: entry?.exception || display.exception }], { environment: environment || "PRODUCTION" });
    copy(text, "claude");
  };

  const copyPermalink = () => {
    if (!display?.insertId || !display?.logName || typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("insertId", display.insertId);
    url.searchParams.set("logName", display.logName);
    url.searchParams.set("env", environment || "PRODUCTION");
    copy(url.toString(), "permalink");
  };

  const toggleMute = async () => {
    // The backend's alerting poller only ever sees the compact *summary* message (truncated at
    // 1500 chars server-side), never the fuller detail message (truncated at 8000) -- so its
    // stored signature hash was computed from that shorter string. Hashing the detail message
    // here instead would silently diverge from it for anything over 1500 chars and this would
    // always 404, even for an error the poller genuinely did record. `summary` is always the
    // same compact object the roadmap/list view already fetched, so prefer it for this specifically.
    const messageForHash = summary?.message || display?.message;
    if (!messageForHash) return;
    setMuting(true);
    try {
      await muteLogSignature({
        environment: environment || "PRODUCTION",
        message: messageForHash,
        httpPath: display.httpPath || null,
        muted: !muted,
      });
      setMuted((prev) => !prev);
      message.success(muted ? "Unmuted -- this error type is back in view." : "Muted -- this error type won't be surfaced as noise going forward.");
    } catch (e) {
      message.error(e?.response?.status === 404
        ? "This error hasn't been recorded by the alerting poller yet -- try again shortly."
        : "Could not update mute state.");
    } finally {
      setMuting(false);
    }
  };

  return (
    <Drawer
      title="Log details"
      placement="right"
      width="min(760px, 100vw)"
      open={open}
      onClose={onClose}
      destroyOnClose={false}
      className="tracker-log-drawer"
    >
      {!display ? null : (
        <div className="tracker-log-detail">
          <div className="tracker-log-detail__headline">
            <span className={"tracker-log-severity tracker-log-severity--" + String(display.severity || "default").toLowerCase()}>
              {display.severity || "DEFAULT"}
            </span>
            <strong>{display.message || "Log entry"}</strong>
          </div>

          <div className="tracker-log-detail__actions">
            <Button size="small" icon={<LinkOutlined />} onClick={copyPermalink} disabled={!display.insertId}>
              {copied === "permalink" ? "Link copied" : "Copy link"}
            </Button>
            <Button size="small" icon={<RobotOutlined />} onClick={copyForClaude} disabled={!display.message}>
              {copied === "claude" ? "Copied" : "Copy for Claude"}
            </Button>
            <Button size="small" icon={<BugOutlined />} onClick={() => onReportThis?.(display)}>
              Report this
            </Button>
            {MUTABLE_SEVERITIES.has(String(display.severity || "").toUpperCase()) && (
              <Button size="small" icon={<BellOutlined />} loading={muting} onClick={toggleMute} disabled={!display.message}>
                {muted ? "Unmute this error" : "Mute this error"}
              </Button>
            )}
          </div>

          {loading && (
            <div className="tracker-log-detail-loading">
              <Skeleton active paragraph={{ rows: 5 }} />
            </div>
          )}

          {error && (
            <Alert
              type="warning"
              showIcon
              message={error}
              description="The compact list summary is still available, but the full sanitized payload could not be loaded."
              className="tracker-alert"
            />
          )}

          <div className="tracker-log-detail__grid">
            <div><span>Timestamp</span><strong>{show(display.timestamp)}</strong></div>
            <div><span>Logger</span><strong>{show(display.logger)}</strong></div>
            <div><span>Method</span><strong>{show(display.httpMethod)}</strong></div>
            <div><span>Status</span><strong>{show(display.httpStatus)}</strong></div>
            <div><span>Duration</span><strong>{display.durationMs ? String(display.durationMs) + " ms" : "—"}</strong></div>
            <div><span>Namespace</span><strong>{show(display.namespace)}</strong></div>
            <div><span>Pod</span><strong>{show(display.pod)}</strong></div>
            <div><span>Container</span><strong>{show(display.container)}</strong></div>
            <div><span>User</span><strong>{display.userId && display.userId !== "0" ? `${String(display.userType || "user").toLowerCase()} #${display.userId}` : "—"}</strong></div>
            <div><span>Faculty type</span><strong>{show(display.facultyType)}</strong></div>
            <div><span>College</span><strong>{display.collegeId ? `#${display.collegeId}` : "—"}</strong></div>
            <div><span>Organization</span><strong>{display.organizationId ? `#${display.organizationId}` : "—"}</strong></div>
            <div><span>Release</span><strong title={display.commit || ""}>{display.commit && display.commit !== "unknown" ? shortCommit(display.commit) : "—"}</strong></div>
            {display.impersonatorId && <div><span>Impersonated by</span><strong>#{display.impersonatorId}</strong></div>}
          </div>

          {(frames.length > 0 || (!entry?.exception && display.logger)) && (
            <section className="tracker-log-detail__section">
              <div className="tracker-log-detail__section-heading"><span>Source</span></div>
              {frames.length > 0 ? (
                frames.slice(0, 3).map((f) => (
                  <div key={`${f.file}:${f.line}`}>
                    <a href={frameLink(f, display.commit && display.commit !== "unknown" ? display.commit : "prod-2026")} target="_blank" rel="noreferrer">
                      {frameLabel(f)}
                    </a>
                  </div>
                ))
              ) : (
                <a href={loggerSearchLink(display.logger)} target="_blank" rel="noreferrer">Search the repository for {String(display.logger).split(".").pop()}</a>
              )}
            </section>
          )}

          {sqlLines.length > 0 && (
            <section className="tracker-log-detail__section">
              <div className="tracker-log-detail__section-heading">
                <span>Check the data</span>
                <Button size="small" onClick={() => copy(sqlLines.join("\n"), "sql")}>
                  {copied === "sql" ? "Copied" : "Copy SQL"}
                </Button>
              </div>
              <pre>{sqlLines.join("\n")}</pre>
            </section>
          )}

          {display.httpPath && (
            <section className="tracker-log-detail__section">
              <div className="tracker-log-detail__section-heading">
                <span>Request path</span>
                <Button size="small" onClick={() => copy(display.httpPath, "path")}>
                  {copied === "path" ? "Copied" : "Copy"}
                </Button>
              </div>
              <code>{display.httpPath}</code>
            </section>
          )}

          {display.requestId && (
            <section className="tracker-log-detail__section">
              <div className="tracker-log-detail__section-heading">
                <span>Request ID</span>
                <Button size="small" onClick={() => copy(display.requestId, "request")}>
                  {copied === "request" ? "Copied" : "Copy"}
                </Button>
              </div>
              <code>{display.requestId}</code>
            </section>
          )}

          {entry?.exception && (
            <section className="tracker-log-detail__section">
              <div className="tracker-log-detail__section-heading">
                <span>Exception / stack trace</span>
                <Button size="small" onClick={() => copy(entry.exception, "exception")}>
                  {copied === "exception" ? "Copied" : "Copy"}
                </Button>
              </div>
              <pre>{entry.exception}</pre>
            </section>
          )}

          {entry?.raw && (
            <details className="tracker-log-raw">
              <summary>Sanitized raw log payload</summary>
              <div className="tracker-log-detail__section-heading">
                <span />
                <Button size="small" onClick={() => copy(JSON.stringify(entry.raw, null, 2), "raw")}>
                  {copied === "raw" ? "Copied" : "Copy as JSON"}
                </Button>
              </div>
              {renderStructuredValue(entry.raw)}
            </details>
          )}
        </div>
      )}
    </Drawer>
  );
}
