import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {
 legacyClientSettingsEnvelope,
 readLearnerPlaybackSettings,
} from "@/modules/courses/learner-playback-settings";
import { secured } from "@/security/secure-handler";

export const runtime="nodejs";

/** Legacy authenticated client-settings endpoint. Settings are global safe
 * playback/poll intervals, never an unauthenticated or tenant-sensitive dump.
 * The service retains its resilient defaults during a configuration outage. */
async function handleGET(){
 try{
  const context=await getCurrentRequestContext();
  const settings=await readLearnerPlaybackSettings(context.membership?.collegeId);
  return NextResponse.json(legacyClientSettingsEnvelope(settings),{
   headers:{"Cache-Control":"private, no-store"},
  });
 }catch(error){
  return apiErrorResponse(error);
 }
}
export const GET = secured(handleGET);
