/** Legacy Next Pages Router /api/hello was an unconditional not-found
 * route, NOT a health check. Preserve the exact status under all methods,
 * independent of credentials, query, body or runtime deployment readiness.
 * Use /ready for readiness and /health for service probes. */
export const runtime="nodejs";
export const dynamic="force-dynamic";
function retired(){return new Response(null,{status:404,headers:{"Cache-Control":"no-store"}});}
export const GET=retired;
export const HEAD=retired;
export const POST=retired;
export const PUT=retired;
export const PATCH=retired;
export const DELETE=retired;
export const OPTIONS=retired;
