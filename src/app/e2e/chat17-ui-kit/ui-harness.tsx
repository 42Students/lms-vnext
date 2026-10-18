"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { ScrollCue } from "@/components/ui/scroll-cue";
import { Tabs } from "@/components/ui/tabs";
import { ToastProvider, useToast } from "@/components/ui/toast";

function UIKitTestSurface() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPending, setConfirmPending] = useState(false);
  const [confirmInvocations, setConfirmInvocations] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tab, setTab] = useState("overview");
  const [fileStatus, setFileStatus] = useState("No file selected");
  const [pickerDisabled, setPickerDisabled] = useState(false);
  const [wideScroll, setWideScroll] = useState(true);
  const { showToast } = useToast();

  return <main className="mx-auto max-w-4xl space-y-8 p-4">
    <h1 className="text-2xl font-semibold">Chat-17 UI kit interaction harness</h1>

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
      </Drawer>
      <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen}
        title="Harness nested sheet" description="Second overlay">
        <p>Sheet content is nested above the workspace drawer.</p>
        <Button onClick={() => setSheetOpen(false)}>Close nested sheet</Button>
      </BottomSheet>
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
          <div className={wideScroll ? "w-[1200px] whitespace-nowrap p-3" : "w-28 whitespace-nowrap p-3"}>
            <span>Scroll position: first</span>
            {wideScroll ? <span className="ml-[850px]">Scroll position: last</span> : null}
          </div>
        </ScrollCue>
      </div>
    </section>

    <FilterBar title="Task filters" activeCount={1}
      search={<Input aria-label="Search harness tasks" placeholder="Search tasks"/>}
      filters={<div className="space-y-3">
        <Checkbox name="assigned" label="Assigned to me"/>
        <Checkbox name="in-progress" label="In progress"/>
      </div>}/>

    <section aria-label="Upload fixture" className="space-y-2">
      <Button variant="secondary" onClick={() => setPickerDisabled(value => !value)}>
        {pickerDisabled ? "Enable file selection" : "Disable file selection"}
      </Button>
      <FileUpload id="harness-proof" label="Project proof PDF" accept=".pdf" disabled={pickerDisabled}
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
