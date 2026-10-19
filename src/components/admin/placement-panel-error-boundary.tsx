"use client";
import {Component,type ReactNode} from "react";
import {Button} from "@/components/ui/button";
type Props={children:ReactNode};
type State={failed:boolean};
/** GR-70: contain a client render crash to the selected operational card. */
export class PlacementPanelErrorBoundary extends Component<Props,State>{
 state:State={failed:false};
 static getDerivedStateFromError():State{return {failed:true};}
 render(){
  if(this.state.failed)return <section role="alert"
   className="border-l-2 border-error bg-error-subtle px-4 py-3">
   <p className="font-semibold">Could not load this right now. Try again.</p>
   <Button type="button" variant="secondary" className="mt-3 min-h-11 md:min-h-9 print:hidden" onClick={()=>this.setState({failed:false})}>Retry this card</Button>
  </section>;
  return this.props.children;
 }
}
