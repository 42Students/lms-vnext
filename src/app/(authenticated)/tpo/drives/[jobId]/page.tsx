import {redirect} from "next/navigation";
import {legacyTpoDriveDetailHref,type LegacyTpoDriveQuery}
 from "@/modules/placements/tpo-legacy-drive-route-model";

/** Keep old per-drive bookmarks, tabs and round anchors.
 * Canonical placement job pages authorize the persisted tenant-owned job.
 */
export default async function LegacyTpoDriveDetailPage({
 params,searchParams,
}:{params:Promise<{jobId:string}>;searchParams:Promise<LegacyTpoDriveQuery>}){
 const [{jobId},query]=await Promise.all([params,searchParams]);
 redirect(legacyTpoDriveDetailHref(jobId,query));
}
