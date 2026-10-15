import { AnnouncementError } from "./errors";
/** No-op lifecycle operations must still reject an out-of-date form. */
export function requireCurrentAnnouncementVersion(actual:number,expected:number){
 if(!Number.isSafeInteger(expected)||expected<0||actual!==expected)
  throw new AnnouncementError("STALE_VERSION");
}
