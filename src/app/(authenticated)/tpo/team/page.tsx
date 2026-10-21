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
  const tab = first(params.tab);
  if (tab === "people" || tab === "members") {
    redirect("/tpo/settings?tab=team");
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
  redirect("/tpo/messages?" + target.toString());
}
