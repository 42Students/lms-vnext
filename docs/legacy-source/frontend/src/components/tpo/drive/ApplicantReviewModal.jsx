import { useEffect, useMemo, useRef, useState } from "react";
import { Fact, Facts } from "@/components/Common/Facts";
import { Button, Modal, Progress, Space, Tag, Typography } from "antd";
import { fullName } from "../tpoFiles";
import { safeHref } from "@/utils/safeHref";
import { STAGE_LABEL } from "../ui/labels";

/**
 * Review applicants one by one from the keyboard: S shortlist, R not selected, W waitlist-style skip is just Right arrow.
 * Left/Right (or J/K) move between students, Esc closes. A decision moves to the next student at once, so 100 applicants is a
 * minute of key presses, not 100 rows of clicks. The decisions themselves run through the same actions as the table.
 *
 * Props: open, rows (the applicants to review, in the order shown), onClose, onShortlist(row), onReject(row), onOpenStudent(row).
 */
export default function ApplicantReviewModal({ open, rows, onClose, onShortlist, onReject, onOpenStudent }) {
  const queue = useMemo(() => (rows || []).filter((r) => ["APPLIED", "SHORTLISTED"].includes(r.stage) || !r.stage), [rows]);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState({}); // applicationId -> "SHORTLISTED" | "REJECTED"
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => { if (open) { setIndex(0); setDone({}); } }, [open]);

  const current = queue[Math.min(index, Math.max(queue.length - 1, 0))];
  const decided = Object.keys(done).length;
  const go = (delta) => setIndex((i) => Math.min(Math.max(i + delta, 0), Math.max(queue.length - 1, 0)));

  const decide = async (kind) => {
    if (!current || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const ok = kind === "SHORTLISTED" ? await onShortlist(current) : await onReject(current);
      if (ok !== false) {
        setDone((d) => ({ ...d, [current.applicationId]: kind }));
        go(1);
      }
    } finally { busyRef.current = false; setBusy(false); }
  };

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "arrowright" || k === "j") { e.preventDefault(); go(1); }
      else if (k === "arrowleft" || k === "k") { e.preventDefault(); go(-1); }
      else if (k === "s") { e.preventDefault(); decide("SHORTLISTED"); }
      else if (k === "r") { e.preventDefault(); decide("REJECTED"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const requestClose = () => {
    if (busy) return;
    onClose?.();
  };

  const resume = safeHref(current?.resumeUrl);
  return (
    <Modal open={open} onCancel={requestClose} footer={null} width={560} destroyOnClose title="Review applicants" className="tpo-review"
      closable={!busy} keyboard={!busy} maskClosable={!busy}>
      {!current ? (
        <Typography.Paragraph type="secondary">Nobody is waiting for a decision.</Typography.Paragraph>
      ) : (
        <>
          <Progress percent={queue.length ? Math.round((decided * 100) / queue.length) : 0} size="small" format={() => `${decided} of ${queue.length}`} />
          <div className="tpo-review__card" data-testid="tpo.review.card">
            <Typography.Title level={4} style={{ marginBottom: 0 }}>{fullName(current)}</Typography.Title>
            <Typography.Text type="secondary" style={{ display: "block" }}>{[current.rollNumber, current.branch].filter(Boolean).join(" · ")}</Typography.Text>
            <Facts className="tpo-review__facts">
              <Fact label="In this drive"><Tag color="blue">{STAGE_LABEL[current.stage] || current.stage}</Tag></Fact>
              <Fact label="CGPA"><Tag>{current.cgpa == null ? "Not provided" : current.cgpa}</Tag></Fact>
              {current.skillMatch != null && <Fact label="Skill match" hint="How many of the drive's skills they list"><Tag color={Number(current.skillMatch) >= 70 ? "green" : "gold"}>{Math.round(Number(current.skillMatch))}%</Tag></Fact>}
              <Fact label="Resume">{current.hasResume ? <Tag color="green">Attached</Tag> : <Tag color="orange">Missing</Tag>}</Fact>
              {done[current.applicationId] && <Fact label="Your decision"><Tag color={done[current.applicationId] === "SHORTLISTED" ? "green" : "red"}>{done[current.applicationId] === "SHORTLISTED" ? "Shortlisted" : "Not selected"}</Tag></Fact>}
            </Facts>
            <Space wrap>
              {resume && <a href={resume} target="_blank" rel="noreferrer">Open resume</a>}
              <Button type="link" style={{ padding: 0 }} onClick={() => onOpenStudent?.(current)}>Full profile</Button>
            </Space>
          </div>
          <div className="tpo-review__actions">
            <Button size="large" onClick={() => go(-1)} disabled={index === 0}>Back <kbd>←</kbd></Button>
            <Button size="large" danger loading={busy} onClick={() => decide("REJECTED")}>Not selected <kbd>R</kbd></Button>
            <Button size="large" type="primary" loading={busy} onClick={() => decide("SHORTLISTED")}>Shortlist <kbd>S</kbd></Button>
            <Button size="large" onClick={() => go(1)} disabled={index >= queue.length - 1}>Skip <kbd>→</kbd></Button>
          </div>
          <Typography.Text type="secondary" className="tpo-review__count">{Math.min(index + 1, queue.length)} of {queue.length} · students are told after 30 seconds, and you can undo from the message that appears</Typography.Text>
        </>
      )}
    </Modal>
  );
}
