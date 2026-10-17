import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import {legacySuperAdminDestination} from "@/modules/admin-ui/legacy-superadmin-destination-model";

export default async function LegacySuperAdminRedirect({params,searchParams}:{
 params:Promise<{legacy:string[]}>;
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 if(!isSuperAdmin(context))redirect("/dashboard");
 const [{legacy},query]=await Promise.all([params,searchParams]);
 const type=typeof query.type==="string"?query.type:undefined;
 const destination=legacySuperAdminDestination(legacy,type);
 if(!destination)notFound();
 // Drop unknown legacy query keys. A relevant text query can be preserved without
 // accidentally routing old object IDs into a different, tenant-sensitive view.
 const search=new URLSearchParams();
 if(typeof query.q==="string"&&query.q.length<=100)search.set("q",query.q);
 return redirect(destination+(search.size?"?"+search.toString():""));
}
