import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { ThirdPartyLink } from "@/components/ui/third-party-link";
import { Tabs, tabNextEnabled } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { InfoPopover } from "@/components/ui/tooltip";
import { ToastStack, enqueueToast } from "@/components/ui/toast";

describe("UX-G165 shared controls — precise accessible states", () => {
  it("external link has a persistent accessible fallback target even when closed", () => {
    const html=renderToStaticMarkup(<ThirdPartyLink href="https://example.org/resource?src=course"
      label={"Long external resource ".repeat(10)} />);
    const id=html.match(/aria-controls="([^"]+)"/)?.[1];
    expect(id).toBeTruthy();
    expect(html).toContain(`id="${id}"`);
    expect(html).toContain("Show link to copy");
    expect(html).toContain("https://example.org/resource?src=course");
    expect(html).toContain("break-words");
    expect(html).toContain("class=\"hidden\"");
    expect(html).not.toContain("The link could not be opened.");
  });
  it("rejects ambiguous or insecure external links rather than making them clickable", () => {
    for(const href of ["http://example.org", "https://u:p@example.org", "https://example.org\\@evil.invalid", "https://example.org\n"]) {
      const html=renderToStaticMarkup(<ThirdPartyLink href={href} label="Visit resource" />);
      expect(html).toContain("This link is unavailable.");
      expect(html).not.toContain("<a ");
    }
  });
  it("does not create a blank tabpanel when every tab is disabled", () => {
    const disabled=renderToStaticMarkup(<Tabs ariaLabel="Restricted tabs" value="a"
      onValueChange={()=>{}} items={[{value:"a",label:"A",disabled:true},{value:"b",label:"B",disabled:true}]} />);
    expect(disabled).toContain('role="tablist"');
    expect(disabled).not.toContain('role="tabpanel"');
    expect(tabNextEnabled([{disabled:true},{disabled:true}],0,1)).toBe(-1);
    expect(tabNextEnabled([{disabled:true},{disabled:false}],0,1)).toBe(1);
    const enabled=renderToStaticMarkup(<Tabs ariaLabel="Course tabs" value="a"
      onValueChange={()=>{}} items={[{value:"a",label:"Overview",content:<p>Overview panel</p>}]}/>);
    expect(enabled).toContain('role="tabpanel"');
    expect(enabled).toContain("Overview panel");
  });
  it("keeps textarea validity and keyboard touch size distinct", () => {
    const html=renderToStaticMarkup(<Textarea id="reason" aria-invalid required rows={2}/>);
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('required=""');
    expect(html).toContain('min-h-11');
    expect(html).toContain('focus-ring');
  });
  it("popover retains named keyboard disclosure while visually bounded on a 320px screen", () => {
    const html=renderToStaticMarkup(<InfoPopover label="Placement policy"
      content={<p>Important placement details</p>}><span>Info</span></InfoPopover>);
    expect(html).toContain("<details");
    expect(html).toContain("<summary");
    expect(html).toContain('aria-label="Placement policy"');
    expect(html).toContain('aria-describedby="');
    expect(html).toContain("max-md:max-h-[40dvh]");
    expect(readFileSync("src/components/ui/tooltip.tsx","utf8")).toContain('event.key === "Escape"');
  });
  it("maintains persistent errors and keyboard dismiss buttons while capping timed notices", () => {
    const initial=Array.from({length:6},(_,i)=>({id:"e"+i,title:"Error "+i,tone:"error" as const}));
    const result=enqueueToast(initial,{id:"n1",title:"Saved",tone:"success"},1);
    expect(result.items.filter(item=>item.tone==="error")).toHaveLength(6);
    const html=renderToStaticMarkup(<ToastStack toasts={result.items} onDismiss={()=>{}}
      viewport={{height:420,bottom:70}} />);
    expect((html.match(/role="alert"/g)??[])).toHaveLength(6);
    expect(html).toContain('tabindex="0"');
    expect(html).toContain("overscroll-contain");
    expect(html).toContain("Dismiss error");
  });
  it("confirms only a readable, nonempty action and resolves abandoned promises on unmount", () => {
    const source=readFileSync("src/components/ui/use-confirm-flow.tsx","utf8");
    expect(source).toContain('prompt.trim() || "Confirm this action?"');
    expect(source).toContain("resolver.current?.(false)");
    expect(source).toContain("onOpenChange={open => { if (!open) finish(false); }}");
  });
});
