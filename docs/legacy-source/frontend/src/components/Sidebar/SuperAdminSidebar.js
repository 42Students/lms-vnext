import Link from "next/link";
import { memo, useMemo, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import {
  DashboardOutlined, BankOutlined, AppstoreOutlined, HistoryOutlined,
  ApartmentOutlined, BookOutlined, UsergroupAddOutlined, SolutionOutlined,
  FolderOutlined, BellOutlined, MessageOutlined, IdcardOutlined,
  SettingOutlined, DeleteOutlined, PartitionOutlined, SafetyCertificateOutlined, NotificationOutlined, MailOutlined,
} from "@ant-design/icons";
import { superAdminNavigationMenuForSidebar } from "@/common/lists";
import { getSidebarActiveKey } from "@/utils/navigationActiveKey";

const PARENT_PATH = "/superadmin";
const superAdminSidebarIconMap = {
  DashboardOutlined, BankOutlined, AppstoreOutlined, HistoryOutlined,
  ApartmentOutlined, BookOutlined, UsergroupAddOutlined, SolutionOutlined,
  FolderOutlined, BellOutlined, MessageOutlined, IdcardOutlined,
  SettingOutlined, DeleteOutlined, PartitionOutlined, SafetyCertificateOutlined, NotificationOutlined, MailOutlined,
};

// Super admin must see all modules, including ones disabled for the selected college.
const SuperAdminSidebarInner = ({ onClose }) => {
  const router = useRouter();
  const listRef = useRef(null);
  const scrollRef = useRef(null);
  const indicatorRef = useRef(null);
  const isFirstRender = useRef(true);
  const activeKey = useMemo(() => getSidebarActiveKey(router.pathname), [router.pathname]);
  const menuItems = useMemo(() => superAdminNavigationMenuForSidebar(), []);

  const updateIndicator = useCallback(() => {
    if (!listRef.current || !indicatorRef.current) return;
    const activeEl = listRef.current.querySelector(".fl-panel-module-list__item.active");
    if (!activeEl) {
      indicatorRef.current.style.opacity = "0";
      return;
    }
    if (isFirstRender.current) {
      indicatorRef.current.style.transition = "none";
      isFirstRender.current = false;
      requestAnimationFrame(() => {
        if (indicatorRef.current) indicatorRef.current.style.transition = "";
      });
    }
    indicatorRef.current.style.top = `${activeEl.offsetTop}px`;
    indicatorRef.current.style.height = `${activeEl.offsetHeight}px`;
    indicatorRef.current.style.opacity = "1";
    const viewport = scrollRef.current;
    if (viewport) {
      const top = activeEl.offsetTop;
      const bottom = top + activeEl.offsetHeight;
      if (top < viewport.scrollTop) viewport.scrollTop = top;
      else if (bottom > viewport.scrollTop + viewport.clientHeight) {
        viewport.scrollTop = bottom - viewport.clientHeight;
      }
    }
  }, []);

  useEffect(() => { updateIndicator(); }, [activeKey, updateIndicator]);

  return (
    <div className="admin-sidebar-panel fl-d-panel-l px-2" data-testid="superadmin-sidebar">
      <div className="mt-2" style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", height: "100%" }}>
        <div className="fl-d-panel-l__head p-2" style={{ flexShrink: 0 }}>
          <Link href={{ pathname: "/superadmin/dashboard" }} aria-label="42 LMS Home" data-testid="superadmin-sidebar-home">
            <img src="/assets/images/login/logoo.png" alt="42 LMS" className="fl-d-panel-l__logo" />
          </Link>
        </div>
        <div ref={scrollRef} className="ln-hov__visible" style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", scrollbarWidth: "thin", msOverflowStyle: "auto" }}>
          <div className="fl-d-panel-l__body" style={{ height: "100%" }}>
            <ul className="fl-panel-module-list" ref={listRef}>
              <li className="fl-panel-module-list__indicator" ref={indicatorRef} aria-hidden="true" role="presentation" />
              {menuItems.map((item, i) => {
                if (item.divider) return <li key={`div-${i}`} className="fl-panel-module-list__divider" role="separator" />;
                const href = `${PARENT_PATH}/${item.path}`;
                const isActive = activeKey === item.path;
                return (
                  <li key={item.path || i} data-testid={`superadmin-sidebar-item-${item.path}`}
                    className={`fl-panel-module-list__item apply-pointer ${isActive ? "active" : ""}`}
                    onClick={() => onClose?.()}>
                    <Link href={href} className="fl-panel-module-list__link fl-module-link d-inline-flex align-items-center w-100"
                      aria-current={isActive ? "page" : undefined}
                      aria-label={`${item.modulename}${isActive ? " (current page)" : ""}`}
                      data-testid={`superadmin-sidebar-link-${item.path}`}>
                      <div className="fl-module-link__icon">
                        {(() => {
                          const IconComponent = superAdminSidebarIconMap[item.icon];
                          return IconComponent ? <IconComponent style={{ fontSize: 20 }} aria-hidden /> : null;
                        })()}
                      </div>
                      <span className="menu-txt text-capitalize" style={{ flex: 1 }}>{item.modulename}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
      <style jsx global>{`.admin-sidebar-panel .ln-hov__visible::-webkit-scrollbar { display: block; width: 8px; } .admin-sidebar-panel .ln-hov__visible::-webkit-scrollbar-thumb { background: rgba(90, 100, 115, 0.35); border-radius: 8px; }`}</style>
    </div>
  );
};
export const SuperAdminSidebar = memo(SuperAdminSidebarInner);
export default SuperAdminSidebar;
