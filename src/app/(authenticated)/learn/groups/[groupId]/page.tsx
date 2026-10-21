import Link from "next/link";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {LearnerGroupLists} from "@/components/groups/learner-group-lists";
import {getLearnerGroupDetail} from "@/modules/groups/learner-group-detail-service";
export const dynamic="force-dynamic";
export default async function LearnerGroupDetailPage({params}:{
 params:Promise<{groupId:string}>;
}){
 const {groupId}=await params;
 const group=await getLearnerGroupDetail(await getCurrentRequestContext(),groupId);
 if(!group)notFound();
 return <div className="min-w-0 space-y-4">
  <PageHeader title={group.name} description={group.description??"Group details"}/>
  <Link href="/learn/groups" className="inline-flex min-h-9 items-center font-semibold text-link underline">← All groups</Link>
  <dl className="grid gap-3 border-y border-border py-3 text-sm sm:grid-cols-2">
   <div><dt className="font-semibold">Group type</dt><dd>{group.kind.replaceAll("_"," ")}</dd></div>
   <div><dt className="font-semibold">Status</dt><dd>{group.status}</dd></div>
   <div><dt className="font-semibold">Members</dt><dd>{group.activeCount}{group.capacity===null?"":" / "+group.capacity}</dd></div>
   <div><dt className="font-semibold">Your membership</dt><dd>{group.memberState??"Not joined"}</dd></div>
  </dl>
  <LearnerGroupLists mine={group.memberState?[group]:[]}
   open={group.joinOpen?[group]:[]}/>
 </div>;
}
