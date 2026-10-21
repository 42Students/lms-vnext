import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { Alert, Button, Empty, Input, Modal, Skeleton, message } from "antd";
import { DownOutlined, RightOutlined } from "@ant-design/icons";
import moment from "moment";
import PlacementsTabsLayout from "@/layouts/PlacementsTabsLayout";
import { getCompanyPreview, raiseStudentRequest } from "@/api/Services/TpoHubService";
import { withdrawApplication } from "@/api/Services/jobService";
import useJourney from "@/components/Placements/student/useJourney";
import RoundTrack from "@/components/Placements/student/RoundTrack";
import OfferCard from "@/components/Placements/student/OfferCard";
import PlacementsCompanyAvatar from "@/components/Placements/PlacementsCompanyAvatar";
import { at, errorText, standing } from "@/components/Placements/student/words";

const P = "/learn/my-placements";
const SHOW = [["live", "In progress"], ["ended", "Finished"], ["all", "All"]];
// Only the columns a company sharing link can carry (TpoShareService.rowsFor); readiness, debarments and no-shows never are.
const PREVIEW_LABELS = {
  name: "Name", roll: "Roll number", branch: "Branch", cgpa: "CGPA", tenth: "10th %", twelfth: "12th %",
  email: "Email", phone: "Phone", resume: "Resume", github: "GitHub", portfolio: "Portfolio", skillMatch: "Skill match", stage: "Stage",
};
const isLive = (a) => a.live || (a.status === "OFFERED" && a.offer?.status === "RELEASED");

/**
 * The student's applications (redesign, 14 Oct 2026): each one with its drive's real rounds and where they are in them, the
 * result of every round, the offer when there is one, and what they can do (withdraw, or ask the placement cell to once they are
 * booked into a round). It showed the same Applied > Shortlisted > Assessment > Interview > Offer bar for every drive.
 */
export default function ApplicationsPage() {
  const router = useRouter();
  const learnerId = useSelector((s) => s.loginUser?.id);
  const { journey, failed, loading, reload } = useJourney({ withOverview: false });
  const [open, setOpen] = useState({});
  const [q, setQ] = useState("");
  const [withdrawing, setWithdrawing] = useState(null);
  const [why, setWhy] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const guard = useRef(false);
  // A link to one application (from a notice) shows every application, so an ended one is not hidden by the filter.
  const show = SHOW.some(([k]) => k === router.query.show) ? router.query.show : router.query.applicationId ? "all" : "live";
  const setShow = (v) => router.replace({ pathname: router.pathname, query: v === "live" ? {} : { show: v } }, undefined, { shallow: true });

  useEffect(() => { if (router.isReady && !learnerId) router.replace("/"); }, [router, router.isReady, learnerId]);

  const apps = useMemo(() => journey?.applications || [], [journey]);
  const counts = { live: apps.filter(isLive).length, ended: apps.filter((a) => !isLive(a)).length, all: apps.length };
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return apps.filter((a) => (show === "all" ? true : show === "live" ? isLive(a) : !isLive(a)))
      .filter((a) => !needle || `${a.company} ${a.role}`.toLowerCase().includes(needle));
  }, [apps, show, q]);

  // A link with ?applicationId= (from a notice) opens that one; the first in-progress one starts open.
  useEffect(() => {
    if (!journey) return;
    const want = router.query.applicationId;
    if (want) setOpen((o) => ({ ...o, [String(want)]: true }));
    else if (list[0] && show === "live") setOpen((o) => (Object.keys(o).length ? o : { [String(list[0].applicationId)]: true }));
  }, [journey]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (fn, ok, fail) => {
    if (guard.current) return false;
    guard.current = true;
    setBusy(true);
    try {
      await fn();
      message.success(ok);
      reload();
      return true;
    } catch (e) {
      message.error(errorText(e, fail));
      return false;
    } finally {
      guard.current = false;
      setBusy(false);
    }
  };

  const confirmWithdraw = async () => {
    const a = withdrawing;
    const ok = a.withdraw === "SELF"
      ? await run(() => withdrawApplication(a.applicationId, learnerId), "Application withdrawn", "Could not withdraw")
      : await run(() => raiseStudentRequest({ type: "WITHDRAWAL", jobId: a.jobId, applicationId: a.applicationId, reason: why.trim() }),
        "Sent. The placement cell will reply.", "Could not send the request");
    if (ok) { setWithdrawing(null); setWhy(""); }
  };

  const openPreview = (a) => {
    setPreview({ app: a, loading: true });
    getCompanyPreview(a.jobId)
      .then((r) => setPreview({ app: a, data: r?.data?.preview || {} }))
      .catch(() => setPreview({ app: a, error: true }));
  };

  if (!learnerId) return null;
  if (failed) return <Alert type="warning" showIcon message="We could not load your applications" action={<Button size="small" onClick={reload}>Retry</Button>} />;
  if (loading && !journey) return <Skeleton active paragraph={{ rows: 8 }} />;

  return (
    <div data-testid="sp.applications">
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div className="sp-seg" role="group" aria-label="Show">
          {SHOW.map(([k, label]) => (
            <button key={k} type="button" aria-pressed={show === k} onClick={() => setShow(k)}>{label} ({counts[k]})</button>
          ))}
        </div>
        {apps.length > 5 && <Input.Search allowClear placeholder="Search company or role" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 280, marginBottom: 16 }} />}
      </div>

      {apps.length === 0 ? (
        <section className="sp-panel"><p className="sp-empty">You haven&apos;t applied to a drive yet. <Link href={`${P}/jobs`}>Browse drives open to you</Link></p></section>
      ) : list.length === 0 ? (
        <section className="sp-panel"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={q ? "No application matches your search" : show === "live" ? "No application is in progress right now" : "Nothing here yet"} /></section>
      ) : list.map((a) => {
        const st = standing(a);
        const isOpen = Boolean(open[String(a.applicationId)]);
        const toggle = () => setOpen((o) => ({ ...o, [String(a.applicationId)]: !isOpen }));
        const optOut = a.appliedByCollege && a.optOutUntil && at(a.optOutUntil)?.isAfter(moment());
        return (
          <article key={a.applicationId} className={`sp-app ${isLive(a) ? "" : "sp-app--ended"}`} data-testid="sp.application">
            <div className="sp-app__head" role="button" tabIndex={0} aria-expanded={isOpen} onClick={toggle}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } }}>
              <PlacementsCompanyAvatar companyName={a.company} companyLogo={a.logo} size={44} className="sp" />
              <div className="sp-app__id">
                <h3 className="sp-app__role">{a.role}</h3>
                <div className="sp-app__sub">
                  <span>{a.company}</span>
                  {a.jobType && <span>{a.jobType}</span>}
                  {a.pay && <span>{a.pay}</span>}
                  {a.appliedAt && <span>{a.appliedByCollege ? "Applied by the placement cell" : "Applied"} {at(a.appliedAt)?.format("D MMM")}</span>}
                </div>
                {!isOpen && (a.rounds || []).length > 0 && <RoundTrack rounds={a.rounds} compact />}
              </div>
              <div className="sp-app__side">
                <span className={`sp-chip sp-chip--${st.tone}`}>{st.label}</span>
                {isOpen ? <DownOutlined aria-hidden="true" /> : <RightOutlined aria-hidden="true" />}
              </div>
            </div>
            {isOpen && (
              <div className="sp-app__body">
                {optOut && (
                  <Alert className="sp-gap" type="info" showIcon message="The placement cell applied for you"
                    description={`If you don't want this one, withdraw before ${at(a.optOutUntil).format("ddd D MMM, h:mm A")}.`} />
                )}
                {a.lifecycle === "CANCELLED" && (
                  <Alert className="sp-gap" type="warning" showIcon message="This drive was cancelled"
                    description={a.cancelReason ? `The placement cell said: ${a.cancelReason}` : "The placement cell cancelled this drive. Your other applications are not affected."} />
                )}
                {["REJECTED", "NOT_SELECTED"].includes(a.status) && a.reason && a.reason !== "Offer declined by candidate" && (
                  <Alert className="sp-gap" type="info" message="From the company" description={a.reason} />
                )}
                {a.offer && <OfferCard offer={{ ...a.offer, logo: a.logo }} onChanged={reload} />}
                <div className="sp-app__section">
                  <h4>Selection process</h4>
                  <RoundTrack rounds={a.rounds} />
                </div>
                <div className="sp-app__actions">
                  <Button onClick={() => router.push(`${P}/jobs/${a.jobId}`)}>View drive</Button>
                  {(a.rounds || []).some((r) => ["SCHEDULED", "NEXT"].includes(r.state) && r.startsAt) && (
                    <Button onClick={() => router.push(`${P}/schedule`)}>See in schedule</Button>
                  )}
                  {isLive(a) && <Button onClick={() => openPreview(a)}>What the company sees</Button>}
                  {a.withdraw && (
                    <Button danger type="text" onClick={() => { setWhy(""); setWithdrawing(a); }}>
                      {a.withdraw === "SELF" ? "Withdraw" : "Ask to withdraw"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </article>
        );
      })}

      <Modal open={Boolean(withdrawing)} title={withdrawing ? `${withdrawing.withdraw === "SELF" ? "Withdraw from" : "Ask to withdraw from"} ${withdrawing.company}?` : ""}
        okText={withdrawing?.withdraw === "SELF" ? "Withdraw" : "Send to the placement cell"} okButtonProps={{ danger: withdrawing?.withdraw === "SELF", disabled: busy || (withdrawing?.withdraw === "REQUEST" && why.trim().length < 3) }}
        confirmLoading={busy} closable={!busy} maskClosable={!busy} onCancel={() => { if (!busy) setWithdrawing(null); }} onOk={confirmWithdraw} destroyOnClose>
        {withdrawing?.withdraw === "SELF" ? (
          <p>You leave {withdrawing.role} for good. The company and the placement cell are told. This cannot be undone.</p>
        ) : withdrawing && (
          <>
            <p>You are booked into a round of this drive, so the placement cell decides. Tell them why.</p>
            <label className="sp-label" htmlFor="sp-why-withdraw">Why do you want to withdraw?</label>
            <Input.TextArea id="sp-why-withdraw" rows={3} maxLength={900} value={why} onChange={(e) => setWhy(e.target.value)} />
          </>
        )}
      </Modal>

      <Modal open={Boolean(preview)} title={preview ? `What ${preview.app.company} sees about you` : ""} footer={[<Button key="c" onClick={() => setPreview(null)}>Close</Button>]}
        onCancel={() => setPreview(null)}>
        {preview?.loading && <Skeleton active paragraph={{ rows: 4 }} />}
        {preview?.error && <Alert type="warning" showIcon message="Couldn't load this" action={<Button size="small" onClick={() => openPreview(preview.app)}>Retry</Button>} />}
        {preview?.data && (Object.keys(preview.data).filter((k) => PREVIEW_LABELS[k]).length === 0
          ? <p className="sp-empty">Nothing about you is shared with this company yet.</p>
          : (
            <dl className="sp-offer__facts" style={{ flexDirection: "column", gap: 8 }}>
              {Object.entries(preview.data).filter(([k]) => PREVIEW_LABELS[k]).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <dt>{PREVIEW_LABELS[k]}</dt>
                  <dd style={{ margin: 0 }}>{k === "resume" && v ? <a href={v} target="_blank" rel="noopener noreferrer">View</a> : String(v ?? "-")}</dd>
                </div>
              ))}
            </dl>
          ))}
        <p className="sp-small sp-muted" style={{ marginTop: 12, marginBottom: 0 }}>Your college decides what companies see. Your readiness scores, absences and any debarment are never shared.</p>
      </Modal>
    </div>
  );
}

ApplicationsPage.getLayout = (page) => PlacementsTabsLayout(page);
