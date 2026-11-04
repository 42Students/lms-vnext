import {timingSafeEqual} from "node:crypto";

export type ScannerCallbackRejection="INVALID_ORIGIN"|"INVALID_REQUEST"|"FORBIDDEN";

/** Service identity is a single exact deployment-held secret, never a browser
 * cookie, Origin, query parameter, or trimmed/normalized equivalent. */
export function validScannerCallbackSecret(secret:string|undefined):secret is string{
 if(typeof secret!=="string"||secret!==secret.trim()||
    /[\x00-\x20\x7f]/.test(secret))return false;
 const bytes=Buffer.byteLength(secret,"utf8");
 return bytes>=32&&bytes<=256;
}

/** Must execute before parsing JSON, touching R2 or querying the database.
 * Preserve the existing header-based scanner protocol; require strictly
 * machine-originated JSON rather than accepting browser-origin variants. */
export function scannerCallbackRequestRejection(
 request:Request,configuredSecret:string|undefined,
):ScannerCallbackRejection|null{
 if(request.headers.has("origin"))return "INVALID_ORIGIN";
 // Authenticate first, before revealing accepted URL or JSON metadata.
 if(!validScannerCallbackSecret(configuredSecret))return "FORBIDDEN";
 const supplied=request.headers.get("x-private-storage-scanner-key")??"";
 if(!validScannerCallbackSecret(supplied))return "FORBIDDEN";
 const expected=Buffer.from(configuredSecret,"utf8");
 const provided=Buffer.from(supplied,"utf8");
 if(expected.length!==provided.length||!timingSafeEqual(expected,provided))
  return "FORBIDDEN";
 // The caller may choose its scope only through validated JSON, never a URL.
 if(new URL(request.url).search)return "INVALID_REQUEST";
 const mediaType=request.headers.get("content-type")??"";
 if(!/^application\/json(?:\s*;\s*charset\s*=\s*utf-8)?$/i.test(mediaType.trim()))
  return "INVALID_REQUEST";
 const contentLength=request.headers.get("content-length");
 if(contentLength!==null&&(
   !/^(0|[1-9][0-9]*)$/.test(contentLength)||
   !Number.isSafeInteger(Number(contentLength))||
   Number(contentLength)>2048
 ))return "INVALID_REQUEST";
 return null;
}
