import {z} from "zod";
const id=z.string().uuid();
export type FileDeleteDialog={projectId:string;resourceId:string;fileId:string;fileName:string;revision:string};
export function resourceFileDeletePrompt(input:FileDeleteDialog){
 id.parse(input.projectId);id.parse(input.resourceId);id.parse(input.fileId);
 const name=z.string().trim().min(1).max(255).parse(input.fileName);
 z.string().min(1).max(120).parse(input.revision);
 return {title:"Delete file?",description:"Remove "+name+" from this Project resource? This action cannot be undone.",confirmLabel:"Delete file",cancelLabel:"Keep file"};
}
/** Client confirmation protects against click-through; backend must independently enforce scope/version. */
export function canConfirmResourceFileDelete(input:FileDeleteDialog,acknowledged:boolean,
 pending:boolean,current:{projectId:string;resourceId:string;fileId:string;revision:string}|null){
 return acknowledged&&!pending&&Boolean(current)&&current!.projectId===input.projectId&&
 current!.resourceId===input.resourceId&&current!.fileId===input.fileId&&
 current!.revision===input.revision;
}
