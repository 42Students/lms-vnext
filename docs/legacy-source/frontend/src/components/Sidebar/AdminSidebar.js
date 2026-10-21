import Link from "next/link";
import { useDispatch } from "react-redux";
import { memo, useMemo, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import {
  DashboardOutlined, ApartmentOutlined, BookOutlined, UnorderedListOutlined,
  FileTextOutlined, TrophyOutlined, ClockCircleOutlined, LinkOutlined,
  TeamOutlined, BankOutlined, RiseOutlined, BuildOutlined, UserOutlined,
  SendOutlined, UsergroupAddOutlined, SolutionOutlined, BellOutlined,
  MessageOutlined, CalendarOutlined, IdcardOutlined, FolderOutlined,
  HistoryOutlined, PartitionOutlined, SafetyCertificateOutlined,
} from "@ant-design/icons";
import { appAction } from "@/redux/store";
import { adminNavigationMenuForSidebar } from "@/common/lists";
import { getSidebarActiveKey } from "@/utils/navigationActiveKey";
import useCollegeFeatureFlags from "@/utils/useCollegeFeatureFlags";
import { filterNavByFeatureFlags } from "@/utils/featureFlagNavFilter";

const PARENT_PATH = "/college-admin";
const adminSidebarIconMap = {
  DashboardOutlined, ApartmentOutlined, BookOutlined, UnorderedListOutlined,
  FileTextOutlined, TrophyOutlined, ClockCircleOutlined, LinkOutlined,
  TeamOutlined, BankOutlined, RiseOutlined, BuildOutlined, UserOutlined,
  SendOutlined, UsergroupAddOutlined, SolutionOutlined, BellOutlined,
  MessageOutlined, CalendarOutlined, IdcardOutlined, FolderOutlined,
  HistoryOutlined, PartitionOutlined, SafetyCertificateOutlined,
};

const AdminSidebarInner = ({ onClose }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const listRef = useRef(null);
  const scrollRef = useRef(null);
  const indicatorRef = useRef(null);
  const isFirstRender = useRef(true);
  const activeKey = useMemo(() => getSidebarActiveKey(router.pathname), [router.pathname]);
  const { projectsEnabled, placementsEnabled, modules } = useCollegeFeatureFlags();
  const menuItems = useMemo(
    () => filterNavByFeatureFlags(adminNavigationMenuForSidebar(), { projectsEnabled, placementsEnabled, modules }),
    [projectsEnabled, placementsEnabled, modules]
  );

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
    // Keep a deep-linked or newly selected item discoverable even on a short viewport.
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

  useEffect(() => { updateIndicator(); }, [activeKey, menuItems, updateIndicator]);

  return (
    <div className="admin-sidebar-panel fl-d-panel-l px-2" data-testid="admin-sidebar">
      <div className="mt-2" style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", height: "100%" }}>
        <div className="fl-d-panel-l__head p-2" style={{ flexShrink: 0 }}>
          <Link href={{ pathname: "/college-admin/dashboard" }} aria-label="42 LMS Home" data-testid="admin-sidebar-home">
            <img src="/assets/images/login/logoo.png" alt="42 LMS" className="fl-d-panel-l__logo" />
          </Link>
        </div>
        <div ref={scrollRef} className="ln-hov__visible" style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", scrollbarWidth: "thin", msOverflowStyle: "auto" }}>
          <div className="fl-d-panel-l__body" style={{ height: "100%" }}>
            <ul className="fl-panel-module-list" ref={listRef}>
              {/* A list may only contain list items; hide the decorative highlight from assistive technology. */}
              <li className="fl-panel-module-list__indicator" ref={indicatorRef} aria-hidden="true" role="presentation" />
              {menuItems.map((item, i) => {
                if (item.divider) return <li key={`div-${i}`} className="fl-panel-module-list__divider" role="separator" />;
                const href = item.href || `${PARENT_PATH}/${item.path}`;
                const isActive = activeKey === item.path;
                return (
                  <li key={item.path || i} data-testid={`admin-sidebar-item-${item.path}`}
                    className={`fl-panel-module-list__item apply-pointer ${isActive ? "active" : ""}`}
                    onClick={() => { dispatch(appAction.setActiveMenuItem(item.path)); onClose?.(); }}>
                    <Link href={href} className="fl-panel-module-list__link fl-module-link d-inline-flex align-items-center w-100"
                      aria-current={isActive ? "page" : undefined}
                      aria-label={`${item.modulename}${isActive ? " (current page)" : ""}`}
                      data-testid={`admin-sidebar-link-${item.path}`}>
                      <div className="fl-module-link__icon">
                        {(() => {
                          const IconComponent = adminSidebarIconMap[item.icon];
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
export const AdminSidebar = memo(AdminSidebarInner);
export default AdminSidebar;
