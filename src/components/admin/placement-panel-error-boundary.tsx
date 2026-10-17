"use client";
import {Component,type ReactNode} from "react";
type Props={children:ReactNode};
type State={failed:boolean};
/** GR-70: contain a client render crash to the selected operational card. */
export class PlacementPanelErrorBoundary extends Component<Props,State>{
 state:State={failed:false};
 static getDerivedStateFromError():State{return {failed:true};}
 render(){
  if(this.state.failed)return <section role="alert"
   className="rounded-xl border border-border bg-surface p-5">
   <p className="font-semibold">Could not load this right now. Try again.</p>
   <button type="button" onClick={()=>this.setState({failed:false})}
    className="mt-3 min-h-11 rounded border border-border px-4 font-semibold focus-visible:ring-2 focus-visible:ring-primary">Retry this card</button>
  </section>;
  return this.props.children;
 }
}
