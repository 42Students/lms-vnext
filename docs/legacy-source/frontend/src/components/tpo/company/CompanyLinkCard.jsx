import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Input, Popconfirm, Space, Switch, Typography, message } from "antd";
import { dj } from "@/components/tpo/dj";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { addCompanyDomain, getCompanyEngagement, newCompanyJoinLink, setCompanyTrusted } from "@/api/Services/TpoHubService";

/**
 * This college's unique link for one company (recruiter phase 1, N5 b): anyone with a proven email at the company joins
 * through it. Shows how often it was opened and how many joined, and the trusted switch: a trusted company's drive
 * requests go live without review.
 */
export default function CompanyLinkCard({ companyId, companyName }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [link, setLink] = useState(null);
  const [busy, setBusy] = useState(false);
  const [domain, setDomain] = useState("");

  const load = useCallback(async () => {
    const r = await fetchWithErrorHandling(getCompanyEngagement(companyId));
    if (!r.success) { setError(r?.data?.message || "Couldn't load the company link"); return; }
    setError(null);
    setData(r.data);
  }, [companyId]);
  useEffect(() => { load(); }, [load]);

  const makeLink = async () => {
    setBusy(true);
    const r = await fetchWithErrorHandling(newCompanyJoinLink(companyId));
    setBusy(false);
    if (!r.success) { message.error(r?.data?.message || "Couldn't make the link"); return; }
    setData(r.data);
    setLink(`${window.location.origin}/company-join/${r.data.token}`);
  };

  const addDomain = async () => {
    if (!domain.trim()) return;
    setBusy(true);
    const r = await fetchWithErrorHandling(addCompanyDomain(companyId, domain.trim()));
    setBusy(false);
    if (!r.success) { message.error(r?.data?.message || "Couldn't add the domain"); return; }
    setDomain("");
    setData(r.data);
    message.success("Domain added");
  };

  const trust = async (trusted) => {
    setBusy(true);
    const r = await fetchWithErrorHandling(setCompanyTrusted(companyId, trusted));
    setBusy(false);
    if (!r.success) { message.error(r?.data?.message || "Couldn't save"); return; }
    setData(r.data);
    message.success(trusted ? "Trusted: their drive requests go live without review" : "Their drive requests come to you for review");
  };

  return (
    <Card className="tpo-company-detail__panel tpo-company-detail__link" title="Company link" loading={!data && !error} data-testid="company.link">
      {error && <Alert type="error" showIcon message={error} action={<Button size="small" onClick={load}>Retry</Button>} />}
      {data && (
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Typography.Text type="secondary">
            Anyone at {companyName} joins your placements through this link, with their work email. Other emails can't use it.
          </Typography.Text>
          {(data.domains || []).length > 0
            ? <Typography.Text>Email domains: {(data.domains || []).map((d) => `@${d}`).join(", ")}</Typography.Text>
            : (
              <>
                <Typography.Text type="warning">We don&apos;t know {companyName}&apos;s email domain yet. Add it, so only their people can join.</Typography.Text>
                <Space.Compact style={{ width: "100%" }}>
                  <Input placeholder="techmahindra.com" value={domain} onChange={(e) => setDomain(e.target.value)} aria-label="Company email domain" onPressEnter={addDomain} />
                  <Button loading={busy} disabled={!domain.trim()} onClick={addDomain}>Add domain</Button>
                </Space.Compact>
              </>
            )}
          {link ? (
            <Space.Compact style={{ width: "100%" }}>
              <Input readOnly value={link} aria-label="Company link" />
              <Button onClick={() => { navigator.clipboard?.writeText(link); message.success("Link copied"); }}>Copy</Button>
            </Space.Compact>
          ) : data.hasLink ? (
            <Typography.Text>
              Made {dj(data.linkCreatedAt).format("D MMM YYYY")}. Opened {data.opens} {data.opens === 1 ? "time" : "times"}, {data.joins} joined.
            </Typography.Text>
          ) : null}
          {data.hasLink && !link ? (
            <Popconfirm title="Make a new link?" description="The old link stops working." okText="Make a new link" onConfirm={makeLink}>
              <Button loading={busy}>New link</Button>
            </Popconfirm>
          ) : !link && <Button type="primary" loading={busy} disabled={(data.domains || []).length === 0} onClick={makeLink}>Make a link</Button>}
          {link && <Typography.Text type="secondary">Copy it now: for safety it is shown only once.</Typography.Text>}
          <Space align="start">
            <Switch checked={Boolean(data.trusted)} disabled={busy} onChange={trust} aria-label="Trusted company" />
            <div>
              <Typography.Text strong>Trusted company</Typography.Text>
              <div><Typography.Text type="secondary">Their drive requests go live without your review.</Typography.Text></div>
            </div>
          </Space>
        </Space>
      )}
    </Card>
  );
}
