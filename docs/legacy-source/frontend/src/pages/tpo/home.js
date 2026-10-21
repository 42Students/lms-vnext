import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { Alert, Button, Skeleton } from "antd";
import { CalendarOutlined, CommentOutlined, InboxOutlined, ProjectOutlined, RightOutlined, SolutionOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";
import { dj } from "@/components/tpo/dj";
import { PanelError } from "@/components/Common/PanelStates";
import { DashboardSkeleton, RefreshStatus } from "@/components/Common/Skeletons";
import PageShell from "@/components/Common/PageShell";
import { appAction } from "@/redux/store";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { getHome } from "@/api/Services/TpoHubService";
import { greeting, homeRows, needLine, nextUp } from "@/components/tpo/home/homeRows";

const ICON = { batches: <TeamOutlined />, drives: <ProjectOutlined />, students: <UserOutlined />, engage: <SolutionOutlined />, inbox: <InboxOutlined />, team: <CommentOutlined />, week: <CalendarOutlined /> };

/**
 * TPO Home (user, 5 Oct 2026: "the least cognitive load"): a greeting, one Next up card with one button, then seven quiet rows,
 * each a page to open with a few words of what is happening there and a dot when it needs you. Everything else lives on its page.
 */
export default function TpoHome() {
  const dispatch = useDispatch();
  const router = useRouter();
  const loginUser = useSelector((state) => state.loginUser);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const loadInFlightRef = useRef(false);

  useEffect(() => { dispatch(appAction.setActiveMenuItem("home")); }, [dispatch]);

  const load = useCallback(async () => {
    if (loadInFlightRef.current) return;
    loadInFlightRef.current = true;
    setLoading(true);
    try {
      const res = await fetchWithErrorHandling(getHome({ team: false }));
      if (!res.success) {
        setError(res.userMessage || "Could not load Home");
        return;
      }
      setError(null);
      setData(res.data && typeof res.data === "object" ? res.data : {});
    } finally {
      loadInFlightRef.current = false;
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  // Coming back to the tab shows what changed meanwhile, without a refresh button.
  useEffect(() => {
    const onFocus = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onFocus);
    return () => document.removeEventListener("visibilitychange", onFocus);
  }, [load]);

  const rows = useMemo(() => (data ? homeRows(data) : []), [data]);
  const next = useMemo(() => (data ? nextUp(data) : null), [data]);
  const name = loginUser?.firstName ? `, ${loginUser.firstName}` : "";

  return (
    <div className="scroll-container tpo-calm-home" data-testid="tpo.home">
      <PageShell>
        <header className="tpo-calm-home__head">
          <p className="tpo-calm-home__date">{dj().format("dddd, D MMMM")}</p>
          <h1 className="tpo-calm-home__hello">{greeting(dj().hour())}{name}</h1>
          {data && <p className="tpo-calm-home__line" data-testid="home.need-line">{needLine(rows, data)}</p>}
        </header>
        {error && !data ? (
          <PanelError title={error} onRetry={load} />
        ) : !data ? (
          <DashboardSkeleton metrics={4} label="Loading placement home" />
        ) : (
          <>
            {loading && <RefreshStatus label="Refreshing placement home…" />}
            {error && (
              <Alert
                className="tpo-calm-home__stale-alert"
                type="error"
                showIcon
                message="Home refresh failed. Showing the last successful snapshot."
                description={error}
                action={<Button size="small" onClick={load}>Retry</Button>}
              />
            )}
            {/* Desktop: Next up on the left, the seven rows on the right; a phone stacks them. */}
            <div className="tpo-calm-home__grid">

            {next ? (
              <section className="tpo-calm-home__next" aria-label="Next up" data-testid="home.next-up">
                <p className="tpo-calm-home__next-eyebrow">Next up</p>
                <p className="tpo-calm-home__next-title">{next.title}</p>
                <p className="tpo-calm-home__next-text">{next.text}</p>
                <Button type="primary" onClick={() => router.push(next.href)}>{next.action}</Button>
              </section>
            ) : (
              <section className="tpo-calm-home__next is-clear" aria-label="Next up" data-testid="home.next-up">
                <p className="tpo-calm-home__next-title">Nothing is waiting on you.</p>
                <p className="tpo-calm-home__next-text">New requests, results and replies show up here first.</p>
              </section>
            )}

            <nav className="tpo-calm-home__rows" aria-label="Your placement work">
              {rows.map((r) => (
                <button type="button" key={r.key} className="tpo-calm-home__row" onClick={() => router.push(r.href)} data-testid={`home.row.${r.key}`}>
                  <span className="tpo-calm-home__icon" aria-hidden="true">{ICON[r.icon]}</span>
                  <span className="tpo-calm-home__body">
                    <span className="tpo-calm-home__title">{r.title}</span>
                    <span className="tpo-calm-home__status">{r.status}</span>
                  </span>
                  {r.attention && <span className="tpo-calm-home__needs" aria-label="Needs you">Needs you</span>}
                  <RightOutlined className="tpo-calm-home__chevron" aria-hidden="true" />
                </button>
              ))}
            </nav>
            </div>
          </>
        )}
      </PageShell>
    </div>
  );
}
