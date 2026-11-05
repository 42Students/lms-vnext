"use client";
import { Alert } from "@/components/ui/alert";
import {safeProjectExternalHref} from "@/modules/projects/mentor-workspace-evidence-model";
import { TextLink } from "@/components/ui/text-link";

/** Verified resource URLs use a real, keyboard-accessible same-tab anchor.
 * No popup or silent blocked-tab state; unsafe source URLs are never rendered.
 */
export function ProjectResourceOpenLink({url,linkText="Open resource ↗"}:{
 url:string|null;linkText?:string;
}){
 const safe=url?safeProjectExternalHref(url):null;
 if(!url)return <Alert tone="info" className="mt-3">This resource has no link or file attached yet.</Alert>;
 if(!safe)return <Alert tone="error" className="mt-3">This resource has an invalid address.</Alert>;
 return <TextLink href={safe} rel="noopener noreferrer"
  className="mt-3 inline-flex min-h-11 max-w-full items-center break-all">
  {linkText}
 </TextLink>;
}
