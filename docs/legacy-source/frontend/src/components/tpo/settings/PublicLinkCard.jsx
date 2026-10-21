import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Input, Popconfirm, Space, Switch, Typography, message } from "antd";
import { dj } from "@/components/tpo/dj";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { getPublicLink, newPublicLink, savePublicLink } from "@/api/Services/TpoHubService";

export const publicLinkUrl = (token) => (token ? `${window.location.origin}/college-join/${token}` : null);

/**
 * The college's public link for recruiters (N5 a): anyone who proves a business email joins your placements through it, with
 * their company taken from the email. Whether they can post drives without your approval is your choice (N6). The link can be
 * copied any time and goes into drive invitations (audit docs/recruiter-global/PUBLIC-LINK-AND-RECRUITER-RULES-AUDIT-2026-10-13.md).
 */
export default function PublicLinkCard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await fetchWithErrorHandling(getPublicLink());
    if (!r.success) { setError(r?.data?.message || "Couldn't load the public link"); return; }
    setError(null);
    setData(r.data);
  }, []);
  useEffect(() => { load(); }, [load]);

  const call = async (promise, ok) => {
    setBusy(true);
    const r = await fetchWithErrorHandling(promise);
    setBusy(false);
    if (!r.success) { message.error(r?.data?.message || "Couldn't save"); return null; }
    setData(r.data);
    if (ok) message.success(ok);
    return r.data;
  };

  const link = publicLinkUrl(data?.token);
  const copy = () => {
    navigator.clipboard?.writeText(link).then(() => message.success("Link copied"), () => message.error("Couldn't copy. Select the link and copy it."));
  };

  return (
    <Card title="Public link for recruiters" loading={!data && !error} data-testid="settings.public-link">
      {error && <Alert type="error" showIcon message={error} action={<Button size="small" onClick={load}>Retry</Button>} />}
      {data && (
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Typography.Text type="secondary">
            Put it on your website, add it to drive invitations, or share it anywhere. Anyone who proves a company email joins your
            placements; personal and temporary emails can&apos;t.
          </Typography.Text>
          {link && (
            <Space.Compact style={{ width: "100%" }}>
              <Input readOnly value={link} aria-label="Public link" onFocus={(e) => e.target.select()} />
              <Button onClick={copy}>Copy</Button>
            </Space.Compact>
          )}
          {data.hasLink && !link && (
            <Alert type="info" showIcon message="This link was made before links could be shown again"
              description="It still works where you shared it. Make a new link to copy it and add it to drive invitations; the old one then stops working." />
          )}
          {data.hasLink && (
            <Typography.Text type="secondary">
              Made {dj(data.createdAt).format("D MMM YYYY")}. Opened {data.opens} {data.opens === 1 ? "time" : "times"}, {data.joins} joined.
              {!data.enabled && " The link is off."}
            </Typography.Text>
          )}
          {data.hasLink
            ? (
              <Popconfirm title="Make a new link?" description="The old link stops working, including in invitations already sent." okText="Make a new link"
                onConfirm={() => call(newPublicLink(), "New link made")}>
                <Button loading={busy}>New link</Button>
              </Popconfirm>
            )
            : <Button type="primary" loading={busy} onClick={() => call(newPublicLink(), "Link made")}>Make the link</Button>}
          {data.hasLink && (
            <div className="tpo-settings__rule">
              <div>
                <Typography.Text strong>Link is on</Typography.Text>
                <Typography.Paragraph type="secondary" style={{ margin: 0 }}>Off: the link stops working, and it is left out of drive invitations, until you switch it back on.</Typography.Paragraph>
              </div>
              <Switch checked={Boolean(data.enabled)} disabled={busy} aria-label="Public link is on"
                onChange={(v) => call(savePublicLink({ enabled: v }), v ? "The link works again" : "The link is off")} />
            </div>
          )}
          <div className="tpo-settings__rule">
            <div>
              <Typography.Text strong>Anyone with a verified business email may post</Typography.Text>
              <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
                {data.postDirect
                  ? "On: drives requested by people who joined through this link skip your approval and arrive as drafts. You still publish them, so students never see a drive you haven't looked at. Only while the link is on."
                  : "Off: their drive requests wait for your approval, like everyone else's."}
              </Typography.Paragraph>
            </div>
            <Switch checked={Boolean(data.postDirect)} disabled={busy} aria-label="Anyone with a verified business email may post"
              onChange={(v) => call(savePublicLink({ postDirect: v }), "Saved")} />
          </div>
        </Space>
      )}
    </Card>
  );
}
