import { redirect } from "next/navigation";

/** Legacy cross-domain token handoff is retired.
 * Never accept, log, forward or exchange old handoff credentials.
 * Users should start a new first-party one-time-code sign-in on this host. */
export default function RetiredHandoffPage() {
  redirect("/?auth=handoff-retired");
}
