import { useState } from "react";
import { useRouter } from "next/router";
import { Button, Card, Result, Typography } from "antd";
import { unsubscribeCampaign } from "@/api/Services/TpoService";

/** A campaign email's unsubscribe link (phase 3). Opening it changes nothing; the button does, so mail scanners never unsubscribe anyone. */
export default function CampaignUnsubscribePage() {
  const router = useRouter();
  const token = typeof router.query.token === "string" ? router.query.token : null;
  const [state, setState] = useState("ask"); // ask | done | error
  const [busy, setBusy] = useState(false);
  const shell = (children) => (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "#f5f7f9" }}>
      <div style={{ width: "100%", maxWidth: 440 }}><Card>{children}</Card></div>
    </div>
  );
  if (state === "done") return shell(<Result status="success" title="You're unsubscribed" subTitle="This placement cell will not email you again." />);
  return shell(
    <>
      <Typography.Title level={4} style={{ marginTop: 0 }}>Stop these emails?</Typography.Title>
      <Typography.Paragraph type="secondary">The placement cell that wrote to you will not email you again.</Typography.Paragraph>
      {state === "error" && <Typography.Paragraph type="danger">That didn&apos;t work. Please try again.</Typography.Paragraph>}
      <Button type="primary" loading={busy} disabled={!token || busy}
        onClick={async () => {
          setBusy(true);
          try { await unsubscribeCampaign(token); setState("done"); } catch { setState("error"); } finally { setBusy(false); }
        }}>
        Unsubscribe
      </Button>
    </>
  );
}

// A public page: no session layout and no login redirect (PUBLIC_PREFIXES in src/proxy.js).
CampaignUnsubscribePage.nolayout = true;
