import {redirect,notFound} from "next/navigation";
import {placementJobIdSchema} from "@/modules/placements/validation";
/** Legacy bookmarked edit URLs must reach the canonical selected-college
 * page without duplicating any read/write permissions. */
export default async function LegacyTpoDriveEdit({params}:{params:Promise<{jobId:string}>}){
 const {jobId}=await params;
 if(!placementJobIdSchema.safeParse(jobId).success)notFound();
 redirect("/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/edit");
}
