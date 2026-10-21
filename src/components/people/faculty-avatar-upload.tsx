"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
export function FacultyAvatarUpload({initialVersion}:{initialVersion:number}){
 const router=useRouter();
 const [pending,setPending]=useState(false),[notice,setNotice]=useState("");
 const [version,setVersion]=useState(initialVersion);
 const [awaiting,setAwaiting]=useState<string|null>(null);
 async function confirm(key:string){
  const response=await fetch("/api/people/faculty-self-document/avatar",{
    method:"PATCH",headers:{"content-type":"application/json"},
    body:JSON.stringify({objectKey:key,expectedVersion:version}),
  });
  if(!response.ok)throw new Error("Scan is pending or the profile changed.");
  const result=await response.json() as {version:number};
  setVersion(result.version);setAwaiting(null);setNotice("Profile image updated.");
  router.refresh();
 }
 async function upload(file:File){
  if(pending)return;
  if(!["image/png","image/jpeg","image/webp"].includes(file.type)||
     file.size<1||file.size>5*1024*1024){
    setNotice("Use a PNG, JPEG or WebP image under 5 MB.");return;
  }
  setPending(true);setNotice("");
  try{
   const response=await fetch("/api/people/faculty-self-document/avatar",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({contentType:file.type,sizeBytes:file.size}),
   });
   if(!response.ok)throw new Error("Unable to start a private upload.");
   const data=await response.json() as {grant:{
    objectKey:string;uploadUrl:string;requiredHeaders:Record<string,string>}};
   const upload=await fetch(data.grant.uploadUrl,{
    method:"PUT",headers:data.grant.requiredHeaders,body:file,
   });
   if(!upload.ok)throw new Error("File upload failed.");
   setAwaiting(data.grant.objectKey);
   setNotice("Uploaded. Security scanning must finish before this image is published.");
  }catch(error){setNotice(error instanceof Error?error.message:"Upload unavailable.");}
  finally{setPending(false);}
 }
 return <div className="space-y-2 text-sm">
   <label className="block font-semibold">Change profile image
     <input className="mt-2 block w-full text-sm" type="file"
       accept="image/png,image/jpeg,image/webp" disabled={pending}
       onChange={event=>{const file=event.currentTarget.files?.[0];
         if(file)void upload(file);}}/>
   </label>
   {awaiting?<Button variant="secondary" type="button" disabled={pending}
      
      onClick={()=>{setPending(true);void confirm(awaiting).catch(()=>{
        setNotice("Security scan pending. Try confirming later.");
      }).finally(()=>setPending(false));}}>
      Confirm after scan
    </Button>:null}
   {notice?<p role="status">{notice}</p>:null}
 </div>;
}
