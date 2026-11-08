"use client";
import {useEffect,useState} from "react";
/** Browser tests wait for React to attach event handlers before filling synthetic forms. */
export function UxG159FixtureReady(){
 const [ready,setReady]=useState(false);
 useEffect(()=>{setReady(true);},[]);
 return <span data-ux-g159-ready={ready?"true":"false"} aria-hidden="true" className="hidden"/>;
}
