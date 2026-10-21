import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { Alert, Button, Card, Empty, List, Typography } from "antd";
import PageShell from "@/components/Common/PageShell";
import { dj } from "@/components/tpo/dj";
import { PanelError } from "@/components/Common/PanelStates";
import { ListSkeleton, RefreshStatus } from "@/components/Common/Skeletons";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import { appAction } from "@/redux/store";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { getDriveDayMine } from "@/api/Services/TpoHubService";

/** Drive day home (TPO V1 - Locked.docx §5): today's on-campus rounds you can open. */
export default function DriveDayHome() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { dispatch(appAction.setActiveMenuItem("drive-day")); }, [dispatch]);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetchWithErrorHandling(getDriveDayMine());
    setLoading(false);
    if (!r.success) {
      setError(r?.data?.message || r?.data?.error || "Could not load today's drive-day assignments");
      return;
    }
    setError(null);
    setRounds(Array.isArray(r.data) ? r.data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="scroll-container tpo-drive-day-home" data-testid="tpo.drive-day.home">
      <PageShell>
        <ListingPageHeader
          className="tpo-drive-day-home__header"
          title="Drive day"
          subtitle={<Typography.Text type="secondary">Your assigned rounds for today, optimized for quick on-site access.</Typography.Text>}
        />

        {error && rounds.length === 0 ? (
          <PanelError title={error} onRetry={load} />
        ) : loading && rounds.length === 0 ? (
          <Card className="tpo-drive-day-home__loading"><ListSkeleton rows={4} avatar={false} label="Loading drive-day assignments" /></Card>
        ) : (
          <>
            {loading && rounds.length > 0 && <RefreshStatus label="Refreshing drive-day assignments…" />}
            {error && <Alert className="tpo-drive-day-home__stale-alert" type="error" showIcon closable message="This refresh failed. Showing the last successful assignments." description={error} action={<Button size="small" onClick={load}>Retry</Button>} />}

            {rounds.length === 0 ? (
              <Card className="tpo-drive-day-home__empty">
                <Empty description="There is no drive day for you today.">
                  <Button onClick={() => router.push("/tpo/calendar")}>See upcoming rounds</Button>
                </Empty>
              </Card>
            ) : (
              <div className="tpo-drive-day-home__rounds">
                {rounds.map((r) => (
                  <Card className="tpo-drive-day-home__round" key={r.roundId}>
                    <div className="tpo-drive-day-home__round-copy">
                      <Typography.Text className="tpo-drive-day-home__eyebrow">Assigned round</Typography.Text>
                      <Typography.Title level={5}>{r.company} · {r.title}</Typography.Title>
                      <Typography.Text type="secondary">
                        {[r.roundName, r.startsAt && dj(r.startsAt).isValid() ? dj(r.startsAt).format("h:mm A") : null, r.venue].filter(Boolean).join(" · ")}
                      </Typography.Text>
                    </div>
                    <Button type="primary" onClick={() => router.push(`/tpo/drive-day/${r.roundId}`)}>Open round</Button>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </PageShell>
    </div>
  );
}
