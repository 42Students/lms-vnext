import {redirect,notFound} from "next/navigation";
import {placementJobIdSchema} from "@/modules/placements/validation";
import {legacyTpoDriveDetailHref,type LegacyTpoDriveQuery}
 from "@/modules/placements/tpo-legacy-drive-route-model";

/** Keep old per-drive bookmarks, tabs and round anchors.
 * Canonical placement job pages authorize the persisted tenant-owned job.
 */
export default async function LegacyTpoDriveDetailPage({
 params,searchParams,
}:{params:Promise<{jobId:string}>;searchParams:Promise<LegacyTpoDriveQuery>}){
 const [{jobId},query]=await Promise.all([params,searchParams]);
 // Mirror the existing old-edit bookmark: do not route malformed or
 // non-vNext IDs into arbitrary job paths.
 if(!placementJobIdSchema.safeParse(jobId).success)notFound();
 redirect(legacyTpoDriveDetailHref(jobId,query));
}
