"use client";
export function TpoNoticeDeleteConfirm({id,version}:{id:string;version:number}){
 return <form method="post" action={"/api/placements/tpo/announcements/"+encodeURIComponent(id)+"/lifecycle"}
  className="mt-4 flex flex-wrap gap-2"
  onSubmit={event=>{
   if(!window.confirm("Delete this announcement?\nStudents stop seeing it, and its notices are taken back."))
    event.preventDefault();
  }}>
  <input type="hidden" name="expectedVersion" value={version}/>
  <input type="hidden" name="action" value="DELETE"/>
  <button type="submit" className="min-h-11 rounded-md border border-border px-4 text-sm text-primary-text">
   Delete
  </button>
 </form>;
}
