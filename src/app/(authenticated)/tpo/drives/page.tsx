import {redirect} from "next/navigation";
import {legacyTpoDrivesListHref,type LegacyTpoDriveQuery}
 from "@/modules/placements/tpo-legacy-drive-route-model";

/** Legacy Drives bookmark. The canonical lifecycle page owns permissions,
 * tabs, state and sidebar. Preserve supported legacy tab/search pagination.
 */
export default async function LegacyTpoDrivesPage({
 searchParams,
}:{searchParams:Promise<LegacyTpoDriveQuery>}){
 redirect(legacyTpoDrivesListHref(await searchParams));
}
