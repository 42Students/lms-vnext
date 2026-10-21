import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Card, Typography } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import moment from "moment";
import PageShell from "@/components/Common/PageShell";
import { DashboardSkeleton, RefreshStatus } from "@/components/Common/Skeletons";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import { getRecruiterToday, listMyDrives } from "@/api/Services/RecruiterService";
import { ACCESS_ENDED_TEXT, accessEnded, driveHref, recruiterTaskHref } from "@/components/recruiter/recruiterRoutes";
import { getApiErrorPresentation } from "@/utils/apiError";

const errorText = (e, fallback) => getApiErrorPresentation(e, fallback).message;

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

// This week in plain words: a round's interview slots fold into the round ("4 interview slots"), the event says what it is,
// so no "Round" / "Interview slot" / "Deadline" tags (recruiter UX audit, 19 Oct 2026).
const dayKey = (e) => `${e.jobId || ""}|${moment(e.start).format("YYYY-MM-DD")}`;
const slotRound = (title) => String(title || "").replace(/\s+slot$/i, "").trim();
export function foldWeek(events) {
  const rounds = events.filter((e) => e.type !== "SLOT");
  const out = rounds.map((e) => ({ ...e, slots: 0 }));
  for (const s of events.filter((e) => e.type === "SLOT")) {
    const owner = out.find((e) => e.type === "ROUND" && dayKey(e) === dayKey(s) && slotRound(s.title) === String(e.title || "").trim());
    if (owner) owner.slots += 1;
    else out.push({ ...s, title: slotRound(s.title) || s.title, slots: 1 });
  }
  return out.sort((a, b) => moment(a.start).valueOf() - moment(b.start).valueOf());
}

/**
 * Today: what needs the recruiter now at this college, in one short queue. A task with a button resolves
 * by going straight to the place where it is done; a task without one is waiting on the placement cell and says so.
 */
export default function RecruiterToday({ collegeId, firstName, companyName }) {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [driveCount, setDriveCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const loadInFlightRef = useRef(false);
  const [driveCountError, setDriveCountError] = useState(null);

  const load = useCallback(() => {
    if (loadInFlightRef.current) return;
    loadInFlightRef.current = true;
    setError(null);
    setLoading(true);
    getRecruiterToday(collegeId)
      .then((res) => setData(res?.data ?? { tasks: [], thisWeek: [], liveDrive: null }))
      .catch((e) => setError(accessEnded(e) ? ACCESS_ENDED_TEXT : errorText(e, "We could not load what needs you today.")))
      .finally(() => {
        loadInFlightRef.current = false;
        setLoading(false);
      });
    // A recruiter with no drive yet is not "all caught up": they have not started. A failed
    // auxiliary lookup must not erase a previously verified count or masquerade as "no drives".
    listMyDrives(collegeId)
      .then((r) => {
        if (!Array.isArray(r?.data)) {
          setDriveCountError("Could not verify your drive history.");
          return;
        }
        setDriveCount(r.data.length);
        setDriveCountError(null);
      })
      .catch(() => setDriveCountError("Could not verify your drive history."));
  }, [collegeId]);

  useEffect(() => { if (collegeId) load(); }, [collegeId, load]);

  const header = (subtitle) => (
    <ListingPageHeader
      className="recruiter-home__header"
      title={`${greeting()}${firstName ? `, ${firstName}` : ""}`}
      subtitle={subtitle ? <Typography.Text type="secondary">{subtitle}</Typography.Text> : null}
    />
  );

  if (error && !data) {
    return (
      <div className="scroll-container recruiter-today recruiter-today--state" data-testid="recruiter.today.error">
        <PageShell>
          {header(companyName || "")}
          <Alert type="warning" showIcon message={error} action={<Button size="small" icon={<ReloadOutlined />} onClick={load}>Retry</Button>} />
        </PageShell>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="scroll-container recruiter-today recruiter-today--state" data-testid="recruiter.today.loading">
        <PageShell>
          {header(companyName || "")}
          <DashboardSkeleton metrics={3} label="Loading recruiter dashboard" />
        </PageShell>
      </div>
    );
  }

  const tasks = Array.isArray(data.tasks) ? data.tasks.filter((item) => item && typeof item === "object") : [];
  const actionable = tasks.filter((t) => t.action);
  const waiting = tasks.filter((t) => !t.action);
  const week = foldWeek(Array.isArray(data.thisWeek) ? data.thisWeek.filter((item) => item && typeof item === "object") : []);
  const live = data.liveDrive && typeof data.liveDrive === "object" ? data.liveDrive : null;

  const subtitle = actionable.length
    ? `${actionable.length} ${actionable.length === 1 ? "thing needs" : "things need"} you today.`
    : [companyName, "Nothing is waiting on you."].filter(Boolean).join(" · ");

  return (
    <div className="scroll-container recruiter-today" data-testid="recruiter.today">
      <PageShell>
        {header(subtitle)}
        {loading && data && <RefreshStatus label="Refreshing recruiter dashboard…" />}
        {error && <Alert className="recruiter-today__stale" type="error" showIcon closable message="This refresh failed. Showing what we loaded last." description={error} action={<Button size="small" onClick={load}>Retry</Button>} />}
        {driveCountError && <Alert className="recruiter-today__partial" type="warning" showIcon message="Drive summary is partially unavailable" description={driveCountError} action={<Button size="small" onClick={load}>Retry</Button>} />}

        <div className="recruiter-today__grid">
          <section aria-label="Needs you">
            <Typography.Text className="recruiter-v2__eyebrow">Needs you</Typography.Text>
            {actionable.length === 0 && driveCount === 0 ? (
              <Card className="recruiter-today__first" data-testid="recruiter.today.first">
                <Typography.Text strong>Start with your first drive</Typography.Text>
                <ol className="recruiter-today__steps">
                  <li>Describe the role, pay and how you select. It takes a few minutes, and your draft is kept as you type.</li>
                  <li>The placement cell reviews it, sets the dates and publishes it to students.</li>
                  <li>Applicants show up here; you review them one by one and send results to the placement cell.</li>
                </ol>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/recruiter/drives/new")}>Request your first drive</Button>
              </Card>
            ) : actionable.length === 0 ? (
              <Card className="recruiter-today__done" data-testid="recruiter.today.empty">
                <Typography.Text strong>You are all caught up</Typography.Text>
                <Typography.Paragraph type="secondary" style={{ margin: "4px 0 0" }}>New applicants, replies and decisions from the placement cell will show up here.</Typography.Paragraph>
              </Card>
            ) : (
              <div className="recruiter-today__queue">
                {actionable.map((t) => (
                  <Card key={t.id} className="recruiter-today__task" data-testid={`recruiter.today.task-${t.id}`}>
                    <span className={`recruiter-today__dot recruiter-today__dot--${t.tone}`} aria-label={t.tone === "urgent" ? "Urgent" : t.tone === "soon" ? "Soon" : "When you can"} />
                    <div className="recruiter-today__task-copy">
                      <Typography.Text strong>{t.title}</Typography.Text>
                      {(t.detail || t.at) && <Typography.Text type="secondary">{[t.detail, t.at ? `${t.atLabel || "At"} ${moment(t.at).format("ddd D MMM, h:mm A")}` : null].filter(Boolean).join(" · ")}</Typography.Text>}
                    </div>
                    <Button type={t.tone === "urgent" ? "primary" : "default"} onClick={() => router.push(recruiterTaskHref(t))}>{t.action}</Button>
                  </Card>
                ))}
              </div>
            )}

            {waiting.length > 0 && (
              <>
                <Typography.Text className="recruiter-v2__eyebrow recruiter-today__waiting-head">With the placement cell</Typography.Text>
                <Card className="recruiter-today__waiting" size="small">
                  {waiting.map((t) => (
                    <div key={t.id} className="recruiter-today__waiting-row" data-testid={`recruiter.today.waiting-${t.id}`}>
                      <Typography.Text>{t.title}</Typography.Text>
                      {t.detail && <Typography.Text type="secondary">{t.detail}</Typography.Text>}
                    </div>
                  ))}
                </Card>
              </>
            )}
          </section>

          <aside aria-label="This week">
            <Typography.Text className="recruiter-v2__eyebrow">This week</Typography.Text>
            <Card className="recruiter-today__week" size="small">
              {week.length === 0 ? <Typography.Text type="secondary" className="recruiter-today__week-empty">Nothing scheduled in the next 7 days.</Typography.Text> : week.slice(0, 8).map((e) => (
                <div
                  key={e.id}
                  className="recruiter-today__week-row"
                  onClick={() => e.jobId && router.push(driveHref(e.jobId, e.type === "ROUND" || e.type === "SLOT" ? "rounds" : "overview"))}
                  role={e.jobId ? "button" : undefined}
                  tabIndex={e.jobId ? 0 : undefined}
                  aria-label={e.jobId ? `Open ${e.title || "event"} for ${e.jobTitle || "drive"}` : undefined}
                  onKeyDown={(ev) => {
                    if (!e.jobId || (ev.key !== "Enter" && ev.key !== " ")) return;
                    ev.preventDefault();
                    router.push(driveHref(e.jobId, e.type === "ROUND" || e.type === "SLOT" ? "rounds" : "overview"));
                  }}
                >
                  <span className="recruiter-today__week-when">{moment(e.start).calendar(null, { sameDay: "[Today] h:mm A", nextDay: "[Tomorrow] h:mm A", nextWeek: "ddd h:mm A", sameElse: "D MMM h:mm A" })}</span>
                  <span className="recruiter-today__week-what"><Typography.Text strong>{e.title}</Typography.Text><Typography.Text type="secondary">{[e.jobTitle, e.slots ? `${e.slots} interview ${e.slots === 1 ? "slot" : "slots"}` : null].filter(Boolean).join(" · ")}</Typography.Text></span>
                </div>
              ))}
            </Card>
          </aside>
          {/* The live drive sits under "Needs you", so the left column is not one or two cards above a blank (UX audit, 19 Oct 2026). */}
          <section aria-label="Live drive" className="recruiter-today__live-col">
            {live && (
              <>
                <Typography.Text className="recruiter-v2__eyebrow recruiter-today__live-head">Live drive</Typography.Text>
                <Card
                  className="recruiter-today__live"
                  size="small"
                  hoverable
                  role="button"
                  tabIndex={0}
                  aria-label={`Open live drive ${live.title || ""}`.trim()}
                  onClick={() => router.push(driveHref(live.jobId))}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    router.push(driveHref(live.jobId));
                  }}
                  data-testid="recruiter.today.live"
                >
                  <Typography.Text strong>{live.title}</Typography.Text>
                  <div className="recruiter-today__live-stat"><strong>{live.applied}</strong><span>applied</span></div>
                  <Typography.Text type="secondary">
                    {live.deadline ? `Closes ${moment(live.deadline).format("ddd D MMM, h:mm A")}` : "No deadline set"}
                    {live.listShared ? "" : " · the list has not been shared with you yet"}
                  </Typography.Text>
                </Card>
              </>
            )}
          </section>
        </div>
      </PageShell>
    </div>
  );
}
