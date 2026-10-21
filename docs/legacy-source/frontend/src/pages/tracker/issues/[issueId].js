import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Image, Select, Skeleton, message } from "antd";
import { CopyOutlined, FileMarkdownOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import TrackerShell from "@/components/tracker/TrackerShell";
import { SeverityPill, StatusPill } from "@/components/tracker/TrackerPill";
import EngineeringDetails from "@/components/tracker/EngineeringDetails";
import RetestCard from "@/components/tracker/RetestCard";
import IssueLogsPanel from "@/components/tracker/IssueLogsPanel";
import ActivityTimeline from "@/components/tracker/ActivityTimeline";
import {
  getBugReport,
  listBugActivity,
  listBugAttachments,
  updateBugStatus,
} from "@/api/Services/BugTrackerService";
import {
  STATUS_OPTIONS, accountLabel, environmentLabel, severityLabel, statusLabel,
  resolutionLabel,
} from "@/data/bugTrackerData";
import { copyTextToClipboard, formatTrackerDate, isTrackerManagerClientHint, trackerLocationText } from "@/utils/bugTrackerUtils";
import { issueToMarkdown } from "@/utils/trackerMarkdown";

function TrackerIssueDetailBody() {
  const router = useRouter();
  const [issue, setIssue] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [attachmentError, setAttachmentError] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  // null (not false) until the post-mount check runs: false would render the read-only pill first
  // and then visibly swap to the editable Select a moment later for an actual admin -- a real
  // localStorage read can't happen during SSR, so this can't be resolved synchronously without a
  // server/client markup mismatch. A brief neutral placeholder beats a flash of the wrong widget.
  const [isManager, setIsManager] = useState(null);

  useEffect(() => {
    setIsManager(isTrackerManagerClientHint());
  }, []);

  const refreshActivity = useCallback(async (issueId) => {
    if (!issueId) return;
    try {
      const items = await listBugActivity(issueId);
      setActivity(Array.isArray(items) ? items : []);
    } catch (_) {
      // Activity is secondary. Never break issue details if history is temporarily unavailable.
    }
  }, []);

  useEffect(() => {
    if (!router.isReady || !router.query.issueId) return undefined;
    const controller = new AbortController();
    const issueId = router.query.issueId;
    setFetching(true);
    setError("");
    setAttachmentError("");

    getBugReport(issueId, controller.signal)
      .then(setIssue)
      .catch((err) => {
        if (err?.name !== "AbortError") setError(err?.message || "Issue could not be loaded.");
      })
      .finally(() => setFetching(false));

    listBugAttachments(issueId, controller.signal)
      .then((items) => setAttachments(Array.isArray(items) ? items : []))
      .catch((err) => {
        if (err?.name !== "AbortError") {
          setAttachmentError("Screenshots could not be loaded right now.");
        }
      });

    listBugActivity(issueId, controller.signal)
      .then((items) => setActivity(Array.isArray(items) ? items : []))
      .catch(() => {});

    return () => controller.abort();
  }, [router.isReady, router.query.issueId]);

  const applyIssueUpdate = (updated) => {
    setIssue(updated);
    refreshActivity(updated?.publicId);
  };

  const copyIssueLink = async () => {
    if (!issue) return;
    try {
      await copyTextToClipboard(`${window.location.origin}/tracker/issues/${issue.publicId}`);
      message.success(`Link to ${issue.publicId} copied`);
    } catch {
      message.error("Could not copy the link — copy it from the address bar instead.");
    }
  };

  const copyIssueMarkdown = async () => {
    if (!issue) return;
    try {
      await copyTextToClipboard(
        issueToMarkdown(issue, {
          url: `${window.location.origin}/tracker/issues/${issue.publicId}`,
          attachmentCount: attachments.length,
        })
      );
      message.success(`${issue.publicId} copied as markdown`);
    } catch {
      message.error("Could not copy to the clipboard in this browser.");
    }
  };

  const changeStatus = async (nextStatus) => {
    if (!issue || savingStatus || nextStatus === issue.status) return;
    setSavingStatus(true);
    try {
      const updated = await updateBugStatus(issue.publicId, nextStatus);
      applyIssueUpdate(updated);
      message.success(`${issue.publicId} moved to ${statusLabel(nextStatus)}`);
    } catch (err) {
      message.error(err?.message || "Status could not be updated.");
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <>
      <Head><title>{issue?.publicId ? `${issue.publicId} · 42 Tracker` : "Issue · 42 Tracker"}</title></Head>
      <TrackerShell active="issues">
        <div className="tracker-detail-wrap">
          <Link href="/tracker/issues" className="tracker-back-link">← All issues</Link>

          {error && <Alert type="error" showIcon message={error} className="tracker-alert" />}
          {fetching && !issue ? (
            <section className="tracker-detail-card"><Skeleton active paragraph={{ rows: 8 }} /></section>
          ) : issue ? (
            <>
              <header className="tracker-detail-heading">
                <div>
                  <div className="tracker-detail-heading__id">
                    <span>{issue.publicId}</span>
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      aria-label="Copy link to this issue"
                      title="Copy link to this issue"
                      onClick={copyIssueLink}
                      className="tracker-copy-link"
                    />
                    <Button
                      type="text"
                      icon={<FileMarkdownOutlined />}
                      aria-label="Copy this issue as markdown"
                      title="Copy as markdown"
                      onClick={copyIssueMarkdown}
                      className="tracker-copy-link"
                    />
                    <SeverityPill value={issue.severity} />
                    <StatusPill value={issue.status} />
                    {issue.resolution && (
                      <span className="tracker-resolution-pill">{resolutionLabel(issue.resolution)}</span>
                    )}
                  </div>
                  <h1>{trackerLocationText(issue)}</h1>
                  <p>Reported by {issue.reporterName} · {formatTrackerDate(issue.createdAt)}</p>
                </div>

                <div className="tracker-status-control">
                  <label htmlFor="tracker-status">Status</label>
                  {isManager === null ? (
                    <Skeleton.Input active size="small" style={{ width: 140 }} />
                  ) : isManager ? (
                    <Select
                      id="tracker-status"
                      value={issue.status}
                      options={STATUS_OPTIONS}
                      loading={savingStatus}
                      disabled={savingStatus}
                      onChange={changeStatus}
                    />
                  ) : (
                    <StatusPill value={issue.status} />
                  )}
                </div>
              </header>

              {isManager && <RetestCard issue={issue} onRetested={applyIssueUpdate} />}

              <section className="tracker-detail-card tracker-description-card">
                <p className="tracker-eyebrow">What went wrong</p>
                <div className="tracker-description">{issue.description}</div>
              </section>

              {(attachments.length > 0 || issue.evidenceLink || attachmentError) && (
                <section className="tracker-detail-card">
                  <p className="tracker-eyebrow">Evidence</p>
                  {attachmentError && <div className="tracker-evidence-warning">{attachmentError}</div>}
                  {attachments.length > 0 && (
                    <Image.PreviewGroup>
                      <div className="tracker-evidence-grid">
                        {attachments.map((attachment, index) => (
                          attachment.url ? (
                            <div key={attachment.id || index} className="tracker-evidence-image">
                              <Image
                                src={attachment.url}
                                alt={attachment.originalFilename || `Screenshot ${index + 1}`}
                                loading="lazy"
                              />
                              <span>{attachment.originalFilename || `Screenshot ${index + 1}`}</span>
                            </div>
                          ) : (
                            <div key={attachment.id || index} className="tracker-evidence-image is-unavailable">
                              <span>{attachment.originalFilename || `Screenshot ${index + 1}`}</span>
                              <small>Preview unavailable</small>
                            </div>
                          )
                        ))}
                      </div>
                    </Image.PreviewGroup>
                  )}
                  {issue.evidenceLink && (
                    <a href={issue.evidenceLink} target="_blank" rel="noreferrer" className="tracker-evidence-link">
                      Open linked evidence ↗
                    </a>
                  )}
                </section>
              )}

              <section className="tracker-detail-card">
                <div className="tracker-detail-grid">
                  <div><span>Reporter</span><strong>{issue.reporterName}</strong></div>
                  <div><span>Account</span><strong>{accountLabel(issue.accountRole)}</strong></div>
                  <div><span>Environment</span><strong>{environmentLabel(issue.environment)}</strong></div>
                  <div><span>Issue type</span><strong>{issue.issueType}</strong></div>
                  <div><span>Severity</span><strong>{severityLabel(issue.severity)}</strong></div>
                  <div><span>Status</span><strong>{statusLabel(issue.status)}</strong></div>
                </div>
              </section>

              {isManager && <IssueLogsPanel issue={issue} />}
              {isManager && <EngineeringDetails issue={issue} onSaved={applyIssueUpdate} />}
              <ActivityTimeline items={activity} />
            </>
          ) : null}
        </div>
      </TrackerShell>
    </>
  );
}

// BE-0059/BE-0060: moving from one issue to another (same page template) starts afresh, so the last issue's details,
// attachments and late log results can't show under the new one.
export default function TrackerIssueDetailPage() {
  const { issueId } = useRouter().query;
  return <TrackerIssueDetailBody key={issueId ?? "none"} />;
}

TrackerIssueDetailPage.nolayout = true;
