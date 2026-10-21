import { useCallback, useEffect, useRef, useState } from "react";
import { safeHref } from "@/utils/safeHref";
import { useRouter } from "next/router";
import { Alert, Button, Card, Input, Skeleton, Space, Table, Typography, message } from "antd";
import { downloadCsv } from "@/components/tpo/tpoFiles";
import { STAGE_LABEL } from "@/components/tpo/ui/labels";
import { downloadShareResumes, getShareInfo, logShareDownload, openShare, sendShareCode } from "@/api/Services/TpoHubService";

const LABEL = { applicantId: "Applicant ID", name: "Name", roll: "Roll number", branch: "Branch", cgpa: "UG %", tenth: "10th %", twelfth: "12th % / Diploma", email: "Email", phone: "Phone", resume: "Resume", github: "GitHub", portfolio: "Portfolio", stage: "Stage" };

/**
 * The company's page for "Share with company" (TPO V1 - Locked.docx §5). No login: the private link plus the one-time code the
 * placement cell sent them. Every unusable link (unknown, expired, revoked, wrong code) looks the same.
 */
export default function CompanySharePage() {
  const router = useRouter();
  const { token } = router.query;
  const [info, setInfo] = useState(null);
  const [gone, setGone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [code, setCode] = useState("");
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [zipping, setZipping] = useState(false);
  const openRef = useRef(false);
  const sendRef = useRef(false);
  const zipRef = useRef(false);

  const invalidate = useCallback(() => {
    setGone(true);
    setInfo(null);
    setData(null);
    setLoadError(null);
  }, []);

  const loadInfo = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);
    setGone(false);
    setInfo(null);
    setData(null);
    try {
      const r = await getShareInfo(token);
      if (!r?.data?.company || !r?.data?.role) {
        setLoadError("The share details could not be verified. Please retry.");
        return;
      }
      setInfo(r.data);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 404 || status === 410) invalidate();
      else setLoadError(e?.response?.data?.message || "We could not load this share. Please retry.");
    } finally {
      setLoading(false);
    }
  }, [token, invalidate]);

  useEffect(() => { loadInfo(); }, [loadInfo]);

  const open = async () => {
    if (openRef.current || code.trim().length < 6) return;
    openRef.current = true;
    setBusy(true);
    try {
      const r = await openShare(token, code.trim());
      if (!r?.data || !Array.isArray(r.data.columns) || !Array.isArray(r.data.applicants)) {
        message.error("The applicant list could not be verified. Please retry.");
        return;
      }
      setData(r.data);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 404 || status === 410) invalidate();
      else if ([400, 401, 403].includes(status)) message.error("That code did not work, or this share is no longer available.");
      else message.error(e?.response?.data?.message || "We could not verify the code right now. Please try again.");
    } finally {
      openRef.current = false;
      setBusy(false);
    }
  };

  const emailMe = async () => {
    if (sendRef.current) return;
    sendRef.current = true;
    setSending(true);
    try {
      const r = await sendShareCode(token);
      if (r.data?.status === "SENT") message.success("We emailed a code to the address the placement cell used. It works for 15 minutes.");
      // BE-0191: the server limits how often a code is emailed; the last code sent still works.
      else if (r.data?.status === "TOO_SOON") message.info("A code was emailed less than a minute ago. Check your inbox (and spam); that code still works.");
      else if (r.data?.status === "LIMIT") message.warning("Several codes were emailed in the last hour. Use the latest one, or the code the placement cell sent you.");
      else message.warning("We could not confirm that a code was sent. Please use the code the placement cell sent you, or retry.");
    } catch (e) {
      const status = e?.response?.status;
      if (status === 404 || status === 410) invalidate();
      else message.error(e?.response?.data?.message || "We could not email a code right now. Please try again.");
    } finally {
      sendRef.current = false;
      setSending(false);
    }
  };

  const downloadZip = async () => {
    if (zipRef.current || !data) return;
    zipRef.current = true;
    setZipping(true);
    try {
      const r = await downloadShareResumes(token, code.trim());
      if (!r?.data) {
        message.error("The resume archive was empty. Please retry.");
        return;
      }
      const url = URL.createObjectURL(new Blob([r.data], { type: "application/zip" }));
      const a = document.createElement("a");
      a.href = url; a.download = `resumes-${data.role}.zip`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 404 || status === 410) invalidate();
      else message.error(e?.response?.data?.message || "Could not prepare the resumes. Please try again.");
    } finally {
      zipRef.current = false;
      setZipping(false);
    }
  };

  const columns = data ? ["applicantId", ...data.columns.flatMap((c) => (c === "projects" ? ["github", "portfolio"] : [c]))].filter((c, i, a) => a.indexOf(c) === i && LABEL[c]).map((c) => ({
    title: LABEL[c], dataIndex: c, key: c, render: (v) => (c === "stage" && v ? STAGE_LABEL[v] || String(v) : c === "resume" && v ? (safeHref(v) ? <a href={safeHref(v)} target="_blank" rel="noopener noreferrer">Open</a> : "Link not shown") : v == null || v === "" ? "-" : String(v)),
  })) : [];

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 16, position: "relative" }}>
      {data && (
        <div aria-hidden="true" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, overflow: "hidden", opacity: 0.07, display: "flex", flexWrap: "wrap", alignContent: "flex-start", transform: "rotate(-20deg) scale(1.4)" }}>
          {Array.from({ length: 120 }).map((_, i) => <span key={i} style={{ padding: "28px 36px", fontSize: 18, fontWeight: 600, whiteSpace: "nowrap" }}>{`${data.company} · confidential`}</span>)}
        </div>
      )}
      {loading && <Card style={{ maxWidth: 480, margin: "48px auto" }}><Skeleton active paragraph={{ rows: 4 }} /></Card>}
      {!loading && loadError && <Alert type="warning" showIcon message="We couldn't load this share" description={loadError} action={<Button size="small" onClick={loadInfo}>Retry</Button>} />}
      {!loading && gone && <Alert type="warning" showIcon message="This link is not valid any more." description="It may have expired or been withdrawn. Please ask the placement cell for a new one." />}
      {!loading && info && !data && (
        <Card title={`Applicants for ${info.role}`} style={{ maxWidth: 480, margin: "48px auto" }}>
          <Typography.Paragraph>Shared with {info.company}. Enter the one-time code the placement cell sent you.</Typography.Paragraph>
          <Space.Compact style={{ width: "100%" }}>
            <Input size="large" placeholder="6-digit code" maxLength={6} value={code} disabled={busy} onChange={(e) => setCode(e.target.value)} onPressEnter={open} />
            <Button size="large" type="primary" loading={busy} disabled={busy || code.trim().length < 6} onClick={open}>Open</Button>
          </Space.Compact>
          {info.emailCodeAvailable && <Button type="link" style={{ paddingLeft: 0 }} loading={sending} disabled={sending || busy} onClick={emailMe}>Email me a code instead</Button>}
          <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>The link works until {new Date(info.expiresAt).toLocaleDateString()}. Everything you open is logged.</Typography.Paragraph>
        </Card>
      )}
      {data && (
        <Card title={`${data.applicants.length} applicants for ${data.role}`} extra={
          <Space>
          {data.zipAvailable && <Button loading={zipping} onClick={downloadZip}>Download all resumes (ZIP)</Button>}
          <Button onClick={() => { logShareDownload(token, code.trim(), "LIST").catch(() => {}); downloadCsv(`applicants-${data.role}`, columns.map((c) => ({ title: c.title, value: (r) => (c.dataIndex === "stage" ? STAGE_LABEL[r.stage] || r.stage : r[c.dataIndex]) })), data.applicants); }}>Download list</Button>
          </Space>}>
          {data.shortlistBy && data.shortlistBy !== "null" && <Alert type="info" showIcon style={{ marginBottom: 12 }} message={`Please shortlist by ${new Date(data.shortlistBy).toLocaleDateString()}.`} />}
          <Typography.Paragraph type="secondary">Shared by {data.sharedBy || "the placement cell"}{data.sharedOn ? ` on ${new Date(data.sharedOn).toLocaleDateString()}` : ""} for {data.company}. Please do not forward this page. Phone numbers appear only for shortlisted students.</Typography.Paragraph>
          <Table size="small" rowKey="applicantId" dataSource={data.applicants} columns={columns} pagination={{ pageSize: 25 }} scroll={{ x: "max-content" }} />
        </Card>
      )}
    </div>
  );
}
CompanySharePage.nolayout = true;
