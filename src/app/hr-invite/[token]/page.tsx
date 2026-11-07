import {notFound,redirect} from "next/navigation";
import {z} from "zod";
import {recruiterInviteHref} from "@/modules/placements/recruiter-invite-alias-model";
import { runAsSystem } from "@/db/tenant-context";
async function LegacyHrInvite({params}:{params:Promise<{token:string}>}) {
 const {token}=await params;
 try {redirect(recruiterInviteHref(token));}
 catch(error){if(error instanceof z.ZodError)notFound();throw error;}
}

// Public page, no actor: runs in a named system scope so row-level security (when enforced) still lets it read
// the one record its link points at. The scope name shows in the database session.
export default async function LegacyHrInvitePublic(props: Parameters<typeof LegacyHrInvite>[0]) {
  return runAsSystem("public-page:hr-invite", () => LegacyHrInvite(props));
}
