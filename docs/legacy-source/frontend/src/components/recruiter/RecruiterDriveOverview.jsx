import { Button, Card, Tag, Typography } from "antd";
import { safeHref } from "@/utils/safeHref";
import RichTextDisplay from "@/components/Global/RichTextEditor/RichTextDisplay";
import moment from "moment";
import { momentFromApi } from "@/utils/placementDateTime";
import DrivePipeline from "@/components/tpo/drive/DrivePipeline";
import { DRIVE_STEPS, driveNextAction, driveProgress } from "@/components/recruiter/recruiterRoutes";

/** The progress strip: where this drive is, in the six steps every drive goes through. */
export function DriveProgressStrip({ drive, rounds }) {
  const at = driveProgress(drive, rounds);
  const closed = ["REJECTED", "CANCELLED"].includes(drive?.lifecycle);
  return (
    <ol className="recruiter-strip" aria-label="Drive progress" data-testid="recruiter.drive.strip">
      {DRIVE_STEPS.map((step, i) => {
        const state = closed && i >= at ? "off" : i < at ? "done" : i === at ? "now" : "todo";
        return (
          <li key={step} className={`recruiter-strip__step recruiter-strip__step--${state}`} aria-current={state === "now" ? "step" : undefined}>
            <span className="recruiter-strip__bar" />
            <span className="recruiter-strip__label">{step}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** "Next": the one thing to do on this drive, or a plain sentence saying it is waiting on someone else. */
export function DriveNextCard({ drive, rounds, applicantCount, onAction }) {
  const next = driveNextAction(drive, rounds, applicantCount);
  return (
    <Card className={`recruiter-next ${next.label ? "recruiter-next--act" : ""}`} data-testid="recruiter.drive.next">
      <div>
        <Typography.Text className="recruiter-v2__eyebrow">{next.label ? "Next" : "Status"}</Typography.Text>
        <Typography.Text strong className="recruiter-next__title">{next.label || next.detail}</Typography.Text>
        {next.label && <Typography.Text type="secondary">{next.detail}</Typography.Text>}
        {drive?.lifecycle === "SENT_BACK" && drive.sentBackNote && <Typography.Text className="recruiter-next__note" data-testid="recruiter.drive.sentback-note">“{drive.sentBackNote}”</Typography.Text>}
      </div>
      {next.label && <Button type="primary" onClick={() => onAction(next.kind)} data-testid="recruiter.drive.next-btn">{next.label}</Button>}
    </Card>
  );
}

const lpa = (v) => (v == null || v === "" ? null : `${Number(v)} LPA`);

/** Pay in one line, as students read it: CTC with its fixed and variable parts, a joining bonus, a stipend. */
export function payLine(d) {
  if (!d) return null;
  const parts = [];
  if (d.ctcLpa != null) {
    const split = [d.fixedLpa != null ? `${lpa(d.fixedLpa)} fixed` : null, d.variableLpa != null ? `${lpa(d.variableLpa)} variable` : null].filter(Boolean);
    parts.push(`${lpa(d.ctcLpa)}${split.length ? ` (${split.join(" + ")})` : ""}`);
  }
  if (d.joiningBonusLpa != null) parts.push(`${lpa(d.joiningBonusLpa)} joining bonus`);
  if (d.stipendPerMonth != null) parts.push(`₹${Number(d.stipendPerMonth).toLocaleString("en-IN")} a month stipend${d.stipendMonths ? ` for ${d.stipendMonths} months` : ""}`);
  return parts.length ? parts.join(" · ") : null;
}

/** Who can apply, in one line: branches, passing years, minimum CGPA. */
export function whoCanApply(d) {
  if (!d) return null;
  const parts = [
    Array.isArray(d.branches) && d.branches.length ? d.branches.join(", ") : "All branches",
    Array.isArray(d.passingYears) && d.passingYears.length ? `passing ${d.passingYears.join(", ")}` : null,
    d.minCgpa != null ? `CGPA ${d.minCgpa}+` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

/** What students will see about this drive, before and after, so nothing goes out unseen. */
export default function RecruiterDriveOverview({ drive, details, rounds, applicantCount, pipeline, companyName, onAction }) {
  return (
    <div className="recruiter-overview">
      <DriveProgressStrip drive={drive} rounds={rounds} />
      <DriveNextCard drive={drive} rounds={rounds} applicantCount={applicantCount} onAction={onAction} />
      <div className="recruiter-overview__grid">
        <section>
          {/* One view, the drive as students see it: the "As a student / Your view" switch repeated counts the tabs and the hiring
              progress already show (UX audit, 19 Oct 2026). */}
          <Typography.Text className="recruiter-v2__eyebrow">The drive as students see it</Typography.Text>
          <Card className="recruiter-overview__preview" data-testid="recruiter.drive.preview">
              <>
                <Tag color="blue">Drive</Tag>
                <Typography.Title level={4} style={{ margin: "8px 0 2px" }}>{drive.roleTitle}</Typography.Title>
                <Typography.Text type="secondary">{[companyName || "Your company", details?.jobType || drive.jobType, drive.mode === "OFF_CAMPUS" ? "Off campus" : drive.mode === "POOL" ? "Pool drive" : "On campus", details?.location || drive.location].filter(Boolean).join(" · ")}</Typography.Text>
                <dl className="recruiter-overview__facts">
                  <div><dt>Pay</dt><dd>{payLine(details) || drive.ctc || "To be announced"}</dd></div>
                  <div><dt>Who can apply</dt><dd>{details ? whoCanApply(details) : "As the placement cell sets it"}</dd></div>
                  <div><dt>Apply by</dt><dd>{drive.deadline ? momentFromApi(drive.deadline).format("ddd D MMM, h:mm A") : "Not set"}</dd></div>
                </dl>
                {/* The placement cell writes descriptions as rich text: shown the way students see them, not as raw tags. */}
                {details?.description && <div className="recruiter-overview__description" style={{ maxHeight: 240, overflow: "auto", margin: "8px 0" }}><RichTextDisplay content={details.description} /></div>}
                {safeHref(details?.jdUrl) && <div><a href={safeHref(details.jdUrl)} target="_blank" rel="noopener noreferrer">Job description file</a></div>}
                <Typography.Text type="secondary">{["PUBLISHED"].includes(drive.lifecycle) ? "Students can see and apply to this now. The college's placement rules also apply." : "Students see this once the placement cell publishes it."}</Typography.Text>
                {drive.lifecycle === "REQUEST" && Number(drive.reviewInvited) !== 1 ? (
                  <div style={{ marginTop: 8 }}><Button size="small" onClick={() => onAction("edit")} data-testid="recruiter.drive.edit-request">Edit your request</Button></div>
                ) : !["CLOSED", "CANCELLED", "REJECTED"].includes(drive.lifecycle) && (
                  <div style={{ marginTop: 8 }}><Button size="small" onClick={() => onAction("requests")} data-testid="recruiter.drive.ask-change">Ask for a change</Button></div>
                )}
              </>
          </Card>
        </section>
        <section>
          <Typography.Text className="recruiter-v2__eyebrow">Hiring progress</Typography.Text>
          <Card className="recruiter-overview__pipeline"><DrivePipeline funnel={pipeline} bare /></Card>
        </section>
      </div>
    </div>
  );
}
