import { Tag, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

// RecruiterLead stages (TPO V1 - Locked.docx §3). New / Contacted / Not now are set by hand; the rest are worked out from facts on the server.
export const STAGES = {
  // [label, tone]: the tone of the shared status badge (the same pills as batch states and applicant stages).
  NEW: ["New", "neutral"], CONTACTED: ["Contacted", "info"], INVITED: ["Invited", "info"], JOINED: ["Joined", "success"],
  DRIVE_PLANNED: ["Drive planned", "info"], RECRUITED: ["Recruited", "success"], NOT_NOW: ["Not now", "warning"],
};

/**
 * UI/UX audit, buy-signal extra "Making existing automation visible" (2026-10-01): Joined, Drive
 * planned and Recruited were already worked out from facts (a recruiter accepting an invite, a
 * drive existing, an offer being accepted) with zero TPO action - but the stage chip looked
 * exactly like a hand-set one, so the automation the product already does was invisible. This is
 * the same distinction the comment above (and TpoRecruiterLeadsHubService's own docstring) already states;
 * it just never reached the UI.
 */
const AUTO_EXPLAIN = {
  JOINED: "Automatic: the recruiter accepted your invite.",
  DRIVE_PLANNED: "Automatic: this company now has a drive with this college.",
  RECRUITED: "Automatic: a student accepted an offer from this company.",
};

/** The stage chip, with a small "why" tooltip on the stages the system worked out by itself. */
export function StageTag({ stage }) {
  const entry = STAGES[stage] || [stage, "neutral"];
  const [label, tone] = entry;
  const explain = AUTO_EXPLAIN[stage];
  // Same markup as StatusBadge (components/Common/PanelStates), with the automatic stages' info icon after the label.
  const badge = (
    <Tag className={`lms-status-badge lms-status-badge--${tone}`} data-status={String(stage || "").toLowerCase()}>
      <span className="lms-status-badge__dot" aria-hidden="true" />
      <span>{label}{explain ? <> <InfoCircleOutlined style={{ fontSize: 10 }} /></> : null}</span>
    </Tag>
  );
  return explain ? <Tooltip title={explain}>{badge}</Tooltip> : badge;
}
