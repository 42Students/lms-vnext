import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Button, Skeleton } from "antd";
import { exportLogs } from "@/api/Services/SuperAdminLogsService";
import { parseEntries } from "@/utils/logReportSource";
import { formatOffset, issueLogWindow, rankNearbyEntries } from "@/utils/trackerIssueLogs";

const SHOWN = 8;

/**
 * For a manager: what the backend was logging in the minutes around the moment this issue was
 * filed. Fetched on demand, since it reads from Cloud Logging, and read-only.
 */
export default function IssueLogsPanel({ issue }) {
  const [state, setState] = useState({ status: "idle", entries: [], error: "" });
  const range = issueLogWindow(issue);

  useEffect(() => {
    setState({ status: "idle", entries: [], error: "" });
  }, [issue?.publicId]);

  if (!range) return null;

  async function load() {
    setState({ status: "loading", entries: [], error: "" });
    try {
      const { blob } = await exportLogs({
        environment: range.environment,
        level: "WARNING",
        search: "",
        since: range.since,
        until: range.until,
      });
      const { entries } = parseEntries(await blob.text());
      setState({ status: "done", entries: rankNearbyEntries(entries, range.at), error: "" });
    } catch (err) {
      setState({ status: "error", entries: [], error: err?.message || "Logs could not be loaded for this window." });
    }
  }

  const { status, entries, error } = state;
  const shown = entries.slice(0, SHOWN);

  return (
    <section className="tracker-detail-card tracker-issue-logs" aria-label="Logs around this report">
      <div className="tracker-issue-logs__head">
        <h2>Logs around this report</h2>
        <span>{range.environment.toLowerCase()}, 5 minutes either side</span>
      </div>

      {status === "idle" && (
        <Button onClick={load}>Load warnings and errors from that moment</Button>
      )}
      {status === "loading" && <Skeleton active paragraph={{ rows: 3 }} />}
      {status === "error" && <Alert type="error" showIcon message={error} action={<Button size="small" onClick={load}>Retry</Button>} />}

      {status === "done" && (
        entries.length === 0 ? (
          <p className="tracker-issue-logs__empty">No warnings or errors were logged around that time.</p>
        ) : (
          <>
            <ul className="tracker-issue-logs__list">
              {shown.map((entry) => (
                <li key={entry.insertId || `${entry.timestamp}-${entry.message}`}>
                  <span className={`tracker-log-severity tracker-log-severity--${String(entry.severity || "default").toLowerCase()}`}>
                    {entry.severity}
                  </span>
                  <code>{formatOffset(new Date(entry.timestamp).getTime(), range.at)}</code>
                  <span className="tracker-issue-logs__message">
                    {entry.insertId && entry.logName ? (
                      <Link href={`/tracker/logs?insertId=${encodeURIComponent(entry.insertId)}&logName=${encodeURIComponent(entry.logName)}&env=${range.environment}`}>
                        {String(entry.message || "").split("\n")[0].slice(0, 200)}
                      </Link>
                    ) : (
                      String(entry.message || "").split("\n")[0].slice(0, 200)
                    )}
                    {entry.httpPath && <small> {entry.httpMethod} {entry.httpPath}</small>}
                    {entry.userId && entry.userId !== "0" && <small> · {String(entry.userType || "user").toLowerCase()} #{entry.userId}</small>}
                  </span>
                </li>
              ))}
            </ul>
            {entries.length > SHOWN && <p className="tracker-issue-logs__empty">{entries.length - SHOWN} more in this window; open the Logs page to see them all.</p>}
          </>
        )
      )}
    </section>
  );
}
