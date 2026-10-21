import {
  accountLabel,
  affectedLayerLabel,
  environmentLabel,
  regressionTestLabel,
  resolutionLabel,
  severityLabel,
  statusLabel,
} from "@/data/bugTrackerData";
import { formatTrackerDate, trackerLocationText } from "@/utils/bugTrackerUtils";

const clean = (value) => (typeof value === "string" ? value.trim() : value);

/** Renders one issue as paste-ready markdown (chat, PR description, ticket). Empty fields are omitted. */
export function issueToMarkdown(issue, { url, attachmentCount = 0 } = {}) {
  if (!issue) return "";
  const location = trackerLocationText(issue);
  const lines = [`## ${issue.publicId}${location ? ` — ${location}` : ""}`, ""];

  lines.push(
    `**Status:** ${statusLabel(issue.status)} · **Severity:** ${severityLabel(issue.severity)} · **Environment:** ${environmentLabel(issue.environment)}`
  );
  const reporter = [issue.reporterName, issue.accountRole ? `(${accountLabel(issue.accountRole)})` : null].filter(Boolean).join(" ");
  const when = formatTrackerDate(issue.createdAt);
  lines.push(`**Reported by:** ${reporter || "Unknown"}${when ? ` · ${when}` : ""}`);
  if (url) lines.push(`**Link:** ${url}`);

  lines.push("", "### What went wrong", clean(issue.description) || "_No description._");

  const context = [
    issue.issueType && `Issue type: ${issue.issueType}`,
    issue.sourceUrl && `Page URL: ${issue.sourceUrl}`,
    !issue.sourceUrl && issue.sourcePath && `Page path: ${issue.sourcePath}`,
    issue.browser && `Browser: ${issue.browser}${issue.viewport ? ` (${issue.viewport})` : ""}`,
    !issue.browser && issue.viewport && `Viewport: ${issue.viewport}`,
    issue.evidenceLink && `Evidence: ${issue.evidenceLink}`,
    attachmentCount > 0 && `Attachments: ${attachmentCount} (see the issue link)`,
  ].filter(Boolean);
  if (context.length) lines.push("", "### Context", ...context.map((item) => `- ${item}`));

  const engineering = [
    issue.resolution && `Resolution: ${resolutionLabel(issue.resolution)}`,
    issue.affectedLayer && `Affected layer: ${affectedLayerLabel(issue.affectedLayer)}`,
    clean(issue.rootCause) && `Root cause: ${clean(issue.rootCause)}`,
    clean(issue.fixNotes) && `Fix notes: ${clean(issue.fixNotes)}`,
    issue.frontendCommitSha && `Frontend commit: \`${issue.frontendCommitSha}\``,
    issue.backendCommitSha && `Backend commit: \`${issue.backendCommitSha}\``,
    issue.regressionTestStatus && issue.regressionTestStatus !== "NOT_REVIEWED" && `Regression test: ${regressionTestLabel(issue.regressionTestStatus)}`,
    issue.retestStatus && issue.retestStatus !== "NOT_RETESTED" && `Retest: ${issue.retestStatus.replace(/_/g, " ").toLowerCase()}`,
    issue.productionVerified && "Verified in production",
  ].filter(Boolean);
  if (engineering.length) lines.push("", "### Engineering", ...engineering.map((item) => `- ${item}`));

  return lines.join("\n");
}
