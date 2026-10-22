"use client";
import {Component,type ReactNode} from "react";
import {InlineNotice} from "@/components/ui/inline-notice";
import {Button} from "@/components/ui/button";
type Props={children:ReactNode;name:string;fallbackHref?:string};
type State={failed:boolean};
/** GR-70: a broken bell/menu never takes down the page or adjacent navigation. */
export class ShellWidgetBoundary extends Component<Props,State>{
 override state:State={failed:false};
 static getDerivedStateFromError():State{return {failed:true};}
 override render(){
  if(!this.state.failed)return this.props.children;
  return <div className="grid w-full min-w-0 max-w-sm gap-[var(--lms-space-3)]" role="group" aria-label={this.props.name}>
   <InlineNotice tone="error" message="Could not load this right now. Try again."/>
   <div className="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)] text-sm max-[767px]:flex-col max-[767px]:items-stretch">
    <Button variant="secondary" type="button" className="w-full min-[768px]:w-auto" onClick={()=>this.setState({failed:false})}
     >Retry</Button>
    {this.props.fallbackHref?<a href={this.props.fallbackHref}
     className="inline-flex min-h-11 min-w-0 w-full items-center justify-center text-primary-text underline min-[768px]:min-h-[var(--lms-control-height)] min-[768px]:w-auto">Open page</a>:null}
   </div>
  </div>;
 }
}
