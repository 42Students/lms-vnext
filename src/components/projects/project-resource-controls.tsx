"use client";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { projectMutation } from "./project-api";

type CanonicalResourceType="FILE"|"LINK"|"DOCUMENT"|"CODE"|"NOTE"|"ENVIRONMENT";
type LegacyResourceType="PDF"|"DOC"|"PPT"|"VIDEO";
type ResourceTypeChoice=CanonicalResourceType|LegacyResourceType;
const legacyTypes:readonly LegacyResourceType[]=["PDF","DOC","PPT","VIDEO"];
function isLegacy(value:ResourceTypeChoice):value is LegacyResourceType{
 return legacyTypes.some(kind=>kind===value);
}
function canonicalResourceType(value:ResourceTypeChoice):CanonicalResourceType{
 if(value==="PDF")return "FILE";
 if(value==="DOC"||value==="PPT")return "DOCUMENT";
 if(value==="VIDEO")return "LINK";
 return value;
}
function initialResourceChoice(resource:{resourceType?:CanonicalResourceType;
 legacyResourceKind?:string|null}):ResourceTypeChoice{
 const legacy=resource.legacyResourceKind;
 return legacy&&legacyTypes.some(kind=>kind===legacy)?
   legacy as LegacyResourceType:resource.resourceType??"LINK";
}
type ResourceMetadata={
  resourceType:ResourceTypeChoice;
  status:"ACTIVE"|"DRAFT"|"ARCHIVED";
  pinned:boolean;accessNotes:string;sprintId:string;taskId:string;
};
const defaultMetadata:ResourceMetadata={
  resourceType:"LINK",status:"ACTIVE",pinned:false,accessNotes:"",sprintId:"",taskId:"",
};
type RelatedOption={id:string;label:string};
type Resource = {
  id: string;
  updatedAt: Date | string;
  title: string;
  description: string | null;
  url: string | null;
  required: boolean;
  visibility: "TEAM" | "MENTOR_ONLY";
  resourceType?:CanonicalResourceType;legacyResourceKind?:string|null;status?:ResourceMetadata["status"];
  pinned?:boolean;accessNotes?:string|null;sprintId?:string|null;taskId?:string|null;
};

function ResourceForm({
  title,
  description,
  url,
  required,
  visibility,
  metadata,onMetadata,sprints,tasks,
  onVisibility,
  onTitle,
  onDescription,
  onUrl,
  onRequired,
  isLearner = false,
}: {
  title: string;
  description: string;
  url: string;
  required: boolean;
  visibility: "TEAM" | "MENTOR_ONLY";
  metadata:ResourceMetadata;onMetadata:(metadata:ResourceMetadata)=>void;
  sprints:readonly RelatedOption[];tasks:readonly RelatedOption[];
  onVisibility: (value: "TEAM" | "MENTOR_ONLY") => void;
  onTitle: (value: string) => void;
  onDescription: (value: string) => void;
  onUrl: (value: string) => void;
  onRequired: (value: boolean) => void;
  isLearner?: boolean;
}) {
  return (
    <div className="grid min-w-0 gap-[var(--lms-space-4)] md:grid-cols-2">
      <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] md:col-span-2">
        <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Title <span aria-hidden="true" className="text-error">*</span>
        </span>
        <Input
          required
          maxLength={200}
          value={title}
          onChange={(event) =>
            onTitle(event.target.value)
          }
        />
      </label>
      <label>
        <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          URL
        </span>
        <Input
          type="url"
          inputMode="url"
          maxLength={2048}
          value={url}
          placeholder="https://..."
          onChange={(event) =>
            onUrl(event.target.value)
          }
        />
      </label>
      <label className="md:col-span-2">
        <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Description
        </span>
        <Textarea
          maxLength={4000}
          value={description}
          placeholder="Use a description when there is no external link."
          onChange={(event) =>
            onDescription(event.target.value)
          }
        />
      </label>
      {!isLearner ? <details className="min-w-0 md:col-span-2 border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-2)]" open={metadata.status!=="ACTIVE"||metadata.resourceType!=="LINK"||metadata.pinned||Boolean(metadata.accessNotes||metadata.sprintId||metadata.taskId)}>
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-[13px] font-semibold text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Resource details</summary>
        <div className="mt-[var(--lms-space-3)] grid min-w-0 gap-[var(--lms-space-4)]">
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Type
          <Select value={metadata.resourceType}
            onChange={event=>onMetadata({...metadata,resourceType:event.target.value as ResourceMetadata["resourceType"]})}
            className="w-full">
            {(["LINK","PDF","DOC","PPT","VIDEO","FILE","DOCUMENT","CODE","NOTE","ENVIRONMENT"] as const).map(value=>
              <option key={value} value={value}>{["DOC","PPT","PDF"].includes(value)?value:value[0]+value.slice(1).toLowerCase()}</option>)}
          </Select>
        </label>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status
          <Select value={metadata.status}
            onChange={event=>onMetadata({...metadata,status:event.target.value as ResourceMetadata["status"]})}
            className="w-full">
            <option value="ACTIVE">Active</option><option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </label>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Related sprint
          <Select value={metadata.sprintId}
            onChange={event=>onMetadata({...metadata,sprintId:event.target.value,taskId:""})}
            className="w-full">
            <option value="">No sprint</option>
            {sprints.map(option=><option key={option.id} value={option.id}>{option.label}</option>)}
          </Select>
        </label>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Related task
          <Select value={metadata.taskId}
            onChange={event=>onMetadata({...metadata,taskId:event.target.value})}
            className="w-full">
            <option value="">No task</option>
            {tasks.map(option=><option key={option.id} value={option.id}>{option.label}</option>)}
          </Select>
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-body">
          <Checkbox checked={metadata.pinned}
            onChange={event=>onMetadata({...metadata,pinned:event.target.checked})}/> Pinned
        </label>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Access notes
          <Textarea maxLength={4000} placeholder="e.g. Requires college email to view" value={metadata.accessNotes}
            onChange={event=>onMetadata({...metadata,accessNotes:event.target.value})}/>
        </label>
        </div>
      </details> : null}
      {!isLearner ? <label className="grid min-w-0 md:col-span-2 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
        Visible to
        <Select value={visibility} onChange={event => onVisibility(event.target.value as "TEAM" | "MENTOR_ONLY")}
          className="w-full">
          <option value="TEAM">Everyone</option>
          <option value="MENTOR_ONLY">Mentors only</option>
        </Select>
      </label> : null}
      {!isLearner ? <label className="flex items-center gap-2 text-sm font-semibold text-body md:col-span-2">
        <Checkbox
          checked={required}
          onChange={(event) =>
            onRequired(event.target.checked)
          }
        />
        Required resource
      </label> : null}
    </div>
  );
}

export function CreateProjectResourceControl({
  projectId, isLearner = false, sprints=[], tasks=[],
}: {
  projectId: string;
  isLearner?: boolean;
  sprints?:readonly RelatedOption[];tasks?:readonly RelatedOption[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [discardOpen,setDiscardOpen]=useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");
  const [url, setUrl] = useState("");
  const [required, setRequired] =
    useState(false);
  const [visibility, setVisibility] = useState<"TEAM" | "MENTOR_ONLY">("TEAM");
  const [metadata,setMetadata]=useState<ResourceMetadata>(defaultMetadata);
  const [pending, setPending] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const dirty=Boolean(title.trim()||description.trim()||url.trim()||required||visibility!=="TEAM"||
    JSON.stringify(metadata)!==JSON.stringify(defaultMetadata));
  useEffect(()=>{
    if(!open||!dirty)return;
    const guard=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
    window.addEventListener("beforeunload",guard);
    return ()=>window.removeEventListener("beforeunload",guard);
  },[open,dirty]);
  function requestClose(){
    if(pending)return;
    if(dirty)setDiscardOpen(true);
    else setOpen(false);
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);
    if (!description.trim() && !url.trim()) {
      setError(
        "Add a description or an HTTP(S) resource URL.",
      );
      return;
    }

    setPending(true);
    try {
      await projectMutation(
        `/api/projects/${projectId}/resources`,
        "POST",
        {
          title: title.trim(),
          description:
            description.trim() || undefined,
          url: url.trim() || undefined,
          required: isLearner ? false : required,
          visibility: isLearner ? "TEAM" : visibility,
          ...(!isLearner?{resourceType:canonicalResourceType(metadata.resourceType),
            legacyResourceKind:isLegacy(metadata.resourceType)?metadata.resourceType:null,
            status:metadata.status,
            pinned:metadata.pinned,accessNotes:metadata.accessNotes||null,
            sprintId:metadata.sprintId||null,taskId:metadata.taskId||null}:{}),
        },
      );
      setOpen(false);
      setTitle("");
      setDescription("");
      setUrl("");
      setRequired(false);
      setVisibility("TEAM");
      setMetadata(defaultMetadata);
      showToast({
        tone: "success",
        title: "Resource added.",
      });
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not add the resource.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setOpen(true)}
      >
        {isLearner ? "Share a resource" : "Add resource"}
      </Button>
      <Dialog
        open={open && !discardOpen}
        onOpenChange={next=>{if(next)setOpen(true);else requestClose();}}
        title={isLearner ? "Share a resource" : "Add resource"}
        description={isLearner?"Share a safe HTTP(S) link or an internal text resource with the Project team.":"For section-wide edits, use Edit resource library. Individual resources can be added here without replacing the full library."}
      >
        <form
          onSubmit={submit}
          className="grid min-w-0 gap-[var(--lms-space-4)]"
        >
          <ResourceForm
            isLearner={isLearner}
            title={title}
            description={description}
            url={url}
            required={required}
            visibility={visibility}
            metadata={metadata} onMetadata={setMetadata} sprints={sprints} tasks={tasks}
            onVisibility={setVisibility}
            onTitle={setTitle}
            onDescription={setDescription}
            onUrl={setUrl}
            onRequired={setRequired}
          />
          {error ? (
            <p
              role="alert"
              className="m-0 text-sm font-semibold text-error"
            >
              {error}
            </p>
          ) : null}
          <div className="flex min-w-0 flex-col-reverse gap-[var(--lms-space-2)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={pending}
              onClick={requestClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              loading={pending}
              disabled={
                pending ||
                !title.trim() ||
                (!description.trim() &&
                  !url.trim())
              }
            >
              {pending ? "Saving…" : "Add resource"}
            </Button>
          </div>
        </form>
      </Dialog>
      <ConfirmDialog open={discardOpen} onOpenChange={setDiscardOpen}
        title="Discard this resource?"
        description="You have unsaved project changes. Leave this page and discard them?"
        confirmLabel="Discard changes" pending={pending}
        onConfirm={()=>{setDiscardOpen(false);setOpen(false);
          setTitle("");setDescription("");setUrl("");setRequired(false);setVisibility("TEAM");setMetadata(defaultMetadata);}}/>
    </>
  );
}

export function ProjectResourceActions({
  projectId,
  resource,sprints=[],tasks=[],
}: {
  projectId: string;
  resource: Resource;
  sprints?:readonly RelatedOption[];tasks?:readonly RelatedOption[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [editOpen, setEditOpen] =
    useState(false);
  const [editDiscardOpen,setEditDiscardOpen]=useState(false);
  const [archiveOpen, setArchiveOpen] =
    useState(false);
  const [title, setTitle] = useState(
    resource.title,
  );
  const [description, setDescription] =
    useState(resource.description ?? "");
  const [url, setUrl] = useState(
    resource.url ?? "",
  );
  const [required, setRequired] =
    useState(resource.required);
  const [visibility, setVisibility] = useState<"TEAM" | "MENTOR_ONLY">(resource.visibility);
  const [metadata,setMetadata]=useState<ResourceMetadata>({
    resourceType:initialResourceChoice(resource),status:resource.status??"ACTIVE",
    pinned:resource.pinned??false,accessNotes:resource.accessNotes??"",
    sprintId:resource.sprintId??"",taskId:resource.taskId??"",
  });
  const [pending, setPending] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const dirty=title!==resource.title||description!==(resource.description??"")||
    url!==(resource.url??"")||required!==resource.required||visibility!==resource.visibility||
    metadata.resourceType!==initialResourceChoice(resource)||metadata.status!==(resource.status??"ACTIVE")||
    metadata.pinned!==(resource.pinned??false)||metadata.accessNotes!==(resource.accessNotes??"")||
    metadata.sprintId!==(resource.sprintId??"")||metadata.taskId!==(resource.taskId??"");
  useEffect(()=>{
    if(!editOpen||!dirty)return;
    const guard=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
    window.addEventListener("beforeunload",guard);
    return ()=>window.removeEventListener("beforeunload",guard);
  },[editOpen,dirty]);
  function requestEditClose(){
    if(pending)return;
    if(dirty)setEditDiscardOpen(true);
    else setEditOpen(false);
  }

  async function save(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);
    if(!dirty){showToast({tone:"info",title:"No changes to save"});return;}
    if (!description.trim() && !url.trim()) {
      setError(
        "Add a description or an HTTP(S) resource URL.",
      );
      return;
    }

    setPending(true);
    try {
      await projectMutation(
        `/api/projects/${projectId}/resources/${resource.id}`,
        "PATCH",
        {
          expectedUpdatedAt:new Date(resource.updatedAt).toISOString(),
          title: title.trim(),
          description:
            description.trim() || null,
          url: url.trim() || null,
          required,
          visibility,
          resourceType:canonicalResourceType(metadata.resourceType),
          legacyResourceKind:isLegacy(metadata.resourceType)?metadata.resourceType:null,
          status:metadata.status,
          pinned:metadata.pinned,accessNotes:metadata.accessNotes||null,
          sprintId:metadata.sprintId||null,taskId:metadata.taskId||null,
        },
      );
      setEditOpen(false);
      showToast({
        tone: "success",
        title: "Resources updated",
      });
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Failed to update resources.",
      );
    } finally {
      setPending(false);
    }
  }

  async function archive() {
    setPending(true);
    try {
      await projectMutation(
        `/api/projects/${projectId}/resources/${resource.id}`,
        "DELETE",
        {expectedUpdatedAt:new Date(resource.updatedAt).toISOString()},
      );
      setArchiveOpen(false);
      showToast({
        tone: "success",
        title: "Project resource archived",
      });
      router.refresh();
    } catch (caught) {
      showToast({
        tone: "error",
        title: "Could not archive resource",
        description:
          caught instanceof Error
            ? caught.message
            : undefined,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="mt-[var(--lms-space-3)] flex min-w-0 flex-wrap gap-[var(--lms-space-2)]">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setTitle(resource.title);
            setDescription(
              resource.description ?? "",
            );
            setUrl(resource.url ?? "");
            setRequired(resource.required);
            setVisibility(resource.visibility);
            setMetadata({
    resourceType:initialResourceChoice(resource),status:resource.status??"ACTIVE",
    pinned:resource.pinned??false,accessNotes:resource.accessNotes??"",
    sprintId:resource.sprintId??"",taskId:resource.taskId??"",
  });
            setError(null);
            setEditOpen(true);
          }}
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setArchiveOpen(true)}
        >
          Archive
        </Button>
      </div>

      <Dialog
        open={editOpen && !editDiscardOpen}
        onOpenChange={next=>{if(next)setEditOpen(true);else requestEditClose();}}
        title="Edit resource"
      >
        <form
          onSubmit={save}
          className="grid min-w-0 gap-[var(--lms-space-4)]"
        >
          <ResourceForm
            title={title}
            description={description}
            url={url}
            required={required}
            visibility={visibility}
            metadata={metadata} onMetadata={setMetadata} sprints={sprints} tasks={tasks}
            onVisibility={setVisibility}
            onTitle={setTitle}
            onDescription={setDescription}
            onUrl={setUrl}
            onRequired={setRequired}
          />
          {error ? (
            <p
              role="alert"
              className="m-0 text-sm font-semibold text-error"
            >
              {error}
            </p>
          ) : null}
          <div className="flex min-w-0 flex-col-reverse gap-[var(--lms-space-2)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={pending}
              onClick={requestEditClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              loading={pending}
              disabled={
                pending ||
                !title.trim() ||
                (!description.trim() &&
                  !url.trim())
              }
            >
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog open={editDiscardOpen} onOpenChange={setEditDiscardOpen}
        title="Discard resource changes?"
        description="You have unsaved project changes. Leave this page and discard them?"
        confirmLabel="Discard changes" pending={pending}
        onConfirm={()=>{setEditDiscardOpen(false);setEditOpen(false);}}/>
      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={"Archive " + resource.title + "?"}
        description="The resource leaves active Project surfaces while historical Project data remains intact."
        confirmLabel="Archive resource"
        pending={pending}
        onConfirm={archive}
      />
    </>
  );
}
