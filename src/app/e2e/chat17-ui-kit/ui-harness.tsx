"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Checkbox } from "@/components/ui/selection-controls";
import { Dialog } from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Disclosure } from "@/components/ui/disclosure";
import { Skeleton } from "@/components/ui/skeleton";
import { Drawer } from "@/components/ui/drawer";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { FileUpload } from "@/components/ui/file-upload";
import { FilterBar } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { PageLoading } from "@/components/ui/page-loading";
import { DisabledReason } from "@/components/ui/disabled-reason";
import { InlineNotice } from "@/components/ui/inline-notice";
import { ScrollCue } from "@/components/ui/scroll-cue";
import { Tabs } from "@/components/ui/tabs";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { SuperAdminInterviewOperations } from "@/components/admin/super-admin-interview-operations";

function UIKitTestSurface() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPending, setConfirmPending] = useState(false);
  const [confirmInvocations, setConfirmInvocations] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tab, setTab] = useState("overview");
  const [fileStatus, setFileStatus] = useState("No file selected");
  const [loadingLabel, setLoadingLabel] = useState("Loading projects A");
  const [pickerDisabled, setPickerDisabled] = useState(false);
  const [wideScroll, setWideScroll] = useState(true);
  const [secondWide, setSecondWide] = useState(false);
  const [inlineSaved, setInlineSaved] = useState(false);
  const { showToast } = useToast();

  return <main className="mx-auto max-w-4xl min-w-0 space-y-6 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-white p-[var(--lms-canvas-padding)]">
    <PageHeader title="Chat-17 UI kit interaction harness" />

    <section aria-label="Modal fixture">
      <Button onClick={() => setDialogOpen(true)}>Open harness dialog</Button>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}
        title="Harness confirmation" description="Keyboard focus and Back button test."
        footer={<Button onClick={() => setDialogOpen(false)}>Close harness dialog</Button>}>
        <p>Dialog body with keyboard focus.</p>
        <Input aria-label="Dialog input" placeholder="Type here"/>
      </Dialog>
    </section>

    <section aria-label="Pending destructive action fixture">
      <Button variant="danger" onClick={() => setConfirmOpen(true)}>Review harness deletion</Button>
      <p data-testid="confirm-invocations">Confirmation requests: {confirmInvocations}</p>
      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen}
        title="Delete harness workspace" confirmLabel="Delete"
        description="This is only an isolated test and performs no mutation."
        pending={confirmPending} onConfirm={() => {
          setConfirmInvocations(count => count + 1);
          setConfirmPending(true);
        }}>
        <p>Pending submissions must not be canceled or duplicated.</p>
        {confirmPending ? <Button variant="secondary" onClick={() => {
          setConfirmPending(false);
          setConfirmOpen(false);
        }}>Finish harness request</Button> : null}
      </ConfirmDialog>
    </section>

    <section aria-label="Nested overlays fixture">
      <Button variant="secondary" onClick={() => setDrawerOpen(true)}>Open harness drawer</Button>
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}
        title="Harness drawer" description="Nested history and focus test.">
        <p>The workspace drawer stays open when its sheet is dismissed.</p>
        <Button onClick={() => setSheetOpen(true)}>Open nested sheet</Button>
        <div aria-label="Drawer long content" className="h-[59.375rem] min-h-[59.375rem]">Long project activity feed</div>
      </Drawer>
      <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen}
        title="Harness nested sheet" description="Second overlay">
        <p>Sheet content is nested above the workspace drawer.</p>
        <Button onClick={() => setSheetOpen(false)}>Close nested sheet</Button>
        <div aria-label="Sheet long content" className="h-[59.375rem] min-h-[59.375rem]">More project details</div>
      </BottomSheet>
    </section>

    <section aria-label="Required field fixture">
      <FormField id="harness-roll" label="Learner roll number" required
        helper="Enter a value before continuing.">
        {()=> <Input placeholder="Learner roll number"/>}
      </FormField>
    </section>

    <section aria-label="Tabs fixture">
      <Tabs value={tab} ariaLabel="Harness tabs" onValueChange={setTab} items={[
        {value:"overview",label:"Overview",content:<p>Overview content</p>},
        {value:"locked",label:"Restricted",disabled:true,content:<p>Restricted data must not appear</p>},
        {value:"details",label:"Details",content:<p>Details content</p>},
      ]}/>
    </section>

    <section aria-label="Scroll fixture">
      <Button variant="secondary" onClick={() => setWideScroll(value => !value)}>
        {wideScroll ? "Narrow scroll content" : "Widen scroll content"}
      </Button>
      <div className="mt-2 w-56">
        <ScrollCue axis="x" label="Harness horizontal overflow">
          <div className={wideScroll ? "w-[75rem] whitespace-nowrap p-3" : "w-28 whitespace-nowrap p-3"}>
            <span>Scroll position: first</span>
            {wideScroll ? <span className="ml-[53.125rem]">Scroll position: last</span> : null}
          </div>
        </ScrollCue>
      </div>
    </section>

    <section aria-label="Secondary child scroll fixture" className="w-56 space-y-2">
      <Button variant="secondary" onClick={()=>setSecondWide(value=>!value)}>
        {secondWide ? "Shrink second child" : "Grow second child"}
      </Button>
      <ScrollCue axis="x" label="Second child resize overflow">
        <div className="w-20">First child remains small</div>
        <div data-testid="second-overflow-child" className={secondWide ? "w-[50rem]" : "w-20"}>Changing second child</div>
      </ScrollCue>
    </section>

    <FilterBar title="Task filters" activeCount={1}
      search={<Input aria-label="Search harness tasks" placeholder="Search tasks"/>}
      filters={<div className="space-y-3">
        <Checkbox name="assigned" label="Assigned to me"/>
        <Checkbox name="in-progress" label="In progress"/>
      </div>}/>

    <section aria-label="Unavailable action and feedback fixture" className="space-y-3">
      <DisabledReason reason="Assign a learner before submitting.">
        <Button disabled>Submit unassigned project</Button>
      </DisabledReason>
      <Button variant="secondary" onClick={() => setInlineSaved(true)}>
        Show inline saved notice
      </Button>
      {inlineSaved ? <InlineNotice tone="success" message="Saved inline workspace update"
        onDismiss={() => setInlineSaved(false)} successDismissMs={800}/> : null}
    </section>

    <section aria-label="Upload fixture" className="space-y-2">
      <Button variant="secondary" onClick={() => setPickerDisabled(value => !value)}>
        {pickerDisabled ? "Enable file selection" : "Disable file selection"}
      </Button>
      <p id="harness-external-help" className="text-sm">Files must be readable PDFs.</p>
      <FileUpload id="harness-proof" label="Project proof PDF" accept=".pdf" disabled={pickerDisabled}
        aria-describedby="harness-external-help"
        helper="PDF file, maximum 1 KB" maxBytes={1024}
        onFiles={files => setFileStatus(files?.length ? "Selected: " + files[0]!.name : "No file selected")}/>
      <p role="status" data-testid="file-status">{fileStatus}</p>
    </section>

    <section aria-label="Responsive private column fixture">
      <DataTable caption="Project table privacy" empty={<p>No projects</p>}
        rows={[{id:"p1",title:"Mobile pilot",secret:"DESKTOP_ONLY_PRIVATE_REVIEW"}]}
        getRowKey={row => row.id}
        columns={[
          {key:"title",header:"Project",mobilePriority:"primary",cell:row=>row.title},
          {key:"a",header:"First",mobilePriority:"secondary",cell:()=>"Public field 1"},
          {key:"b",header:"Second",mobilePriority:"secondary",cell:()=>"Public field 2"},
          {key:"c",header:"Third",mobilePriority:"secondary",cell:()=>"Public field 3"},
          {key:"d",header:"Fourth",mobilePriority:"secondary",cell:()=>"Public field 4"},
          {key:"secret",header:"Private desktop-only feedback",mobilePriority:"hidden",
            cell:row=>row.secret},
        ]}/>
    </section>

    <section aria-label="Fail closed table fixture">
      <DataTable caption="Restricted workspace security" empty="No projects"
        rows={[{id:"secure",name:"Secure workspace",review:"NEVER_SERIALIZE_PRIVATE_REVIEW"}]}
        getRowKey={row=>row.id} rowHref={()=>{throw new Error("detail route unavailable");}}
        columns={[
          {key:"name",header:"Workspace",mobilePriority:"primary",cell:row=>row.name},
          {key:"review",header:"Private review",mobilePriority:"hidden",
            mobileHiddenReason:"Review access denied",
            mobileDetail:{fieldKey:"review",canView:()=>{throw new Error("permission service unavailable");},
              href:()=>"/mentor/projects/secure/review"},
            cell:row=>row.review},
        ]}/>
    </section>

    <section aria-label="Interview grid fixture">
      <SuperAdminInterviewOperations today="2026-10-18" events={[
        {id:"interview-a",roundId:null,jobId:null,jobTitle:"Engineer",title:"Technical interview",
          companyName:"Demo Company A",status:"SCHEDULED",kind:"TECHNICAL",
          startsAt:"2026-10-18T04:00:00Z",endsAt:"2026-10-18T05:00:00Z",
          venue:"Room 101",candidateName:"Student Alpha",departmentName:"Computer Science",
          interviewer:"Mentor One",mode:"On campus"},
        {id:"interview-b",roundId:null,jobId:null,jobTitle:"Designer",title:"Portfolio interview",
          companyName:"Demo Company B",status:"SCHEDULED",kind:"PORTFOLIO",
          startsAt:"2026-10-18T04:30:00Z",endsAt:"2026-10-18T05:30:00Z",
          venue:"Room 101",candidateName:"Student Beta",departmentName:"Design",
          interviewer:"Mentor Two",mode:"On campus"},
      ]}/>
    </section>

    <section aria-label="Loading timeout reset fixture" className="space-y-2">
      <Button onClick={()=>setLoadingLabel(current=>
        current==="Loading projects A" ? "Loading projects B" : "Loading projects A")}>
        Switch loading request
      </Button>
      <PageLoading label={loadingLabel} variant="card"/>
    </section>

    <section aria-label="Loading and disclosure fixture" className="space-y-3">
      <Skeleton variant="row" count={2} label="Loading project workspace status"/>
      <Disclosure title="More workspace information">
        <p>Disclosed workspace details</p>
      </Disclosure>
    </section>

    <section aria-label="Toast fixture" className="flex gap-3">
      <Button onClick={() => showToast({tone:"success",title:"Saved harness result"})}>
        Show success notice
      </Button>
      <Button onClick={() => showToast({tone:"error",title:"Harness save failed"})}>
        Show error notice
      </Button>
    </section>
  </main>;
}

export function Chat17UIKitHarness() {
  return <ToastProvider><UIKitTestSurface/></ToastProvider>;
}
