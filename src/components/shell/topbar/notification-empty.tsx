import {BellIcon} from "./icons";
import style from "./topbar.module.css";

/** Exact reusable legacy notification empty state, shared by all portal bells. */
export function TopbarNotificationEmpty({
  title,description,
}:{
  title:string;
  description?:string;
}){
  return <div role="status" data-slot="notification-empty" className={style["topbarNotificationState"]+" min-w-0 max-w-full"}>
    <span aria-hidden="true" className={style["topbarNotificationEmptyIcon"]}><BellIcon/></span>
    <p className={style["topbarNotificationEmptyTitle"]+" min-w-0 break-words"}>{title}</p>
    {description?<span className={style["topbarNotificationEmptyDescription"]+" min-w-0 max-w-full break-words"}>{description}</span>:null}
  </div>;
}
