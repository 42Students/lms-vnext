import {NextResponse} from "next/server";
import {z} from "zod";
import {POST as startScopedLogin} from "@/app/api/auth/login/start/route";
export const runtime="nodejs";
const legacy=z.strictObject({
  mobileNumber:z.string().max(20).optional(),
  email:z.string().max(254).optional(),
});
/** Old caller alias, but no account-ID lookup or reusable legacy OTP storage. */
export async function POST(request:Request) {
  let parsed:z.infer<typeof legacy>;
  try { parsed=legacy.parse(await request.json()); }
  catch { return NextResponse.json({error:"INVALID_REQUEST"},{status:400}); }
  if(Boolean(parsed.mobileNumber)===Boolean(parsed.email))
    return NextResponse.json({error:"INVALID_CONTACT"},{status:400});
  const channel=parsed.mobileNumber?"PHONE":"EMAIL";
  const contact=parsed.mobileNumber??parsed.email!;
  const adapted=new Request(request.url,{
    method:"POST",headers:new Headers(request.headers),
    body:JSON.stringify({channel,contact}),signal:request.signal,
  });
  // Delegation runs the same tenant, rate limit, contact fingerprint,
  // HMAC-only challenge and transport guard as the current login API.
  return startScopedLogin(adapted);
}
