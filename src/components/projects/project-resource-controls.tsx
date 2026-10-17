"use client";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { projectMutation } from "./project-api";

type Resource = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  required: boolean;
  visibility: "TEAM" | "MENTOR_ONLY";
};

function ResourceForm({
  title,
  description,
  url,
  required,
  visibility,
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
  onVisibility: (value: "TEAM" | "MENTOR_ONLY") => void;
  onTitle: (value: string) => void;
  onDescription: (value: string) => void;
  onUrl: (value: string) => void;
  onRequired: (value: boolean) => void;
  isLearner?: boolean;
}) {
  return (
    <div className="grid gap-4">
      <label>
        <span className="mb-1.5 block text-xs font-semibold text-body">
          Title
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
        <span className="mb-1.5 block text-xs font-semibold text-body">
          URL
        </span>
        <Input
          type="url"
          inputMode="url"
          maxLength={2048}
          value={url}
          placeholder="https://…"
          onChange={(event) =>
            onUrl(event.target.value)
          }
        />
      </label>
      <label>
        <span className="mb-1.5 block text-xs font-semibold text-body">
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
      {!isLearner ? <label className="grid gap-1 text-sm font-semibold text-body">
        Visible to
        <select value={visibility} onChange={event => onVisibility(event.target.value as "TEAM" | "MENTOR_ONLY")}
          className="min-h-10 rounded-md border border-border bg-surface px-3 py-2">
          <option value="TEAM">Everyone</option>
          <option value="MENTOR_ONLY">Mentors only</option>
        </select>
      </label> : null}
      {!isLearner ? <label className="flex items-center gap-2 text-sm font-semibold text-body">
        <input
          type="checkbox"
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
  projectId, isLearner = false,
}: {
  projectId: string;
  isLearner?: boolean;
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
  const [pending, setPending] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const dirty=Boolean(title.trim()||description.trim()||url.trim()||required||visibility!=="TEAM");
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
        },
      );
      setOpen(false);
      setTitle("");
      setDescription("");
      setUrl("");
      setRequired(false);
      setVisibility("TEAM");
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
        open={open}
        onOpenChange={next=>{if(next)setOpen(true);else requestClose();}}
        title={isLearner ? "Share a resource" : "Add resource"}
        description="Share a safe HTTP(S) link or an internal text resource with the Project team."
      >
        <form
          onSubmit={submit}
          className="grid gap-4"
        >
          <ResourceForm
            isLearner={isLearner}
            title={title}
            description={description}
            url={url}
            required={required}
            visibility={visibility}
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
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={requestClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
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
          setTitle("");setDescription("");setUrl("");setRequired(false);setVisibility("TEAM");}}/>
    </>
  );
}

export function ProjectResourceActions({
  projectId,
  resource,
}: {
  projectId: string;
  resource: Resource;
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
  const [pending, setPending] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const dirty=title!==resource.title||description!==(resource.description??"")||
    url!==(resource.url??"")||required!==resource.required||visibility!==resource.visibility;
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
          title: title.trim(),
          description:
            description.trim() || null,
          url: url.trim() || null,
          required,
          visibility,
        },
      );
      setEditOpen(false);
      showToast({
        tone: "success",
        title: "Project resource updated",
      });
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not update the resource.",
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
      <div className="mt-3 flex flex-wrap gap-2">
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
        open={editOpen}
        onOpenChange={next=>{if(next)setEditOpen(true);else requestEditClose();}}
        title="Edit resource"
      >
        <form
          onSubmit={save}
          className="grid gap-4"
        >
          <ResourceForm
            title={title}
            description={description}
            url={url}
            required={required}
            visibility={visibility}
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
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={requestEditClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
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
