import { Card, Typography } from "antd";

const STAGE_LABELS = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  ASSESSMENT: "Test",
  INTERVIEW: "Interview",
  OFFERED: "Offered",
  HIRED: "Placed",
};

/**
 * The drive's hero visual (Placements UX pass, inspired by how the category's leading
 * platforms — Superset, Handshake — put the whole pipeline in one glanceable strip instead
 * of scattering counts across tabs). Backed by TpoWorkspaceService.funnel's cumulative
 * "how many EVER reached this stage" counts (job_application_status_history), never the
 * current-status snapshot — a snapshot funnel is non-monotonic and reads as broken (a later
 * stage can look bigger than an earlier one).
 *
 * Each stage is also a clickable chip below the chart (onStageClick), so "Interview: 12" is
 * both a number and a way to jump straight to the Applicants tab filtered to that stage —
 * chips rather than in-chart click handling keeps this robust across chart-library versions.
 */
// Plain words; "Test" and "Placed" are what the rest of the app says (UX audit, 19 Oct 2026). A test stage nobody reached is left out.
const DEFAULT_NOTE = "Everyone who reached each stage, including those who later dropped out. Percentages are of everyone who applied.";

export default function DrivePipeline({ funnel, onStageClick, title = "Drive pipeline", note = DEFAULT_NOTE, testId = "tpo.drive.pipeline", bare = false }) {
  if (!Array.isArray(funnel) || funnel.length === 0) return null;
  const rows = funnel.map((f) => ({ stage: STAGE_LABELS[f.stage] || f.stage, count: Number(f.count) || 0, key: f.stage })).filter((r) => !(r.key === "ASSESSMENT" && r.count === 0));
  const applied = rows[0]?.count || 0;
  if (applied === 0) return null;
  // Percent of the first stage only makes sense when no later stage is bigger (a drive's own pipeline always is). The company funnel is not:
  // most drives come from companies that were never recruiter leads, so "11 drives of 1 recruiter lead" would read 1100%. Then bars scale to the biggest stage and no % is shown.
  const biggest = Math.max(...rows.map((r) => r.count), 1);
  const monotonic = rows.every((r) => r.count <= applied);

  const content = (
    <>
      <div className="tpo-drive-pipeline__rows" role="list" aria-label="Pipeline stages">
        {rows.map((r) => {
          const pct = applied > 0 ? Math.round((r.count / applied) * 100) : 0;
          const bar = Math.round((r.count / (monotonic ? applied : biggest)) * 100);
          return (
            <button
              key={r.key}
              type="button"
              className="tpo-drive-pipeline__row"
              onClick={() => onStageClick?.(r.key)}
              role="listitem"
            >
              <span className="tpo-drive-pipeline__row-label">{r.stage}</span>
              <span className="tpo-drive-pipeline__row-track" aria-hidden="true"><i style={{ width: `${Math.max(r.count ? 2 : 0, bar)}%` }} /></span>
              <span className="tpo-drive-pipeline__row-count">{r.count}</span>
              <span className="tpo-drive-pipeline__row-pct">{monotonic && r.key !== rows[0].key ? `${pct}%` : ""}</span>
            </button>
          );
        })}
      </div>
      <Typography.Text type="secondary" className="tpo-drive-pipeline__note">
        {note}
      </Typography.Text>
    </>
  );
  // Inside another card (the recruiter's drive page) the pipeline is bare: no second border and no repeated title.
  if (bare) return <div className="tpo-drive-pipeline tpo-drive-pipeline--bare" data-testid={testId}>{content}</div>;
  return (
    <Card title={title} className="tpo-drive-pipeline" data-testid={testId}>
      {content}
    </Card>
  );
}
