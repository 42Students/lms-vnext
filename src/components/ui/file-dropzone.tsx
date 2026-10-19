"use client";
import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { cx } from "@/lib/class-names";
import { FileUpload, fileMatchesAccept, fileSizeIsValid } from "./file-upload";
export type FileDropzoneProps = {
  label:string;
  onFiles:(files:FileList|null)=>void;
  accept?:string;
  multiple?:boolean;
  maxBytes?:number;
  progress?: number;
  showSelectedFiles?: boolean;
  disabled?:boolean;
  helper?:string;
  fallback?:ReactNode;
  className?:string;
};
/** Drag and picker both enforce the same client-side validation before delegation. */
export function FileDropzone({label,onFiles,accept,multiple,maxBytes,progress,showSelectedFiles=false,disabled=false,helper,fallback,className}:FileDropzoneProps) {
  const [dragging,setDragging]=useState(false);
  const [dropError,setDropError]=useState<string|null>(null);
  const [droppedNames,setDroppedNames]=useState<string[]>([]);
  const droppedRef=useRef(false);
  const onFilesRef=useRef(onFiles);
  useEffect(()=>{onFilesRef.current=onFiles;},[onFiles]);
  useEffect(()=>{if(disabled&&droppedRef.current){droppedRef.current=false;onFilesRef.current(null);setDropError(null);setDroppedNames([]);}},[disabled]);
  function onDrop(event:DragEvent<HTMLDivElement>){
    event.preventDefault();setDragging(false);if(disabled)return;
    const files=event.dataTransfer.files;
    if(!files.length)return;
    if(!multiple&&files.length>1){setDroppedNames([]);setDropError("Select only one file.");return;}
    if(Array.from(files).some(file=>!fileSizeIsValid(file.size,maxBytes))){setDroppedNames([]);setDropError("This file is larger than the allowed limit.");return;}
    if(Array.from(files).some(file=>!fileMatchesAccept(file,accept))){setDroppedNames([]);setDropError("This file type is not allowed.");return;}
    setDropError(null);setDroppedNames(Array.from(files,file=>file.name));droppedRef.current=true;onFiles(files);
  }
  return <div data-slot="file-dropzone" onDragOver={event=>{if(!disabled){event.preventDefault();setDragging(true);}}}
    onDragLeave={()=>setDragging(false)} onDrop={onDrop}
    className={cx("min-w-0 rounded-[var(--lms-control-radius)] border border-dashed border-[var(--lms-neutral-300)] bg-[var(--lms-neutral-50)] p-4 transition-colors duration-150",dragging?"border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)]":"",disabled?"opacity-50":"",className)}>
    <FileUpload label={label} onFiles={files=>{droppedRef.current=false;setDroppedNames([]);setDropError(null);onFiles(files);}} accept={accept} multiple={multiple} maxBytes={maxBytes} progress={progress} showSelectedFiles={showSelectedFiles} disabled={disabled} helper={helper} fallback={fallback}/>
    <p className="mt-2 text-[12px] text-[var(--lms-muted-text)]">Drag a file here or use the file picker.</p>
    {showSelectedFiles && droppedNames.length>0 && !disabled
      ? <ul aria-label="Dropped files" className="mt-2 space-y-1 text-[13px] leading-5 text-[var(--lms-body-text)]">
          {droppedNames.map((name,index)=><li key={`${index}-${name}`} className="break-all">{name}</li>)}
        </ul> : null}
    {droppedNames.length>0 && typeof progress==="number" && Number.isFinite(progress) && !disabled
      ? <div role="progressbar" aria-label={`${label} upload progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.max(0,Math.min(100,progress))}
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--lms-primary-light)]">
          <div className="h-full rounded-full bg-[var(--lms-primary)] transition-[width] duration-150 motion-reduce:transition-none" style={{width:`${Math.max(0,Math.min(100,progress))}%`}} />
        </div> : null}
    {dropError?<p role="alert" className="mt-2 text-[12px] text-[var(--lms-error-text)]">{dropError}</p>:null}
  </div>;
}
