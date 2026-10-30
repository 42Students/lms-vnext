import {redirect} from "next/navigation";
import {legacyTpoNewDriveHref,type LegacyTpoDriveQuery}
 from "@/modules/placements/tpo-legacy-drive-route-model";

/** Old /tpo/drives/new bookmark. The real creator and TPO role check
 * live at /tpo/placements/new, including company-prefill validation.
 */
export default async function LegacyTpoNewDrivePage({
 searchParams,
}:{searchParams:Promise<LegacyTpoDriveQuery>}){
 redirect(legacyTpoNewDriveHref(await searchParams));
}
