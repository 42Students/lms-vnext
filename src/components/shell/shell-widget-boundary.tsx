"use client";
import {Component,type ReactNode} from "react";
import {InlineNotice} from "@/components/ui/inline-notice";
type Props={children:ReactNode;name:string;fallbackHref?:string};
type State={failed:boolean};
/** GR-70: a broken bell/menu never takes down the page or adjacent navigation. */
export class ShellWidgetBoundary extends Component<Props,State>{
 state:State={failed:false};
 static getDerivedStateFromError():State{return {failed:true};}
 render(){
  if(!this.state.failed)return this.props.children;
  return <div className="min-w-0 space-y-2" role="group" aria-label={this.props.name}>
   <InlineNotice tone="error" message="Could not load this right now. Try again."/>
   <div className="flex flex-wrap gap-3 text-sm">
    <button type="button" onClick={()=>this.setState({failed:false})}
     className="min-h-10 rounded-md border border-border px-3 text-primary-text">Retry</button>
    {this.props.fallbackHref?<a href={this.props.fallbackHref}
     className="inline-flex min-h-10 items-center text-primary-text underline">Open page</a>:null}
   </div>
  </div>;
 }
}
