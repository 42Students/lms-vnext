import {redirect} from "next/navigation";
export default async function TpoBatchInvitePrep({params}:{params:Promise<{batchId:string}>}){
 const {batchId}=await params;
 redirect("/tpo/batches/"+encodeURIComponent(batchId)+"#batch-invite");
}
