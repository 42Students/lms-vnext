"use client";
import { useEffect, useId, useRef, useState, type DragEvent, type ReactNode } from "react";
import { cx } from "@/lib/class-names";
import { FileUpload, fileMatchesAccept, fileSizeIsValid } from "./file-upload";
import { Button } from "./button";
export type FileDropzoneProps = {
  label:string;
  onFiles:(files:FileList|null)=>void;
  accept?:string;
  multiple?:boolean;
  maxBytes?:number;
  progress?: number;
  showSelectedFiles?: boolean;
  showImagePreview?: boolean;
  imagePreviewKind?: "attachment" | "profile";
  disabled?:boolean;
  required?:boolean;
  pickerUnavailable?:boolean;
  helper?:string;
  fallback?:ReactNode;
  className?:string;
};
/** Drag and picker both enforce the same client-side validation before delegation. */
export function FileDropzone({label,onFiles,accept,multiple,maxBytes,progress,showSelectedFiles=false,showImagePreview=false,imagePreviewKind="attachment",disabled=false,required=false,pickerUnavailable=false,helper,fallback,className}:FileDropzoneProps) {
  const errorId = useId();
  const unavailable = disabled || pickerUnavailable;
  const [dragging,setDragging]=useState(false);
  const [pickerResetToken,setPickerResetToken]=useState(0);
  const [dropError,setDropError]=useState<string|null>(null);
  const [droppedNames,setDroppedNames]=useState<string[]>([]);
  const [dropPreviewFile,setDropPreviewFile]=useState<File|null>(null);
  const [dropPreviewUrl,setDropPreviewUrl]=useState<string|null>(null);
  const droppedRef=useRef(false);
  const onFilesRef=useRef(onFiles);
  useEffect(()=>{onFilesRef.current=onFiles;},[onFiles]);
  useEffect(()=>{
    if(!showImagePreview||!dropPreviewFile||!dropPreviewFile.type.startsWith("image/")){setDropPreviewUrl(null);return;}
    const url=URL.createObjectURL(dropPreviewFile);setDropPreviewUrl(url);
    return ()=>URL.revokeObjectURL(url);
  },[dropPreviewFile,showImagePreview]);
  useEffect(()=>{if(!unavailable)return;setDragging(false);setDropError(null);setDroppedNames([]);setDropPreviewFile(null);setDropPreviewUrl(null);if(droppedRef.current){droppedRef.current=false;onFilesRef.current(null);}},[unavailable]);
  function onDrop(event:DragEvent<HTMLDivElement>){
    event.preventDefault();setDragging(false);if(unavailable)return;
    const files=event.dataTransfer.files;
    if(!files.length)return;
    // Drop and picker are mutually exclusive selections: remount the picker
    // to clear any older visible FileList without resetting the parent's new drop.
    setPickerResetToken(current=>current+1);
    setDropPreviewUrl(null);
    if(!multiple&&files.length>1){droppedRef.current=false;setDroppedNames([]);setDropPreviewFile(null);setDropError("Select only one file.");onFiles(null);return;}
    if(Array.from(files).some(file=>!fileSizeIsValid(file.size,maxBytes))){droppedRef.current=false;setDroppedNames([]);setDropPreviewFile(null);setDropError("This file is larger than the allowed limit.");onFiles(null);return;}
    if(Array.from(files).some(file=>!fileMatchesAccept(file,accept))){droppedRef.current=false;setDroppedNames([]);setDropPreviewFile(null);setDropError("This file type is not allowed.");onFiles(null);return;}
    setDropError(null);setDroppedNames(Array.from(files,file=>file.name));setDropPreviewFile(files[0]??null);droppedRef.current=true;onFiles(files);
  }
  function clearDropped() {
    if (unavailable) return;
    droppedRef.current = false;
    setDroppedNames([]);
    setDropPreviewFile(null);
    setDropPreviewUrl(null);
    setDropError(null);
    onFiles(null);
  }
  return <div data-slot="file-dropzone" role="group" aria-label={label} aria-required={required || undefined}
    aria-invalid={dropError ? true : undefined} aria-describedby={dropError ? errorId : undefined}
    onDragOver={event=>{if(!unavailable && Array.from(event.dataTransfer.types).includes("Files")){event.preventDefault();setDragging(true);}}}
    onDragLeave={event => { const next = event.relatedTarget; if (!(next instanceof Node) || !event.currentTarget.contains(next)) setDragging(false); }}
    onDrop={onDrop}
    className={cx("min-w-0 rounded-[var(--lms-field-radius)] border border-dashed border-[var(--lms-neutral-300)] bg-[var(--lms-neutral-50)] p-4 transition-colors duration-150",dragging?"border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)]":"",unavailable?"opacity-50":"",className)}>
    <FileUpload key={pickerResetToken} label={label} onFiles={files=>{droppedRef.current=false;setDroppedNames([]);setDropPreviewFile(null);setDropError(null);onFiles(files);}} accept={accept} multiple={multiple} maxBytes={maxBytes} progress={progress} showSelectedFiles={showSelectedFiles} showImagePreview={showImagePreview} imagePreviewKind={imagePreviewKind} disabled={disabled} required={required} pickerUnavailable={pickerUnavailable} helper={helper} fallback={fallback}/>
    <p className="mt-2 text-[12px] text-[var(--lms-muted-text)]">{unavailable ? "File selection is currently unavailable." : "Drag a file here or use the file picker."}</p>
    {showSelectedFiles && droppedNames.length>0 && !unavailable
      ? <ul aria-label="Dropped files" className="mt-2 space-y-1 text-[13px] leading-5 text-[var(--lms-body-text)]">
          {droppedNames.map((name,index)=><li key={`${index}-${name}`} className="break-all">{name}</li>)}
        </ul> : null}
    {showSelectedFiles && droppedNames.length > 0 && !unavailable
      ? <Button type="button" variant="ghost" size="sm" onClick={clearDropped}
          aria-label="Remove dropped files" className="mt-1 !min-h-9 !px-2 max-[767px]:!min-h-11">
          Remove dropped files
        </Button> : null}
    {showImagePreview&&dropPreviewFile&&dropPreviewUrl&&!unavailable
      ? <div data-slot="image-drop-preview" data-preview-kind={imagePreviewKind}
          className={cx("mt-2 border border-[var(--lms-neutral-200)] bg-white",
            imagePreviewKind === "profile" ? "h-[194px] w-[175px] max-w-full overflow-hidden rounded-[8px]" : "rounded-[10px] p-2")}>
          <img src={dropPreviewUrl} alt={`${label} preview`}
            className={imagePreviewKind === "profile" ? "h-full w-full object-cover object-center" : "max-h-40 max-w-full rounded-[6px] object-contain"} />
        </div> : null}
    {droppedNames.length>0 && typeof progress==="number" && Number.isFinite(progress) && !unavailable
      ? <div role="progressbar" aria-label={`${label} upload progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.max(0,Math.min(100,progress))}
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--lms-primary-light)]">
          <div className="h-full rounded-full bg-[var(--lms-primary)] transition-[width] duration-150 motion-reduce:transition-none" style={{width:`${Math.max(0,Math.min(100,progress))}%`}} />
        </div> : null}
    {dropError&&!unavailable?<p id={errorId} role="alert" className="mt-2 text-[12px] text-[var(--lms-error-text)]">{dropError}</p>:null}
  </div>;
}
