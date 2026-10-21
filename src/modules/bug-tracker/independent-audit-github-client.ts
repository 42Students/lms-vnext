import "server-only";
import {createSign} from "node:crypto";

const REPO="42Students/lms-findings";
const API="https://api.github.com";
const HEAD="main";
const sha=/^[a-f0-9]{40}$/i;
const MAX_INBOX_FILES=2000;
export type AuditInboxBlob={path:string;sha:string};

/** Strict fixed-repo read client. App credentials are never exposed in any
 * response, log, URL or exception. A classic token is a local-only fallback. */
export function independentAuditGithubConfigured(){
 return Boolean(process.env.AUDIT_FINDINGS_GITHUB_TOKEN?.trim()||
  (process.env.AUDIT_FINDINGS_GITHUB_APP_ID?.trim()&&
   process.env.AUDIT_FINDINGS_GITHUB_INSTALLATION_ID?.trim()&&
   process.env.AUDIT_FINDINGS_GITHUB_PRIVATE_KEY?.trim()));
}
async function githubJson(path:string,token:string,method:"GET"|"POST"="GET") {
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),20000);
 try{
  const response=await fetch(API+path,{
   method,signal:controller.signal,cache:"no-store",
   ...(method==="POST"?{body:JSON.stringify({repositories:["lms-findings"],permissions:{contents:"read"}})}:{}),
   headers:{
    Authorization:"Bearer "+token,
    Accept:"application/vnd.github+json",
    "X-GitHub-Api-Version":"2022-11-28",
    ...(method==="POST"?{"Content-Type":"application/json"}:{}),
   },
  });
  if(!response.ok)throw new Error("Findings GitHub request failed: HTTP "+response.status);
  return await response.json() as unknown;
 }finally{clearTimeout(timeout);}
}
function record(input:unknown):Record<string,unknown>{
 if(input===null||typeof input!=="object"||Array.isArray(input))
  throw new Error("Malformed findings GitHub response");
 return input as Record<string,unknown>;
}
async function accessToken():Promise<string>{
 const direct=process.env.AUDIT_FINDINGS_GITHUB_TOKEN?.trim();
 if(direct)return direct;
 const id=process.env.AUDIT_FINDINGS_GITHUB_APP_ID?.trim()??"";
 const installation=process.env.AUDIT_FINDINGS_GITHUB_INSTALLATION_ID?.trim()??"";
 const privateKey=process.env.AUDIT_FINDINGS_GITHUB_PRIVATE_KEY?.trim()??"";
 if(!/^\d+$/.test(id)||!/^\d+$/.test(installation)||!privateKey)
  throw new Error("Findings sync credentials are not configured");
 const now=Math.floor(Date.now()/1000);
 const encode=(value:unknown)=>Buffer.from(JSON.stringify(value)).toString("base64url");
 const unsigned=encode({alg:"RS256",typ:"JWT"})+"."+encode({
  iat:now-60,exp:now+540,iss:id,
 });
 const signature=createSign("RSA-SHA256").update(unsigned).sign(
  privateKey.replace(/\\n/g,"\n"),"base64url");
 const jwt=unsigned+"."+signature;
 const response=record(await githubJson(
  "/app/installations/"+encodeURIComponent(installation)+"/access_tokens",jwt,"POST",
 ));
 if(typeof response.token!=="string"||!response.token)
  throw new Error("Findings GitHub installation token unavailable");
 return response.token;
}
export async function readAuditGithubInbox(){
 if(!independentAuditGithubConfigured())throw new Error("Findings GitHub credentials missing");
 const token=await accessToken();
 const head=record(await githubJson("/repos/"+REPO+"/commits/"+HEAD,token));
 if(typeof head.sha!=="string"||!sha.test(head.sha))
  throw new Error("Invalid findings GitHub commit");
 const commit=head.sha;
 const tree=record(await githubJson("/repos/"+REPO+"/git/trees/"+commit+"?recursive=1",token));
 if(tree.truncated!==false||!Array.isArray(tree.tree))
  throw new Error("Findings GitHub tree incomplete; import refused");
 const items:AuditInboxBlob[]=[];
 for(const raw of tree.tree) {
  const row=record(raw);
  if(row.type!=="blob"||typeof row.path!=="string"||!row.path.startsWith("inbox/")||
     row.path==="inbox/.gitkeep")continue;
  if(typeof row.sha!=="string"||!sha.test(row.sha))
   throw new Error("Findings GitHub blob hash malformed");
  if(items.length>=MAX_INBOX_FILES)throw new Error("Findings inbox file limit exceeded");
  items.push({path:row.path,sha:row.sha});
 }
 return {repo:REPO,commit,items,
  readBlob:(blob:AuditInboxBlob)=>readAuditGithubBlob(token,blob)};
}
async function readAuditGithubBlob(token:string,blob:AuditInboxBlob){
 if(!sha.test(blob.sha)||!/^inbox\/[a-zA-Z0-9_.-]{1,240}$/.test(blob.path))
  throw new Error("Unexpected findings inbox file path");
 const response=record(await githubJson("/repos/"+REPO+"/git/blobs/"+blob.sha,token));
 if(response.encoding!=="base64"||typeof response.content!=="string")
  throw new Error("Findings blob is not base64");
 // Base64 body can be larger than the decoded 32KB. Check BEFORE allocating.
 if(response.content.length>46000)throw new Error("Findings file exceeds 32KB");
 const bytes=Buffer.from(response.content.replace(/\s/g,""),"base64");
 if(bytes.byteLength>32768)throw new Error("Findings file exceeds 32KB");
 return bytes.toString("utf8");
}
