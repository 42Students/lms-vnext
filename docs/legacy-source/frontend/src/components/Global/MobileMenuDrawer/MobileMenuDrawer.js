import React, { useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import DrawerWidget from "../RightDrawer/DrawerWidget";
import Sidebar, { AdminSidebar } from "@/components/Sidebar";
import { getUserRole } from "@/utils/roleUtils";

const LOGO_SRC = "/assets/images/login/logoo.png";

const FOCUSABLE_SELECTORS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getLogoHref(isAdminView, userRole, isTpoView) {
  if (isAdminView) return { pathname: "/college-admin/dashboard" };
  if (userRole === "RECRUITER") return { pathname: "/recruiter/home" };
  if (isTpoView) return { pathname: "/tpo/home" };
  if (userRole === "TPO") return { pathname: "/tpo/home" };
  if (userRole === "MENTOR") return { pathname: "/mentor/projects" };
  if (userRole === "FACULTY") return { pathname: "/teacher/courses" };
  if (userRole === "LEARNER") return { pathname: "/learn/courses" };
  return { pathname: "/" };
}

function MobileMenuDrawer({ id, open, onClose, onAfterClose }) {
  const router = useRouter();
  const loginUser = useSelector((state) => state.loginUser);
  const userRole = getUserRole(loginUser);
  const drawerRef = useRef(null);
  const pathname = router.pathname || "";
  const isAdminView = pathname.startsWith("/college-admin");
  const isTpoView = pathname === "/tpo" || pathname.startsWith("/tpo/");

  // Focus trap: keep Tab/Shift+Tab inside drawer while open
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
        return;
      }
      if (e.key !== "Tab") return;
      const container = drawerRef.current;
      if (!container) return;
      const focusable = Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handleAfterOpenChange = useCallback((isOpen) => {
    if (isOpen && drawerRef.current) {
      // Focus first interactive element once drawer has fully opened
      const firstLink = drawerRef.current.querySelector(FOCUSABLE_SELECTORS);
      firstLink?.focus();
    } else if (!isOpen) {
      onAfterClose?.();
    }
  }, [onAfterClose]);

  const drawerTitle = (
    <Link
      href={getLogoHref(isAdminView, userRole, isTpoView)}
      className="ln-menu-drawer__logo-link"
      aria-label="42 LMS Home"
    >
      <img src={LOGO_SRC} alt="42 LMS" className="ln-menu-drawer__logo" />
    </Link>
  );

  return (
    <div className="ln-menu-drawer-content" ref={drawerRef}>
      <DrawerWidget
        placement="left"
        drawerOpen={open}
        onClose={onClose}
        rootClassName="ln-menu-drawer-root"
        className="ln-menu-drawer"
        title={drawerTitle}
        afterOpenChange={handleAfterOpenChange}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {isAdminView ? (
          <nav aria-label="Main navigation">
            <AdminSidebar onClose={onClose} />
          </nav>
        ) : (
          // Sidebar already renders its own <nav>; do not create nested navigation landmarks.
          <Sidebar id={id} onClose={onClose} />
        )}
      </DrawerWidget>
    </div>
  );
}

export default MobileMenuDrawer;
