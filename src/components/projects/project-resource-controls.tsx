"use client";

import {
  type FormEvent,
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
};

function ResourceForm({
  title,
  description,
  url,
  required,
  onTitle,
  onDescription,
  onUrl,
  onRequired,
}: {
  title: string;
  description: string;
  url: string;
  required: boolean;
  onTitle: (value: string) => void;
  onDescription: (value: string) => void;
  onUrl: (value: string) => void;
  onRequired: (value: boolean) => void;
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
      <label className="flex items-center gap-2 text-sm font-semibold text-body">
        <input
          type="checkbox"
          checked={required}
          onChange={(event) =>
            onRequired(event.target.checked)
          }
        />
        Required resource
      </label>
    </div>
  );
}

export function CreateProjectResourceControl({
  projectId,
}: {
  projectId: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");
  const [url, setUrl] = useState("");
  const [required, setRequired] =
    useState(false);
  const [pending, setPending] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

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
          required,
        },
      );
      setOpen(false);
      setTitle("");
      setDescription("");
      setUrl("");
      setRequired(false);
      showToast({
        tone: "success",
        title: "Project resource added",
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
        Add resource
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Add Project resource"
        description="Share a safe HTTP(S) link or an internal text resource with the Project team."
      >
        <form
          onSubmit={submit}
          className="grid gap-4"
        >
          <ResourceForm
            title={title}
            description={description}
            url={url}
            required={required}
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
              onClick={() => setOpen(false)}
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
  const [pending, setPending] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

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
        onOpenChange={setEditOpen}
        title="Edit Project resource"
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
              onClick={() =>
                setEditOpen(false)
              }
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
