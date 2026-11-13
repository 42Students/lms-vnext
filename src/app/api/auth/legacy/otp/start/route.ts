import {NextResponse} from "next/server";
import {z} from "zod";
import {isSameOriginRequest} from "@/auth/origin";
import {privateAuthJson} from "@/modules/auth/private-response";
import {AuthRequestBodyTooLarge,readBoundedAuthJson} from "@/lib/request-body";
import {POST as startScopedLogin} from "@/app/api/auth/login/start/route";
import { route } from "@/security/route";

export const runtime="nodejs";
const legacy=z.strictObject({
  mobileNumber:z.string().max(20).optional(),
  email:z.string().max(254).optional(),
});

/** Legacy input is untrusted: validate Origin and cap bytes before adapting
 * to canonical OTP login. The downstream handler still owns tenant resolution,
 * per-IP throttling, identity checks and credential delivery. */
async function handlePOST(request:Request) {
  if(!isSameOriginRequest(request))
    return privateAuthJson({error:"INVALID_ORIGIN"},{status:403});
  let parsed:z.infer<typeof legacy>;
  try {
    parsed=legacy.parse(await readBoundedAuthJson(request));
  }catch(error){
    const large=error instanceof AuthRequestBodyTooLarge;
    return privateAuthJson({error:large?"REQUEST_TOO_LARGE":"INVALID_REQUEST"},
      {status:large?413:400});
  }
  if(Boolean(parsed.mobileNumber)===Boolean(parsed.email))
    return privateAuthJson({error:"INVALID_CONTACT"},{status:400});
  const channel=parsed.mobileNumber?"PHONE":"EMAIL";
  const contact=parsed.mobileNumber??parsed.email!;
  // The inbound byte count/encoding belongs to the old payload, not to the
  // normalized JSON. Never forward stale framing headers to the second parser.
  const headers=new Headers(request.headers);
  headers.delete("content-length");
  headers.delete("transfer-encoding");
  headers.delete("content-encoding");
  headers.set("content-type","application/json");
  const adapted=new Request(request.url,{
    method:"POST",headers,
    body:JSON.stringify({channel,contact}),signal:request.signal,
  });
  // Delegation runs the same tenant, rate limit, contact fingerprint,
  // HMAC-only challenge and transport guard as the current login API.
  return startScopedLogin(adapted);
}
export const POST = route(
  { auth: "public", publicReason: "Sign-in, recovery and session endpoints run before or independently of a session; each handler enforces its own challenge, device or session-state checks.", csrf: false, csrfExemptReason: "The handler applies its own origin and challenge checks, unchanged by this wrapper.", rateLimit: { limit: 3000, windowMs: 60_000 } },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
