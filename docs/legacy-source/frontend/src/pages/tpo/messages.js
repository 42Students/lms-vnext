import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { Card, Typography } from "antd";
import PageShell from "@/components/Common/PageShell";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import MessagesPanel from "@/components/tpo/MessagesPanel";
import TeamConversations from "@/components/tpo/team/TeamConversations";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { getTeamPeople } from "@/api/Services/TpoHubService";
import { appAction } from "@/redux/store";

/**
 * Messages: every conversation outside a drive, in one place (owner, 19 Oct 2026: "Team" and "Messages" were two sidebar items and
 * confused people). Two tabs: Recruiters (TPO V1 - Locked.docx §1, grouped by drive plus a General thread per recruiter) and Team
 * (the placement team's own conversations, Team module V1; recruiters and students never see it). Who is on the team lives in
 * Settings > People. Inside a drive, its Discussion tab is unchanged.
 */
export default function TpoMessages() {
  const dispatch = useDispatch();
  const router = useRouter();
  const loginUser = useSelector((st) => st.loginUser);
  const tab = router.query.tab === "team" ? "team" : "recruiters";
  const [people, setPeople] = useState([]);
  const [meId, setMeId] = useState(loginUser?.id || null);

  useEffect(() => { dispatch(appAction.setActiveMenuItem("messages")); }, [dispatch]);
  // The team, for @ and Ask in every composer (with who is away).
  const loadPeople = useCallback(async () => {
    const r = await fetchWithErrorHandling(getTeamPeople());
    if (!r.success) return;
    const list = r.data?.people || [];
    setPeople(list.map((p) => ({ facultyId: p.facultyId, name: `${p.firstName || ""} ${p.lastName || ""}`.trim() || p.email || `#${p.facultyId}`, awayUntil: p.awayUntil })));
    const me = list.find((p) => p.me);
    if (me) setMeId(me.facultyId);
  }, []);
  useEffect(() => { if (tab === "team") loadPeople(); }, [loadPeople, tab]);

  const setTab = (next) => router.replace({ pathname: router.pathname, query: next === "team" ? { tab: "team" } : {} }, undefined, { shallow: true });
  const tabs = (
    <div className="tpo-team__tabs" role="tablist" aria-label="Messages">
      <button type="button" role="tab" aria-selected={tab === "recruiters"} className={`tpo-team__tab${tab === "recruiters" ? " is-on" : ""}`} onClick={() => setTab("recruiters")} data-testid="tpo.messages.tab-recruiters">Recruiters</button>
      <button type="button" role="tab" aria-selected={tab === "team"} className={`tpo-team__tab${tab === "team" ? " is-on" : ""}`} onClick={() => setTab("team")} data-testid="tpo.messages.tab-team">Team</button>
    </div>
  );
  const subtitle = tab === "team"
    ? "Your placement team's own conversations: who does what, and what you decided. Recruiters and students never see these."
    : "Conversations with recruiters, one for each drive and a general one. Inside a drive, the same conversation is its Discussion tab.";

  if (tab === "team") {
    return (
      <div className="scroll-container tpo-team tpo-messages tpo-messages--team" data-testid="tpo.messages">
        <div className="tpo-team__head">
          <ListingPageHeader title="Messages" subtitle={<Typography.Text type="secondary">{subtitle}</Typography.Text>} />
          {tabs}
        </div>
        <TeamConversations meId={meId} people={people} />
      </div>
    );
  }
  return (
    <div className="scroll-container tpo-messages" data-testid="tpo.messages">
      <PageShell>
        <ListingPageHeader className="tpo-messages__header" title="Messages" subtitle={<Typography.Text type="secondary">{subtitle}</Typography.Text>} />
        <div className="tpo-messages__tabs">{tabs}</div>
        <Card className="tpo-messages__workspace"><MessagesPanel /></Card>
      </PageShell>
    </div>
  );
}
