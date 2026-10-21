"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { projectMutation } from "./project-api";

/** College-admin and acting-college super-admin action; never exposed to mentors. */
export function ProjectTeamRosterReconcile({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);

  async function checkRoster() {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    try {
      const result = await projectMutation(
        "/api/projects/" + encodeURIComponent(projectId) + "/team-reconcile",
        "POST", {},
      ) as { changed: number };
      const count = result.changed;
      if (count > 0) {
        showToast({ tone: "success",
          title: "Fixed " + count + " member row" + (count === 1 ? "" : "s") + " to match the team." });
        router.refresh();
      } else {
        showToast({ tone: "success", title: "The roster already matches the team." });
      }
    } catch (error) {
      showToast({ tone: "error", title: "Could not check the roster.",
        description: error instanceof Error ? error.message : undefined });
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return <Button size="sm" variant="secondary" loading={pending}
    disabled={pending} onClick={() => void checkRoster()}>
    {pending ? "Checking roster…" : "Check roster"}
  </Button>;
}
