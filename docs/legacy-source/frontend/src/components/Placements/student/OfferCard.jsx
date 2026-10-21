import React, { useRef, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { Alert, Button, Modal, Skeleton, message } from "antd";
import { respondToTpoOffer } from "@/api/Services/TpoHubService";
import { previewOfferAccept } from "@/api/Services/jobService";
import PlacementsCompanyAvatar from "@/components/Placements/PlacementsCompanyAvatar";
import { at, dayTime, errorText, timeLeft } from "./words";

// What an offer's state means to the student (the stored codes are the company's and the college's).
export const OFFER_WORDS = {
  RELEASED: "Waiting for your reply", ACCEPTED: "Accepted", DECLINED: "Declined", EXPIRED: "Expired: no reply in time",
  WITHDRAWN: "Withdrawn by the company",
};
const validPreview = (v) => Boolean(v && typeof v === "object" && ["withdrawn", "staysOpen", "otherPendingDeclined"].every((k) => Array.isArray(v[k])));

/**
 * One offer: what it is, how long the student has, and Accept / Decline. Accepting first shows exactly what it does to their other
 * applications and offers under the college's rules (withdrawn / you stay in / declined), and only then commits.
 */
export default function OfferCard({ offer, onChanged }) {
  const learnerId = useSelector((s) => s.loginUser?.id);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [declining, setDeclining] = useState(false);
  const guard = useRef(false);
  const open = offer.status === "RELEASED";
  const respondBy = at(offer.respondBy);
  const urgent = open && respondBy && respondBy.diff(new Date(), "hours") < 24;

  const respond = async (accept) => {
    if (guard.current) return false;
    guard.current = true;
    setBusy(true);
    try {
      await respondToTpoOffer(offer.offerId, accept);
      message.success(accept ? `Congratulations! You accepted ${offer.company}'s offer.` : "Offer declined");
      onChanged?.();
      return true;
    } catch (e) {
      message.error(errorText(e, accept ? "Could not accept" : "Could not decline"));
      return false;
    } finally {
      guard.current = false;
      setBusy(false);
    }
  };

  const openPreview = () => {
    setPreview({ loading: true });
    previewOfferAccept(offer.applicationId, learnerId)
      .then((r) => setPreview(validPreview(r?.data?.data) ? { data: r.data.data } : { error: true }))
      .catch(() => setPreview({ error: true }));
  };

  const groups = preview?.data ? [
    ["Withdrawn", preview.data.withdrawn, "These applications end."],
    ["Other offers declined", preview.data.otherPendingDeclined, "These offers are turned down for you."],
    ["You stay in", preview.data.staysOpen, "These carry on as before."],
  ].filter(([, list]) => list.length) : [];

  return (
    <article className={`sp-offer ${open ? "sp-offer--open" : ""}`} data-testid="sp.offer">
      <div className="sp-offer__head">
        <PlacementsCompanyAvatar companyName={offer.company} companyLogo={offer.logo} size={44} className="sp" />
        <div className="sp-offer__id">
          <h3 className="sp-offer__company">{offer.company}</h3>
          <Link href={`/learn/my-placements/jobs/${offer.jobId}`} className="sp-offer__role">{offer.role}{offer.roleOption ? ` · ${offer.roleOption}` : ""}</Link>
        </div>
        <span className={`sp-chip sp-chip--${open ? "now" : offer.status === "ACCEPTED" ? "good" : "off"}`}>{OFFER_WORDS[offer.status] || offer.status}</span>
      </div>
      <dl className="sp-offer__facts">
        {offer.ctcLpa != null && <div><dt>{offer.jobType === "Internship" ? "Stipend / CTC" : "CTC"}</dt><dd>₹{Number(offer.ctcLpa)} LPA</dd></div>}
        {offer.joiningDate && <div><dt>Joining</dt><dd>{at(offer.joiningDate)?.format("D MMM YYYY")}</dd></div>}
        {open && respondBy && <div><dt>Reply by</dt><dd className={urgent ? "sp-text-bad" : ""}>{dayTime(offer.respondBy)} · {timeLeft(offer.respondBy)}</dd></div>}
        {!open && offer.respondedAt && <div><dt>{offer.status === "ACCEPTED" ? "Accepted" : "Answered"}</dt><dd>{dayTime(offer.respondedAt)}</dd></div>}
        {offer.countsAsPlaced === false || offer.countsAsPlaced === 0 ? <div><dt>Counts as placed</dt><dd>No (internship)</dd></div> : null}
      </dl>
      {offer.status === "ACCEPTED" && offer.acceptanceChannel && offer.acceptanceChannel !== "IN_APP" && offer.disputableUntil && (
        <Alert type="info" showIcon message="The company told us you accepted this offer"
          description={`If that is wrong, tell the placement cell before ${dayTime(offer.disputableUntil)}.`} />
      )}
      <div className="sp-offer__actions">
        {open && <Button type="primary" loading={busy && !declining} onClick={openPreview}>Accept offer</Button>}
        {open && <Button danger disabled={busy} onClick={() => setDeclining(true)}>Decline</Button>}
        {offer.letterUrl && <Button href={offer.letterUrl} target="_blank" rel="noopener noreferrer">Offer letter</Button>}
      </div>

      <Modal open={Boolean(preview)} title={`Accept ${offer.company}'s offer?`} okText="Yes, accept" confirmLoading={busy}
        okButtonProps={{ disabled: busy || !preview?.data }} closable={!busy} maskClosable={!busy}
        onCancel={() => { if (!busy) setPreview(null); }}
        onOk={async () => { if (await respond(true)) setPreview(null); }}>
        {preview?.loading && <Skeleton active paragraph={{ rows: 3 }} />}
        {preview?.error && (
          <Alert type="warning" showIcon message="We couldn't check what accepting will change"
            description="Accepting can end your other applications and offers. Check again before you accept."
            action={<Button size="small" onClick={openPreview}>Check again</Button>} />
        )}
        {preview?.data && (
          <div className="sp-impact">
            <p>The company and the placement cell are told at once.</p>
            {groups.length === 0 && <p className="sp-muted">Nothing else changes: you have no other active applications or offers.</p>}
            {groups.map(([title, list, note]) => (
              <section key={title} className="sp-impact__group">
                <h4>{title} <span className="sp-muted">({list.length})</span></h4>
                <p className="sp-small sp-muted">{note}</p>
                <ul>{list.map((a) => <li key={a.applicationId || `${a.companyName}-${a.jobTitle}`}>{a.companyName} · {a.jobTitle}</li>)}</ul>
              </section>
            ))}
            <p className="sp-small"><Link href="/learn/my-placements/placement#rules">How your college's rules decide this</Link></p>
          </div>
        )}
      </Modal>

      <Modal open={declining} title={`Decline ${offer.company}'s offer?`} okText="Decline offer" okButtonProps={{ danger: true, disabled: busy }}
        confirmLoading={busy} closable={!busy} maskClosable={!busy} onCancel={() => { if (!busy) setDeclining(false); }}
        onOk={async () => { if (await respond(false)) setDeclining(false); }}>
        <p>This cannot be undone. The company and the placement cell are told.</p>
      </Modal>
    </article>
  );
}
