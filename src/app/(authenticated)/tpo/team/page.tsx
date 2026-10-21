import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";

type LegacyTeamSearch = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * The old /tpo/team path is a bookmark-only shim, not another workspace.
 * The Team conversations destination is Messages > Team; member management
 * belongs in Settings > People. Preserve conversation search/deep links while
 * discarding all query parameters on the people branch, exactly as the old LMS.
 */
export default async function TpoTeamLegacyRedirect({
  searchParams,
}: {
  searchParams: Promise<LegacyTeamSearch>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasPlacementTeamMembership(context)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const tab = first(params.tab)?.toLowerCase();
  // Keep the old conversation/person/recruiter tabs addressable from bookmarks.
  // The canonical Messages route owns the Recruiters and Team tabs; Settings
  // owns the People roster. The current role and college remain server-scoped.
  if (tab === "people" || tab === "members" || tab === "roster") {
    redirect("/tpo/settings?tab=team");
  }
  if(tab==="recruiters"||tab==="recruiter"){
    const q=first(params.q)?.trim().slice(0,120)??"";
    const target=new URLSearchParams({tab:"recruiters"});
    if(q)target.set("q",q);
    redirect("/tpo/messages?"+target.toString());
  }

  const thread=first(params.thread)??first(params.conversationId);
  if(thread&&/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(thread)){
    // Existing vNext thread detail is the authorized selected-conversation pane.
    redirect("/tpo/team/"+thread);
  }
  const target = new URLSearchParams({ tab: "team" });
  for (const [key, value] of Object.entries(params)) {
    if (key === "tab" || !/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(key)) {
      continue;
    }
    const values = Array.isArray(value) ? value : value === undefined ? [] : [value];
    for (const item of values.slice(0, 10)) {
      if (item.length <= 2000 && !/[\u0000-\u001f\u007f]/.test(item)) {
        target.append(key, item);
      }
    }
  }
  // Old object/ask/bookmark references become scoped Team search terms
  // where the new membership model has no global object selector.
  if(!target.has("q")){
    const object=first(params.object)??first(params.ask)??first(params.about);
    if(object&&object.length>=2&&object.length<=120&&
      !/[\u0000-\u001f\u007f]/.test(object))target.set("q",object);
  }
  redirect("/tpo/messages?" + target.toString());
}
