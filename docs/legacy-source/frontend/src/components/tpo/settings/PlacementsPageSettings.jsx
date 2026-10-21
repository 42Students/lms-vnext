import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Checkbox, Input, Space, Statistic, Switch, Typography, message } from "antd";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { getPlacementsPage, savePlacementsPage } from "@/api/Services/TpoHubService";

/**
 * The college's public placements page (D2): switched on here, it shows on your own address at /placements with a few lines
 * about your placements and the live numbers you pick. A number built on fewer than 5 students or offers never shows.
 * Companies use "Recruit from us" on it; they arrive in Engage as recruiter leads.
 */
export default function PlacementsPageSettings() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [about, setAbout] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await fetchWithErrorHandling(getPlacementsPage());
    if (!r.success) { setError(r?.data?.message || "Couldn't load the placements page"); return; }
    setError(null);
    setData(r.data);
    setAbout(r.data?.about || "");
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (patch, ok) => {
    setBusy(true);
    const r = await fetchWithErrorHandling(savePlacementsPage(patch));
    setBusy(false);
    if (!r.success) { message.error(r?.data?.message || "Couldn't save"); return; }
    setData(r.data);
    message.success(ok || "Saved");
  };

  if (error) return <Alert type="error" showIcon message={error} action={<Button size="small" onClick={load}>Retry</Button>} />;
  if (!data) return <Card loading />;
  const address = typeof window !== "undefined" ? `${window.location.origin}/placements` : "/placements";
  const shown = new Set((data.preview || []).map((p) => p.key));

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }} data-testid="settings.placements-page">
      <Card>
        <div className="tpo-settings__rule">
          <div>
            <Typography.Text strong>Placements page is {data.enabled ? "on" : "off"}</Typography.Text>
            <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
              {data.enabled ? <>Anyone can open <Typography.Link href={address} target="_blank">{address}</Typography.Link>.</> : "Switch it on to publish it on your own address."}
            </Typography.Paragraph>
          </div>
          <Switch checked={Boolean(data.enabled)} disabled={busy} aria-label="Placements page is on"
            onChange={(v) => save({ enabled: v }, v ? "Your placements page is live" : "Your placements page is off")} />
        </div>
      </Card>
      <Card title="About your placements">
        <Input.TextArea rows={4} maxLength={4000} showCount value={about} onChange={(e) => setAbout(e.target.value)} aria-label="About your placements"
          placeholder="A few lines companies read first: your programmes, batch sizes, when your season runs." />
        <Button style={{ marginTop: 8 }} disabled={busy || about === (data.about || "")} onClick={() => save({ about })}>Save</Button>
      </Card>
      <Card title="Numbers to show">
        <Typography.Paragraph type="secondary">Live, over the last 12 months. A number built on fewer than 5 students or offers is never shown.</Typography.Paragraph>
        <Checkbox.Group value={data.numbers} disabled={busy} onChange={(v) => save({ numbers: v })}
          options={(data.available || []).map((n) => ({ value: n.value, label: `${n.label}${shown.has(n.value) ? "" : " (not enough data yet)"}` }))} />
        {(data.preview || []).length > 0 && (
          <Space wrap size="large" style={{ marginTop: 16 }}>
            {data.preview.filter((p) => data.numbers.includes(p.key)).map((p) => <Statistic key={p.key} title={p.label} value={p.value} />)}
          </Space>
        )}
      </Card>
    </Space>
  );
}
