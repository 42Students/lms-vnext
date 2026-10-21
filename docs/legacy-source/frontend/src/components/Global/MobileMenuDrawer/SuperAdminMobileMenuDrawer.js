import { useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import DrawerWidget from "../RightDrawer/DrawerWidget";
import SuperAdminSidebar from "@/components/Sidebar/SuperAdminSidebar";

const LOGO_SRC = "/assets/images/login/logoo.png";

const FOCUSABLE_SELECTORS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function SuperAdminMobileMenuDrawer({ open, onClose, onAfterClose }) {
  const drawerRef = useRef(null);

  // Focus trap: keep Tab/Shift+Tab inside drawer while open — same behavior as MobileMenuDrawer.
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
      const firstLink = drawerRef.current.querySelector(FOCUSABLE_SELECTORS);
      firstLink?.focus();
    } else if (!isOpen) {
      onAfterClose?.();
    }
  }, [onAfterClose]);

  const drawerTitle = (
    <Link
      href={{ pathname: "/superadmin/dashboard" }}
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
        <nav aria-label="Main navigation">
          <SuperAdminSidebar onClose={onClose} />
        </nav>
      </DrawerWidget>
    </div>
  );
}

export default SuperAdminMobileMenuDrawer;
