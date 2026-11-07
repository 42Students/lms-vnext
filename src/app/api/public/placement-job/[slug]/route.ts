import {NextResponse} from "next/server";
import {readPublicExternalJobShare} from "@/modules/placements/tpo-public-join-link-service";
import { route } from "@/security/route";
export const runtime="nodejs";
type Props={params:Promise<{slug:string}>};
async function handleGET(_request:Request,{params}:Props){
 try{const {slug}=await params;
  return NextResponse.json(await readPublicExternalJobShare(slug),
   {headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"NOT_FOUND"},{status:404});}
}
export const GET = route(
  { auth: "public", publicReason: "Link or form opened without an account (token, slug or anonymous report); the handler validates the token or input and is rate limited per address.", csrf: false, csrfExemptReason: "Links and email clients send no same-origin header; the handler validates the token or applies its own origin check.", rateLimit: { limit: 3000, windowMs: 60_000 } },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);
