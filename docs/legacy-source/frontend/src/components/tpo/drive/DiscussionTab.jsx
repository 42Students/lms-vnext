import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Card, Empty, Segmented } from "antd";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { getTeamThreads } from "@/api/Services/TpoHubService";
import MessagesPanel from "@/components/tpo/MessagesPanel";
import TeamConversation from "@/components/tpo/team/TeamConversation";
import useTeamPeople from "@/components/tpo/team/useTeamPeople";

/**
 * A drive's Discussion (recruiter phase 1, N7): the conversation with the company, and the placement team's own one, kept apart so
 * nothing internal ever reaches the recruiter. The team's one is the drive's Team conversation (Team module V1: one store, two doors),
 * shown here in place with "Open in Team".
 */
export default function DiscussionTab({ job, initial, quote, onQuoteClear, onSeeRequest, refreshKey }) {
  const hasCompany = Boolean(job.recruiterId);
  const asked = initial === "internal" ? "team" : initial;
  const [view, setView] = useState(asked || (hasCompany ? "company" : "team"));
  const loginUser = useSelector((st) => st.loginUser);
  const { people, meId } = useTeamPeople(view === "team", loginUser?.id);
  // "Team (3 new)": new messages in the drive's Team conversation, read from the list (opening it is what marks it read).
  const [teamNew, setTeamNew] = useState(0);
  useEffect(() => {
    if (view === "team") { setTeamNew(0); return undefined; }
    let gone = false;
    fetchWithErrorHandling(getTeamThreads()).then((r) => {
      if (gone || !r.success || !Array.isArray(r.data)) return;
      const t = r.data.find((x) => x.kind === "DRIVE" && String(x.aboutKey) === String(job.id));
      setTeamNew(Number(t?.unread) || 0);
    });
    return () => { gone = true; };
  }, [job.id, view]);
  // "Discuss" on a request opens the company conversation with the request quoted.
  useEffect(() => { if (quote && hasCompany) setView("company"); }, [quote, hasCompany]);
  return (
    <Card className="tpo-drive-detail__discussion">
      <Segmented value={view} onChange={setView} style={{ marginBottom: 16 }}
        options={[{ value: "company", label: `With ${job.companyName || "the company"}` }, { value: "team", label: teamNew ? `Team (${teamNew} new)` : "Team" }]} />
      {view === "company"
        ? (hasCompany
          ? <MessagesPanel jobId={job.id} recruiterId={job.recruiterId} quote={quote} onQuoteClear={onQuoteClear} onSeeRequest={onSeeRequest} refreshKey={refreshKey} />
          : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No recruiter on this drive yet. Invite one to review it, and talk to them here." />)
        : <TeamConversation embedded about={{ kind: "DRIVE", key: String(job.id) }} meId={meId} people={people} />}
    </Card>
  );
}
