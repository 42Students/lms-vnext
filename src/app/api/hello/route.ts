
import { route } from "@/security/route";
import { CACHE, noStoreJson } from "@/security/responses";
/** Legacy stub: all methods respond with 404 and {message:"Not found"}, never 200 Hello. */
export const runtime="nodejs";
export const dynamic="force-dynamic";
const config = {
  auth: "public",
  publicReason: "Retired legacy stub: every method answers 404 and touches no data.",
  csrf: false,
  csrfExemptReason: "The route never changes state; every method returns the same 404.",
} as const;
function retired(){return noStoreJson({message:"Not found"}, { status: 404 });}
export const GET=route(config,retired),POST=route(config,retired),PUT=route(config,retired),PATCH=route(config,retired),DELETE=route(config,retired),OPTIONS=route(config,retired);
export const HEAD = route(config, () => new Response(null,{status:404,headers:{"Cache-Control":CACHE.NONE,"Content-Type":"application/json"}}));
