/** Clipboard failures must leave the one-time URL available for manual selection. */
export async function copyCompanyShareUrl(
 url:string,write:(value:string)=>Promise<unknown>,
):Promise<"COPIED"|"MANUAL_COPY">{
 try{await write(url);return "COPIED";}
 catch{return "MANUAL_COPY";}
}
