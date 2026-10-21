import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Skeleton, Tag, Typography, message } from "antd";
import { CheckCircleFilled, SafetyCertificateOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { getMyVerification, submitVerification } from "@/api/Services/VerificationService";

const SECTION_LABEL = { EDUCATION: "Education", IDENTITY: "Identity" };
const SECTION_HELP = {
  EDUCATION: "10th, 12th or Diploma, and your current degree, each with marks and a marksheet; and a resume on your profile.",
  IDENTITY: "Your Aadhaar or PAN number with its document.",
};
export const STATE = {
  INCOMPLETE: ["Incomplete", "default"],
  READY: ["Ready to send", "blue"],
  SUBMITTED: ["Waiting for the college", "gold"],
  SENT_BACK: ["Needs a change", "orange"],
  VERIFIED: ["Verified", "green"],
  UPDATE_PENDING: ["Verified · update waiting", "green"],
};

/** What the student can do with a section right now: the button label, or null when there is nothing to send. */
export function sectionAction(s) {
  if (!s) return null;
  if (s.state === "READY" || s.state === "SENT_BACK") return (s.missing || []).length ? null : "Send for verification";
  if (s.state === "VERIFIED" && s.changedSinceVerification) return (s.missing || []).length ? null : "Send changes for verification";
  return null;
}

/**
 * The student's Verification card: per section, where it stands, what is still missing, and one button to send it. Once verified the
 * profile shows the badge; later edits are sent as an update while the verified values stay in force.
 */
export default function ProfileVerificationCard({ onChanged }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    const r = await fetchWithErrorHandling(getMyVerification());
    if (!r.success) { setError(true); return; }
    setError(false);
    setData(r.data);
  }, []);
  useEffect(() => { load(); }, [load]);
  // The education and identity forms are on the same page: re-check quietly while the page is open, so "what is missing" follows
  // the student's edits without a reload.
  useEffect(() => {
    const i = setInterval(() => { if (typeof document === "undefined" || document.visibilityState === "visible") load(); }, 15000);
    return () => clearInterval(i);
  }, [load]);

  const send = async (section) => {
    setBusy(section);
    const r = await fetchWithErrorHandling(submitVerification(section));
    setBusy(null);
    if (!r.success) { message.error(r?.data?.message || r?.data?.error || r?.message || "Could not send it"); return; }
    message.success(`${SECTION_LABEL[section]} sent to the college for verification`);
    load();
    onChanged?.();
  };

  if (error) return <Alert type="warning" showIcon message="We could not load your verification status" action={<Button size="small" onClick={load}>Retry</Button>} />;
  if (!data) return <Card className="ln-card profile-verification"><Skeleton active paragraph={{ rows: 3 }} /></Card>;

  return (
    <Card
      className="ln-card profile-verification"
      data-testid="profile.verification"
      title={(
        <span className="profile-verification__title">
          <SafetyCertificateOutlined aria-hidden="true" /> Profile verification
          {data.verified
            ? <Tag color="green" icon={<CheckCircleFilled />} className="profile-verification__badge" data-testid="profile.verified-badge">Verified profile</Tag>
            : <Tag className="profile-verification__badge">Not verified yet</Tag>}
        </span>
      )}
    >
      <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
        Your college checks your education and identity once. Companies and the placement cell then see your profile as verified.
      </Typography.Paragraph>
      <div className="profile-verification__sections">
        {(data.sections || []).map((s) => {
          const [label, color] = STATE[s.state] || [s.state, "default"];
          const action = sectionAction(s);
          return (
            <div className="profile-verification__section" key={s.section} data-testid={`profile.verification.${s.section}`}>
              <div className="profile-verification__head">
                <Typography.Text strong>{SECTION_LABEL[s.section] || s.section}</Typography.Text>
                <Tag color={color}>{label}</Tag>
              </div>
              {s.verifiedAt && (
                <Typography.Text type="secondary" className="profile-verification__by">
                  Verified by {s.verifiedByName || "the college"} on {dayjs(s.verifiedAt).format("D MMM YYYY")}
                </Typography.Text>
              )}
              {s.state === "SENT_BACK" && s.note && <Alert type="warning" showIcon message="The college asked for a change" description={s.note} />}
              {s.state === "VERIFIED" && s.note && s.changedSinceVerification && <Alert type="info" showIcon message="Your last update was not accepted" description={s.note} />}
              {s.state === "VERIFIED" && s.changedSinceVerification && (
                <Typography.Text type="warning">You changed this after it was verified. The verified details stay in use until you send the changes and the college verifies them.</Typography.Text>
              )}
              {(s.missing || []).length > 0 && <ul className="profile-verification__missing">{s.missing.map((m) => <li key={m}>{m}</li>)}</ul>}
              {s.state === "INCOMPLETE" && <Typography.Text type="secondary">{SECTION_HELP[s.section]}</Typography.Text>}
              {action && <Button type="primary" loading={busy === s.section} onClick={() => send(s.section)}>{action}</Button>}
              {(s.state === "SUBMITTED" || s.state === "UPDATE_PENDING") && <Typography.Text type="secondary">The college will check it and you will be told.</Typography.Text>}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
