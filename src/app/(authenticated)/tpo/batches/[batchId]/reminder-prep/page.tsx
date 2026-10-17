import {redirect} from "next/navigation";
export default async function TpoBatchReminderPrep({params}:{params:Promise<{batchId:string}>}){
 const {batchId}=await params;
 redirect("/tpo/batches/"+encodeURIComponent(batchId)+"#batch-reminder");
}
