import { Button, Drawer, Empty, Tag, message } from "antd";
import { useState } from "react";
import { sendLogDigest } from "@/api/Services/SuperAdminLogsService";
import { shortCommit } from "@/utils/logReport";

const when = (iso) => (iso ? new Date(iso).toLocaleString() : "unknown");

function Item({ item, tone }) {
  return (
    <div className="tracker-digest__item">
      <div className="tracker-digest__message">{String(item.message || "(no message)").slice(0, 240)}</div>
      <div className="tracker-digest__meta">
        {item.path && <code>{item.path}</code>}
        <Tag color={tone}>{item.occurrences} occurrence{item.occurrences === 1 ? "" : "s"}</Tag>
        <span>first {when(item.firstSeenAt)}</span>
        {item.fixedInCommit && <span>marked fixed in {shortCommit(item.fixedInCommit)}</span>}
        {item.issuePublicId && <a href={`/tracker/issues/${item.issuePublicId}`}>{item.issuePublicId}</a>}
      </div>
    </div>
  );
}

/** The last 24 hours reduced to what needs a decision: new error types, fixed errors that came back, deploys. */
export default function LogDigestDrawer({ open, onClose, digest }) {
  const [sending, setSending] = useState(false);

  async function send() {
    setSending(true);
    try {
      const result = await sendLogDigest();
      if (result?.delivered) message.success("Digest sent to Telegram.");
      else message.warning("Telegram did not confirm delivery. Check that alerts are configured.");
    } catch {
      message.error("Could not send the digest.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Drawer
      title="Daily digest"
      open={open}
      onClose={onClose}
      width="min(560px, 100vw)"
      rootClassName="tracker-popover-scope"
      extra={<Button size="small" loading={sending} onClick={send}>Send to Telegram now</Button>}
    >
      {!digest ? (
        <Empty description="No digest available" />
      ) : (
        <div className="tracker-digest">
          <p className="tracker-digest__range">
            {when(digest.since)} to {when(digest.until)}. A copy goes to Telegram every morning at 9:00 IST.
          </p>
          {digest.quiet && <div className="tracker-digest__quiet">All quiet: nothing new, and nothing that was fixed has come back.</div>}

          {digest.regressions.length > 0 && (
            <section>
              <h3>Came back after being marked fixed ({digest.regressions.length})</h3>
              {digest.regressions.map((item) => <Item key={item.id} item={item} tone="red" />)}
            </section>
          )}
          {digest.newErrors.length > 0 && (
            <section>
              <h3>New error types ({digest.newErrors.length})</h3>
              {digest.newErrors.map((item) => <Item key={item.id} item={item} tone="orange" />)}
            </section>
          )}
          {digest.fixed && digest.fixed.length > 0 && (
            <section>
              <h3>Marked fixed ({digest.fixed.length})</h3>
              {digest.fixed.map((item) => <Item key={item.id} item={item} tone="green" />)}
            </section>
          )}
          <section>
            <h3>Deploys</h3>
            {digest.deploys.length === 0 ? (
              <p className="tracker-digest__range">None recorded in this period.</p>
            ) : (
              digest.deploys.map((d) => (
                <div key={`${d.at}-${d.commit}`} className="tracker-digest__meta">
                  <code>{shortCommit(d.commit)}</code> <span>{when(d.at)}</span> <span>{d.pods} pod{d.pods === 1 ? "" : "s"}</span>
                </div>
              ))
            )}
          </section>
          <p className="tracker-digest__range">{digest.stillActive} open error type{digest.stillActive === 1 ? "" : "s"} still active.</p>
        </div>
      )}
    </Drawer>
  );
}
