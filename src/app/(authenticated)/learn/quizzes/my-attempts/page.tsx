import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {listOwnQuizAttemptHistoryIndex} from "@/modules/courses/quiz-attempt-service";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
export default async function OwnQuizHistoryPage(){
 const history=await listOwnQuizAttemptHistoryIndex(await getCurrentRequestContext());
 return <div className="min-w-0 space-y-4">
  <PageHeader title="My quiz attempts"
   description="Your recorded attempts across your enrolled courses. Scores appear only when results have been released."/>
  {history.items.length?<ul className="divide-y divide-border border-y border-border">
   {history.items.map(item=><li key={item.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-3">
    <div className="min-w-0">
     <p className="font-semibold text-foreground">{item.title}</p>
     <p className="text-xs text-muted-foreground">Attempt {item.attemptNumber} · {item.submittedAt?"Submitted":"In progress"}</p>
    </div>
    <Link className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9"
     href={"/learn/courses/"+encodeURIComponent(item.deliveryId)+"/quizzes/"+encodeURIComponent(item.quizId)}>
      Open quiz
    </Link>
   </li>)}
  </ul>:<EmptyState title="No quiz attempts yet" description="Your submitted and in-progress quiz attempts will appear here."/>}
  {history.hasMore?<p className="text-xs text-muted-foreground">Only the newest 200 attempts are displayed.</p>:null}
 </div>;
}
