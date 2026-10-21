import { useEffect } from "react";
import { useRouter } from "next/router";
import { Skeleton } from "antd";

/** Old address of Team (owner, 19 Oct 2026): conversations now live in Messages > Team, the member list in Settings > People. */
export function teamRedirect(query = {}) {
  const { tab, ...rest } = query;
  if (tab === "people" || tab === "members") return { pathname: "/tpo/settings", query: { tab: "team" } };
  return { pathname: "/tpo/messages", query: { tab: "team", ...rest } };
}

export default function TpoTeamMoved() {
  const router = useRouter();
  useEffect(() => {
    if (!router.isReady) return;
    router.replace(teamRedirect(router.query));
  }, [router.isReady]); // eslint-disable-line react-hooks/exhaustive-deps
  return <div className="scroll-container"><Skeleton active /></div>;
}
