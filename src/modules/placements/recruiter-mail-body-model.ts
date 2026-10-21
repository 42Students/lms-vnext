/** Provider envelope compatibility is implemented by
 * recruiter-message-email-inbound-service: after HMAC verification the
 * original/header sender, DMARC/SPF/DKIM evidence and text/HTML fallbacks are
 * validated before thread routing. HTML is flattened to inert text; attachments
 * are deliberately not posted as recruiter chat messages. This wrapper only
 * limits raw inbound bytes, and must not be used as sender authentication.
 */
/** Compatibility wrapper for the signed recruiter gateway's 20 KB boundary. */
export {readBoundedUtf8Body as readBoundedRecruiterInboundBody} from "@/lib/bounded-utf8-body";
