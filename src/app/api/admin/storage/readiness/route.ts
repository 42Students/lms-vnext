import {getCurrentRequestContext} from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import {apiErrorResponse} from "@/lib/api-error";
import {privateR2SetupState} from "@/modules/storage/r2-config";
import {devAttestationAllowed} from "@/modules/storage/file-lifecycle";
import {productionScannerCallbackReady} from "@/modules/storage/production-scan-verdict-service";

export const runtime="nodejs";
export const dynamic="force-dynamic";

/** Optional-storage capability probe. It never exposes bucket names or credentials
 * and does not make unrelated app readiness depend on R2 provisioning. */
export async function GET(){
 try{
  const context=await getCurrentRequestContext();
  if(!isSuperAdmin(context))
   return Response.json({error:"FORBIDDEN"},{status:403,headers:{"Cache-Control":"private, no-store"}});
  const readiness=privateR2SetupState();
  // Private-object credentials alone cannot make production uploads usable.
  // The only in-repository attestation is explicitly development/test only;
  // never present "storage ready" for production while the external
  // privileged malware scanner/attestation workflow is not operational.
  const developmentAttestation=devAttestationAllowed();
  const scannerVerified=productionScannerCallbackReady();
  const scanReadiness=developmentAttestation
   ?{mode:"DEVELOPMENT_ATTESTATION",operational:true,
     message:"Development-only content verification is available. This is not malware scanning."}
   :scannerVerified
   ?{mode:"PRODUCTION_SCANNER_CALLBACK",operational:true,
     message:"Private malware-scanner callback is configured. Verify live scanning of all permitted file and video types before public release."}
   :{mode:"PRODUCTION_SCANNER_REQUIRED",operational:false,
     message:"Production malware scanning is not connected. Uploaded files remain Checking file and cannot be opened."};
  const operational=readiness.configured&&scanReadiness.operational;
  return Response.json({
    storage:"private-r2",...readiness,
    configured:operational,
    status:operational?200:503,
    message:operational?readiness.message:readiness.configured?scanReadiness.message:readiness.message,
    scanner:scanReadiness,
  },{status:operational?200:503,
   headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
