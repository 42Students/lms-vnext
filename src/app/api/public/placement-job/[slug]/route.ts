import {NextResponse} from "next/server";
import {readPublicExternalJobShare} from "@/modules/placements/tpo-public-join-link-service";
export const runtime="nodejs";
type Props={params:Promise<{slug:string}>};
export async function GET(_request:Request,{params}:Props){
 try{const {slug}=await params;
  return NextResponse.json(await readPublicExternalJobShare(slug),
   {headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"NOT_FOUND"},{status:404});}
}
