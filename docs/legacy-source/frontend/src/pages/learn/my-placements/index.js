import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { Alert, Button, Skeleton } from "antd";
import { RightOutlined } from "@ant-design/icons";
import moment from "moment";
import PlacementsTabsLayout from "@/layouts/PlacementsTabsLayout";
import Api from "@/api/ApiMethod";
import { getApplyChecks } from "@/api/Services/TpoHubService";
import useJourney from "@/components/Placements/student/useJourney";
import ScheduleCard from "@/components/Placements/student/ScheduleCard";
import RoundTrack from "@/components/Placements/student/RoundTrack";
import PlacementsCompanyAvatar from "@/components/Placements/PlacementsCompanyAvatar";
import { at, dayTime, isOver, isPast, relativeDay, standing, timeLeft } from "@/components/Placements/student/words";

const P = "/learn/my-placements";

function greeting() {
  const h = moment().hour();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/**
 * The student's placements home (redesign, 14 Oct 2026). No counts: a student with few applications read their own small numbers
 * back ("0 Assessments", "1 Interview"), which helps no one. Instead: the one thing to do next, everything that is waiting on them,
 * the next seven days, where each live application stands, and the latest from the placement cell.
 */
export default function PlacementsHome() {
  const router = useRouter();
  const user = useSelector((s) => s.loginUser);
  const learnerId = user?.id;
  const { journey, overview, failed, loading, reload } = useJourney();
  const [drives, setDrives] = useState(null);

  useEffect(() => { if (router.isReady && !learnerId) router.replace("/"); }, [router, router.isReady, learnerId]);

  // Drives still open to them, with the college's own gate (registration, rules, held offers) per drive.
  useEffect(() => {
    if (!learnerId) return undefined;
    let live = true;
    Api.get(`/api/v1/jobs/all/${learnerId}`)
      .then(async (res) => {
        const list = Array.isArray(res?.data?.data) ? res.data.data.filter((j) => j?.isVisible !== false) : [];
        const ids = list.map((j) => j.id).filter(Boolean).slice(0, 100);
        const checks = ids.length ? (await getApplyChecks(ids).catch(() => null))?.data || {} : {};
        if (live) setDrives(list.map((j) => ({ ...j, check: checks[String(j.id)] || null })));
      })
      .catch(() => { if (live) setDrives([]); });
    return () => { live = false; };
  }, [learnerId]);

  const view = useMemo(() => {
    if (!journey || !overview) return null;
    const apps = journey.applications;
    const appliedJobs = new Set(apps.map((a) => String(a.jobId)));
    const reg = overview.registration || {};
    const openOffers = journey.offers.filter((o) => o.status === "RELEASED");
    const accepted = journey.offers.find((o) => o.status === "ACCEPTED" && o.countsAsPlaced !== false && o.countsAsPlaced !== 0);
    const hired = apps.find((a) => a.status === "HIRED");
    const placedWith = accepted ? accepted.company : hired ? hired.company : null;
    // Not over yet (one in progress right now still counts).
    const ahead = journey.schedule.filter((s) => s.live && !isOver(s));
    const week = ahead.filter((s) => at(s.startsAt)?.isBefore(moment().add(7, "days").endOf("day")));
    const toConfirm = ahead.filter((s) => s.booked && !s.confirmedAt && s.kind !== "TALK" && s.moveAsk?.status !== "PENDING");
    const canApply = (drives || []).filter((d) => !appliedJobs.has(String(d.id)) && d.check?.canApply
      && d.applicationDeadline && !isPast(d.applicationDeadline));
    const closingSoon = canApply.filter((d) => at(d.applicationDeadline)?.isBefore(moment().add(3, "days")))
      .sort((a, b) => at(a.applicationDeadline) - at(b.applicationDeadline));
    const needsRegister = !reg.choice && reg.registrationOpen;
    const sentBack = (overview.notices || []).filter((n) => n.event === "PROFILE_SENT_BACK").slice(0, 1);

    const todo = [];
    openOffers.forEach((o) => todo.push({ key: `o${o.offerId}`, urgent: true, title: `Reply to ${o.company}'s offer`, sub: `${o.role} · ${timeLeft(o.respondBy) || "reply soon"}`, href: `${P}/offers`, cta: "Reply" }));
    if (needsRegister) todo.push({ key: "reg", urgent: true, title: "Register for placements", sub: reg.deadline ? `Closes ${dayTime(reg.deadline)}` : "Takes a minute; you need it to apply", href: `${P}/placement`, cta: "Register" });
    toConfirm.forEach((s) => todo.push({ key: `c${s.roundId}`, urgent: relativeDay(s.startsAt) === "Today" || relativeDay(s.startsAt) === "Tomorrow", title: `Confirm your ${s.name.toLowerCase()} with ${s.company}`, sub: `${relativeDay(s.startsAt)} · ${dayTime(s.startsAt)}`, href: `${P}/schedule`, cta: "Confirm" }));
    closingSoon.forEach((d) => todo.push({ key: `d${d.id}`, urgent: relativeDay(d.applicationDeadline) === "Today", title: `Apply to ${d.companyName}`, sub: `${d.jobTitle} · applications close ${relativeDay(d.applicationDeadline).toLowerCase()}, ${at(d.applicationDeadline).format("h:mm A")}`, href: `${P}/jobs/${d.id}`, cta: "View drive" }));
    sentBack.forEach((n) => todo.push({ key: `p${n.id}`, title: n.title, sub: n.body, href: "/learn/profile", cta: "Fix profile" }));

    // The single next step: the most pressing thing, else what is coming, else what they can do.
    let next = null;
    const soonest = ahead[0];
    if (openOffers[0]) {
      const o = openOffers[0];
      next = { key: `o${o.offerId}`, tone: "offer", eyebrow: "You have an offer", title: `${o.company} · ${o.role}`, line: `${o.ctcLpa != null ? `₹${Number(o.ctcLpa)} LPA · ` : ""}Reply by ${dayTime(o.respondBy)} (${timeLeft(o.respondBy)})`, cta: "Accept or decline", href: `${P}/offers` };
    } else if (needsRegister) {
      next = { key: "reg", tone: "act", eyebrow: "First step", title: "Register for placements", line: `You need to register before you can apply to drives.${reg.deadline ? ` Registration closes ${dayTime(reg.deadline)}.` : ""}`, cta: "Register now", href: `${P}/placement` };
    } else if (soonest) {
      next = { key: `c${soonest.roundId}`, tone: "event", eyebrow: `${relativeDay(soonest.startsAt)}${soonest.expected ? " · expected" : ""}`, title: `${soonest.name} · ${soonest.company}`, line: [dayTime(soonest.startsAt), soonest.mode === "VIRTUAL" ? "Online" : soonest.room].filter(Boolean).join(" · "), cta: soonest.booked && !soonest.confirmedAt && soonest.kind !== "TALK" ? "Confirm I'll attend" : "See details", href: `${P}/schedule`, bring: soonest.whatToBring };
    } else if (placedWith) {
      next = { tone: "placed", eyebrow: "Congratulations", title: `You're placed with ${placedWith}`, line: "Your placement cell has it on record. You can still apply where your college's rules allow.", cta: "See your rules", href: `${P}/placement#rules` };
    } else if (canApply.length) {
      next = { tone: "act", eyebrow: "Open to you", title: `${canApply.length === 1 ? "A drive is" : `${canApply.length} drives are`} open to you`, line: "Apply before the deadlines. Each drive shows its rounds and pay.", cta: "See drives", href: `${P}/jobs` };
    } else if (reg.choice && reg.choice !== "PLACEMENTS") {
      next = { tone: "quiet", eyebrow: "Your choice", title: reg.choice === "HIGHER_STUDIES" ? "You chose higher studies" : "You are not taking part in placements", line: "Changed your mind? Ask the placement cell to change your registration.", cta: "Placement cell", href: `${P}/placement` };
    } else {
      next = { tone: "quiet", eyebrow: "All caught up", title: "Nothing needs you right now", line: "New drives open to you will show up here. Keep your profile and resume up to date so you are ready.", cta: "Update profile", href: "/learn/profile" };
    }

    const inProgress = apps.filter((a) => a.live || (a.status === "OFFERED" && a.offer?.status === "RELEASED")).slice(0, 4);
    const latest = (overview.notices || []).slice(0, 3);
    // The hero is the first thing to do; "Waiting on you" lists the rest, not the same item again (student UX audit, 20 Oct 2026).
    const rest = todo.filter((t) => t.key !== next.key);
    return { next, todo: rest, week, inProgress, latest, placedWith, debarments: overview.debarments || [], appsCount: apps.length, hasDrives: drives !== null };
  }, [journey, overview, drives]);

  if (!learnerId) return null;
  if (failed) {
    return <Alert type="warning" showIcon message="We could not load your placements" description="Your data is safe. Check your connection and try again."
      action={<Button size="small" onClick={reload}>Retry</Button>} />;
  }
  if (loading && !view) return <Skeleton active paragraph={{ rows: 8 }} />;
  if (!view) return null;
  const n = view.next;

  return (
    <div className="sp-home" data-testid="sp.home">
      {view.debarments.map((d) => (
        <Alert key={d.id} type="error" showIcon className="sp-gap" message="You are barred from drives for now"
          description={<>{d.reason ? `${d.reason} ` : ""}{d.untilDate ? `Until ${at(d.untilDate)?.format("D MMM YYYY")}.` : d.untilDrives ? `For the next ${d.untilDrives} drives.` : ""} <Link href={`${P}/placement`}>Think this is wrong? Tell the placement cell</Link></>} />
      ))}

      <section className={`sp-next sp-next--${n.tone}`} aria-labelledby="sp-next-title" data-testid="sp.next">
        <div className="sp-next__text">
          <p className="sp-next__hello">{greeting()}, {user?.firstName || "there"}</p>
          <p className="sp-next__eyebrow">{n.eyebrow}</p>
          <h2 id="sp-next-title" className="sp-next__title">{n.title}</h2>
          <p className="sp-next__line">{n.line}</p>
          {n.bring && <p className="sp-next__bring">Bring: {n.bring}</p>}
        </div>
        <Button type="primary" size="large" className="sp-next__cta" onClick={() => router.push(n.href)}>{n.cta}</Button>
      </section>

      <div className="sp-home__grid">
        <section className="sp-panel" aria-labelledby="sp-todo">
          <header className="sp-panel__head"><h2 id="sp-todo">Waiting on you</h2></header>
          {view.todo.length === 0 ? (
            <p className="sp-empty">{["offer", "act", "event"].includes(n.tone) ? "Nothing else is waiting on you." : "Nothing to do right now. We'll list it here the moment something needs you."}</p>
          ) : (
            <ul className="sp-todo">
              {view.todo.map((t) => (
                <li key={t.key} className={`sp-todo__item ${t.urgent ? "sp-todo__item--urgent" : ""}`}>
                  <div className="sp-todo__text">
                    <span className="sp-todo__title">{t.title}</span>
                    <span className="sp-todo__sub">{t.sub}</span>
                  </div>
                  <Link href={t.href} className="sp-todo__cta">{t.cta}<RightOutlined aria-hidden="true" /></Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="sp-panel" aria-labelledby="sp-week">
          <header className="sp-panel__head"><h2 id="sp-week">Next 7 days</h2><Link href={`${P}/schedule`}>Full schedule <RightOutlined /></Link></header>
          {view.week.length === 0 ? (
            <p className="sp-empty">No tests or interviews in the next 7 days. When the placement cell books you, it shows here and you get a notice.</p>
          ) : (
            <div className="sp-stack">{view.week.slice(0, 4).map((s) => <ScheduleCard key={`${s.applicationId}-${s.roundId}`} item={s} onChanged={reload} compact />)}</div>
          )}
        </section>
      </div>

      <section className="sp-panel" aria-labelledby="sp-progress">
        <header className="sp-panel__head"><h2 id="sp-progress">Where your applications stand</h2><Link href={`${P}/applications`}>All applications <RightOutlined /></Link></header>
        {view.inProgress.length === 0 ? (
          <p className="sp-empty">{view.appsCount === 0 ? "You haven't applied to a drive yet. " : "No application is in progress right now. "}<Link href={`${P}/jobs`}>Browse drives open to you</Link></p>
        ) : (
          <ul className="sp-apps">
            {view.inProgress.map((a) => {
              const st = standing(a);
              return (
                <li key={a.applicationId} className="sp-apps__item">
                  <PlacementsCompanyAvatar companyName={a.company} companyLogo={a.logo} size={40} className="sp" />
                  <div className="sp-apps__main">
                    <Link href={`${P}/jobs/${a.jobId}`} className="sp-apps__role">{a.role} <span className="sp-muted">· {a.company}</span></Link>
                    <RoundTrack rounds={a.rounds} compact />
                  </div>
                  <span className={`sp-chip sp-chip--${st.tone}`}>{st.label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="sp-panel" aria-labelledby="sp-latest">
        <header className="sp-panel__head"><h2 id="sp-latest">Latest from the placement cell</h2><Link href={`${P}/announcements`}>All notices <RightOutlined /></Link></header>
        {view.latest.length === 0 ? <p className="sp-empty">No notices yet.</p> : (
          <ul className="sp-notices">
            {view.latest.map((x) => (
              <li key={x.id} className="sp-notices__item">
                <div>
                  <span className="sp-notices__title">{x.link ? <Link href={x.link}>{x.title}</Link> : x.title}</span>
                  <span className="sp-notices__body">{x.body}</span>
                </div>
                <time className="sp-muted sp-small">{relativeDay(x.createdAt)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

PlacementsHome.getLayout = (page) => PlacementsTabsLayout(page);

