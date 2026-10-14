import { z } from "zod";
export const tpoDriveLifecycleQuerySchema = z.object({
  seasonId: z.string().uuid().optional(),
  view: z.enum(["ALL", "DRAFT", "LIVE", "CLOSED"]).default("ALL"),
  search:z.string().trim().max(100).default(""),
  page:z.coerce.number().int().min(1).max(100000).default(1),
}).strict();
export const TPO_DRIVE_PAGE_SIZE=25;
export function tpoDriveLifecyclePage(total:number,requestedPage:number){
 const totalPages=Math.max(1,Math.ceil(total/TPO_DRIVE_PAGE_SIZE));
 const page=Math.min(requestedPage,totalPages);
 return {page,totalPages,totalMatching:total,pageSize:TPO_DRIVE_PAGE_SIZE,
  offset:(page-1)*TPO_DRIVE_PAGE_SIZE};
}
export type TpoLifecycleFact = {
  id: string; title: string; company: string; status: string;
  workMode: string; employmentType: string; applicationDeadline: string | null;
};
export function projectTpoDriveLifecycle(
  facts: readonly TpoLifecycleFact[], view: "ALL" | "DRAFT" | "LIVE" | "CLOSED",
  nowIso: string,
) {
  const now = Date.parse(nowIso);
  if (!Number.isFinite(now)) throw new Error("Invalid report clock");
  const counts = {
    total: facts.length,
    drafts: facts.filter((f) => f.status === "DRAFT").length,
    live: facts.filter((f) => f.status === "PUBLISHED").length,
    closed: facts.filter((f) => f.status === "CLOSED").length,
    deadlinesNextSevenDays: facts.filter((f) => {
      if (f.status !== "PUBLISHED" || !f.applicationDeadline) return false;
      const due = Date.parse(f.applicationDeadline);
      return Number.isFinite(due) && due >= now && due <= now + 7 * 86_400_000;
    }).length,
  };
  const target = view === "DRAFT" ? "DRAFT" : view === "LIVE" ? "PUBLISHED" :
    view === "CLOSED" ? "CLOSED" : null;
  return { counts,
    rows: facts.filter((f) => target === null || f.status === target)
      .sort((a,b) => a.company.localeCompare(b.company) || a.title.localeCompare(b.title) || a.id.localeCompare(b.id)),
  };
}
