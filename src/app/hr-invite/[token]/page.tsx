import {notFound,redirect} from "next/navigation";
import {z} from "zod";
import {recruiterInviteHref} from "@/modules/placements/recruiter-invite-alias-model";
export default async function LegacyHrInvite({params}:{params:Promise<{token:string}>}) {
 const {token}=await params;
 try {redirect(recruiterInviteHref(token));}
 catch(error){if(error instanceof z.ZodError)notFound();throw error;}
}
