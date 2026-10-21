"use client";

import { useSearchParams } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";
import styles from "./legacy-project-tabs.module.css";
import { canonicalLearnerProjectTab, LEARNER_PROJECT_DETAIL_TABS } from "@/modules/projects/learner-project-tab-alias-model";
import { learnerProjectTabHref,learnerProjectTabSwitchAllowed } from "@/modules/projects/learner-project-tab-href-model";

/** The same underline tabs across all project detail routes. */
export function LearnerProjectTabs({ projectId }: { projectId: string }) {
  const searchParams = useSearchParams();
  const active = canonicalLearnerProjectTab(searchParams.get("tab"));
  return <div onClickCapture={event=>{
    const target=event.target;
    if(!(target instanceof Element))return;
    const link=target.closest("a[href]");
    if(!link||!searchParams.get("taskId"))return;
    const href=link.getAttribute("href");
    if(!href)return;
    const nextTab=canonicalLearnerProjectTab(new URL(href,window.location.href).searchParams.get("tab"));
    if(nextTab===active)return;
    // Switching away from an open task can discard an unsent comment/form.
    // A conservative confirmation protects drafts without changing the URL model.
    const decision=learnerProjectTabSwitchAllowed({
      currentProjectId:projectId,targetProjectId:projectId,
      dirty:true,confirmedDiscard:false,
    });
    if(!decision.allowed&&!window.confirm(decision.prompt??"Discard unsaved task changes?")){
      event.preventDefault();
    }
  }}><Tabs className={styles.legacy} ariaLabel="Project sections" renderPanel={false} value={active}
    items={LEARNER_PROJECT_DETAIL_TABS.map(tab => ({
      value: tab.key,
      label: tab.label,
      href: learnerProjectTabHref(projectId, tab.key, searchParams),
    }))} /></div>;
}
