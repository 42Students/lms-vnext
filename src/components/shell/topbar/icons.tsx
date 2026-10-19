import type { ReactNode } from "react";

function Icon({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={1.8}
    strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
}
export function SearchIcon(){return <Icon><circle cx="10.7" cy="10.7" r="6.8"/><path d="m16 16 5 5"/></Icon>;}
export function PlusIcon(){return <Icon size={17}><path d="M12 5v14M5 12h14"/></Icon>;}
export function BellIcon(){return <Icon><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/></Icon>;}
export function MessageIcon(){return <Icon><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-7.5A7.5 7.5 0 1 1 20 11.5Z"/><path d="M8 11.5h8"/></Icon>;}
export function ChevronIcon(){return <Icon size={15}><path d="m6 9 6 6 6-6"/></Icon>;}
