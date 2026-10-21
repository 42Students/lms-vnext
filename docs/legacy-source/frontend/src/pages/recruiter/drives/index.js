import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { Alert, Button, Card, Input, Result, Segmented, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import moment from "moment";
import { momentFromApi } from "@/utils/placementDateTime";
import PageShell from "@/components/Common/PageShell";
import { ListSkeleton } from "@/components/Common/Skeletons";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import { appAction } from "@/redux/store";
import { listMyDrives } from "@/api/Services/RecruiterService";
import useRecruiterCollege from "@/components/recruiter/useRecruiterCollege";
import NoCollegeSession from "@/components/recruiter/NoCollegeSession";
import { ACCESS_ENDED_TEXT, accessEnded, driveHref, driveNextAction, driveStatus } from "@/components/recruiter/recruiterRoutes";
import { PanelEmpty, StatusBadge } from "@/components/Common/PanelStates";
import { withReturnTo } from "@/utils/navigationContext";

export const NO_DRIVE_ACCESS = "NO_DRIVE_ACCESS";
const errorText = (e, fallback) => e?.response?.data?.message || e?.response?.data?.error || fallback;

const TABS = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "waiting", label: "Sent for review" },
  { value: "closed", label: "Completed and cancelled" },
];

/** "Applications close in 2 days", "Applications closed yesterday": the one date a recruiter scans a list for. */
export function deadlineText(deadline, now = moment()) {
  if (!deadline) return null;
  const d = momentFromApi(deadline); // the API can send [2026,10,12,7,21] as well as an ISO string
  return d.isBefore(now) ? `Applications closed ${d.from(now)}` : `Applications close ${d.from(now)}`;
}

/** Drives of the recruiter's own at this college, in their words: waiting for the placement cell, live, closed. */
export default function RecruiterDrivesPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const college = useRecruiterCollege();
  const [drives, setDrives] = useState(null);
  const [error, setError] = useState(null);

  const rawTab = Array.isArray(router.query?.tab) ? router.query.tab[0] : router.query?.tab;
  const tab = TABS.some((item) => item.value === rawTab) ? rawTab : null;
  const rawQuery = Array.isArray(router.query?.q) ? router.query.q[0] : router.query?.q;
  const query = typeof rawQuery === "string" ? rawQuery : "";

  const updateListQuery = useCallback((patch) => {
    const next = { ...(router.query || {}), ...patch };
    if (!next.q) delete next.q;
    if (!next.tab) delete next.tab;
    router.replace(
      { pathname: router.pathname, query: next },
      undefined,
      { shallow: true, scroll: false }
    );
  }, [router]);

  useEffect(() => { dispatch(appAction.setActiveMenuItem("drives")); }, [dispatch]);

  const load = useCallback(() => {
    if (!college.collegeId) return;
    setError(null);
    listMyDrives(college.collegeId)
      .then((r) => setDrives(Array.isArray(r?.data) ? r.data : []))
      .catch((e) => {
        const text = accessEnded(e) ? ACCESS_ENDED_TEXT : errorText(e, "Could not load your drives");
        setError(/missing capability/i.test(String(text)) ? NO_DRIVE_ACCESS : text);
      });
  }, [college.collegeId]);
  // A college-scoped session must never paint the previous college's list while the new scope loads. Only a real change of
  // college resets the tab and search: the first load keeps them, so a link or Back lands on the same tab.
  const loadedCollege = useRef(null);
  useEffect(() => {
    setDrives(null);
    setError(null);
    if (loadedCollege.current != null && loadedCollege.current !== college.collegeId && (router.query?.tab || router.query?.q)) {
      updateListQuery({ tab: undefined, q: undefined });
    }
    if (college.collegeId) loadedCollege.current = college.collegeId;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  // An unsent request saved on this device (the mock's "Draft"): the recruiter can pick it up again from here.
  const [hasDraft, setHasDraft] = useState(false);
  useEffect(() => {
    if (!college.collegeId) return;
    try {
      const saved = JSON.parse(window.localStorage.getItem(`recruiter-drive-draft:${college.user?.id ?? "unknown"}:${college.collegeId}`) || "null");
      setHasDraft(Boolean(saved?.values && Object.keys(saved.values).length));
    } catch (_) { setHasDraft(false); }
  }, [college.collegeId, college.user]);

  const counts = useMemo(() => {
    const c = { waiting: 0, live: 0, closed: 0, all: 0 };
    (drives || []).forEach((d) => { c[driveStatus(d.lifecycle).group] += 1; c.all += 1; });
    return c;
  }, [drives]);
  // Until the URL carries a tab (the replace below is async), show the default one rather than an empty list.
  const defaultTab = counts.waiting ? "waiting" : counts.live ? "live" : "all";
  const activeTab = tab || defaultTab;

  // Land on the tab that has something, but put that choice in the URL so refresh/back
  // returns to the same recruiter workspace instead of silently picking a new segment.
  useEffect(() => {
    if (tab || !drives || !router.isReady) return;
    updateListQuery({ tab: defaultTab });
  }, [drives, defaultTab, tab, router.isReady, updateListQuery]);

  const shell = (node) => <div className="scroll-container recruiter-drives recruiter-drives--state"><PageShell>{node}</PageShell></div>;
  if (college.error) return shell(<Result status="warning" title="We couldn't load your account" extra={<Button icon={<ReloadOutlined />} onClick={college.reload}>Retry</Button>} />);
  if (college.needsCollege) return shell(<NoCollegeSession />);
  if (error === NO_DRIVE_ACCESS) return shell(<Result status="info" title="Drive access is not switched on for you at this college" subTitle="Ask the placement cell to enable drive access for your account, then reload this page." />);
  if (error && !drives) return shell(<Card className="recruiter-drives__state-card"><Alert type="warning" showIcon message={error} action={<Button size="small" onClick={load}>Retry</Button>} /></Card>);
  if (college.loading || !drives) return shell(<Card className="recruiter-drives__state-card"><ListSkeleton rows={6} avatar={false} label="Loading recruiter drives" /></Card>);

  const q = query.trim().toLowerCase();
  // Drives where the placement cell asked something come first (N14: answered in place, nothing is sent back).
  const sentBack = (d) => (d.openRequests || 0) > 0;
  const shown = drives
    .filter((d) => activeTab === "all" || driveStatus(d.lifecycle).group === activeTab)
    .filter((d) => !q || String(d.roleTitle || "").toLowerCase().includes(q))
    .sort((a, b) => Number(sentBack(b)) - Number(sentBack(a)) || b.id - a.id);

  return (
    <div className="scroll-container recruiter-drives" data-testid="recruiter.drives">
      <PageShell>
        <ListingPageHeader
          className="recruiter-drives__header"
          title="Drives"
        />
        {hasDraft && (
          <Alert className="recruiter-drives__draft" type="info" showIcon style={{ marginBottom: 12 }} data-testid="recruiter.drives.draft"
            message="You have a drive request you haven't sent yet" description="It is saved on this device."
            action={<Button size="small" type="primary" onClick={() => router.push("/recruiter/drives/new")}>Continue</Button>} />
        )}
        {error && <Alert className="recruiter-drives__stale-alert" type="error" showIcon closable message="This refresh failed. Showing the last successful drive list." description={error} action={<Button size="small" onClick={load}>Retry</Button>} />}

        <Card className="recruiter-drives__workspace">
          {counts.all > 0 && <div className="recruiter-drives__toolbar">
            <Segmented
              className="recruiter-drives__tabs"
              value={activeTab}
              onChange={(value) => updateListQuery({ tab: value })}
              options={TABS.map((t) => ({ value: t.value, label: `${t.label} (${counts[t.value]})` }))}
            />
            {/* A search only once there are enough drives to need one (UX audit, 19 Oct 2026). */}
            {(counts.all > 6 || q) && <Input.Search
              className="recruiter-drives__search"
              allowClear
              value={query}
              onChange={(e) => updateListQuery({ q: e.target.value })}
              placeholder="Search by role"
            />}
          </div>}

          {shown.length === 0 ? (
            <div className="recruiter-drives__empty">
              <PanelEmpty
                compact
                title={
                  q
                    ? "No drives match this search"
                    : counts.all === 0
                      ? "You have no drives yet"
                      : `No ${TABS.find((item) => item.value === activeTab)?.label?.toLowerCase() || "matching"} drives`
                }
                description={
                  q
                    ? "Try another role name or clear the current search."
                    : counts.all === 0
                      ? "Request a drive and the placement cell will review it."
                      : "Choose another drive stage to see the rest of your work."
                }
                ctaLabel={q ? "Clear search" : counts.all === 0 ? "Request a drive" : "View all drives"}
                onCta={
                  q
                    ? () => updateListQuery({ q: "" })
                    : counts.all === 0
                      ? () => router.push("/recruiter/drives/new")
                      : () => updateListQuery({ tab: "all" })
                }
              />
            </div>
          ) : (
            <div className="recruiter-drives__list">
              {shown.map((d) => {
                const st = driveStatus(d.lifecycle);
                const next = driveNextAction(d, [], d.toReview || 0);
                const closing = d.lifecycle === "PUBLISHED" ? deadlineText(d.deadline) : null;
                return (
                  <Card
                    key={d.id}
                    className={`recruiter-drives__row ${sentBack(d) ? "recruiter-drives__row--attention" : ""}`}
                    hoverable
                    onClick={() => router.push(withReturnTo(driveHref(d.id), router.asPath))}
                    data-testid={`recruiter.drives.row-${d.id}`}
                  >
                    <div className="recruiter-drives__row-main">
                      {/* BE-0172: the title is the card's link, so keyboard users get the same target the mouse has. */}
                      <Link href={withReturnTo(driveHref(d.id), router.asPath)} className="recruiter-drives__row-title" style={{ color: "inherit" }} onClick={(ev) => ev.stopPropagation()}>
                        <Typography.Text strong>{d.roleTitle}</Typography.Text>
                      </Link>
                      <div className="recruiter-drives__row-meta">
                        <StatusBadge status={st.status} label={st.label} />
                        {d.ctc && <span>{d.ctc}</span>}
                        <span>{d.applicants == null ? "Applicants unavailable" : `${d.applicants} applied`}</span>
                        {d.offers > 0 && <span>{d.offers} offers</span>}
                        {closing && <span>{closing}</span>}
                      </div>
                      {sentBack(d) && <Typography.Text type="warning" className="recruiter-drives__row-note">The placement cell asked about {d.openRequests === 1 ? "1 thing" : `${d.openRequests} things`}</Typography.Text>}
                      {d.lifecycle === "REJECTED" && d.declinedReason && <Typography.Text type="secondary" className="recruiter-drives__row-note">Declined: “{d.declinedReason}”</Typography.Text>}
                      {!sentBack(d) && d.lifecycle !== "REJECTED" && <Typography.Text type="secondary" className="recruiter-drives__row-note">Next: {next.label ? `${next.label}. ${next.detail}` : next.detail}</Typography.Text>}
                    </div>
                    <div className="recruiter-drives__row-actions" onClick={(e) => e.stopPropagation()}>
                      {sentBack(d) && <Button type="primary" onClick={() => router.push(withReturnTo(driveHref(d.id, "requests"), router.asPath))}>Answer</Button>}
                      {["CLOSED", "REJECTED", "CANCELLED"].includes(d.lifecycle) && <Button onClick={() => router.push(`/recruiter/drives/new?from=${d.id}`)}>{d.lifecycle === "CLOSED" ? "Hire again" : "Hire again with changes"}</Button>}
                      <Button onClick={() => router.push(withReturnTo(driveHref(d.id), router.asPath))}>Open</Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Card>
      </PageShell>
    </div>
  );
}
