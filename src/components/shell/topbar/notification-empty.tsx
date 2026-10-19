import {BellIcon} from "./icons";
import style from "./topbar.module.css";

/** Exact reusable legacy notification empty state, shared by all portal bells. */
export function TopbarNotificationEmpty({
  title,description,
}:{
  title:string;
  description?:string;
}){
  return <div role="status" data-slot="notification-empty" className={style.topbarNotificationState}>
    <span aria-hidden="true" className={style.topbarNotificationEmptyIcon}><BellIcon/></span>
    <p className={style.topbarNotificationEmptyTitle}>{title}</p>
    {description?<span className={style.topbarNotificationEmptyDescription}>{description}</span>:null}
  </div>;
}
