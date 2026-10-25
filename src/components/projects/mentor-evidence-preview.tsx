"use client";

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";

/** Browser previews are optional; third-party providers may disallow framing.
 * Only safe links checked by the server and recognisable image/PDF resources
 * are embedded, sandboxed without script, forms or same-origin privileges. */
export function MentorEvidencePreview({title,href,kind}:{
  title:string;href:string;kind:string;
}){
  const [open,setOpen]=useState(false);
  const previewable=(()=>{
    try{
      const url=new URL(href);
      const supported=/\.(pdf|png|jpe?g|webp|gif)$/i.test(url.pathname)||
        /^(image\/(png|jpe?g|webp|gif)|application\/pdf)$/i.test(kind);
      return (url.protocol==="https:"||url.protocol==="http:")&&
        !url.username&&!url.password&&supported;
    }catch{return false;}
  })();
  return <>
    {previewable?<Button type="button" size="sm" variant="secondary"
      onClick={()=>setOpen(true)}>Zoom</Button>:null}
    <a rel="noopener noreferrer" href={href}>Open full size ↗</a>
    {previewable?<Dialog title={"Preview · "+title}
      description="This preview is read-only. Some file providers block embedding; use Open full size if it does not load."
      open={open} onOpenChange={setOpen}>
      <div className="prototype-mentor-evidence-preview">
        <iframe title={"Evidence preview: "+title} sandbox=""
          referrerPolicy="no-referrer" loading="lazy" src={open?href:undefined} />
        <div><a href={href} rel="noopener noreferrer">
          Open full size ↗</a>
          <Button type="button" size="sm" variant="secondary" onClick={()=>setOpen(false)}>
            Close preview
          </Button>
        </div>
      </div>
    </Dialog>:null}
  </>;
}
