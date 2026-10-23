"use client";

import {type FormEvent,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {projectMutation} from "./project-api";

export function MentorProjectUpdateComposer({projectId,readOnly}:{
  projectId:string;readOnly:boolean;
}){
  const router=useRouter();
  const [message,setMessage]=useState("");
  const [pending,setPending]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [posted,setPosted]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const value=message.trim();
    if(readOnly||pending||!value||value.length>1000)return;
    setPending(true);setError(null);setPosted(false);
    try{
      await projectMutation("/api/projects/"+encodeURIComponent(projectId)+"/mentor-updates",
        "POST",{message:value});
      setMessage("");setPosted(true);router.refresh();
    }catch(error){
      setError(error instanceof Error?error.message:"Could not post update.");
    }finally{setPending(false);}
  }
  return <form onSubmit={submit} className="prototype-mentor-update-composer"
    aria-label="Post project update">
    <div className="prototype-mentor-card-title">
      <h2>Post an update</h2><span>Visible in this project’s activity and overview</span>
    </div>
    <label htmlFor={"mentor-project-update-"+projectId} className="sr-only">
      Tell the team something
    </label>
    <textarea id={"mentor-project-update-"+projectId} rows={3}
      value={message} onChange={event=>{setMessage(event.target.value);setPosted(false);}}
      maxLength={1000} readOnly={readOnly||pending}
      placeholder="Tell the team something. It shows here and on their Overview." />
    <div className="prototype-mentor-update-footer">
      <span>{message.trim().length} / 1000</span>
      {error?<span role="alert" className="text-error">{error}</span>:null}
      {posted?<span role="status">Update posted to the activity feed.</span>:null}
      <Button type="submit" size="sm" disabled={readOnly||pending||!message.trim()}
        loading={pending}>Post</Button>
    </div>
    {readOnly?<p className="prototype-mentor-summary-empty">
      This project is read-only; updates cannot be posted.
    </p>:null}
  </form>;
}
