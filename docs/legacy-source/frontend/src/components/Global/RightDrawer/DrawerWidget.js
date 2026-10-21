import { useEffect, useRef } from "react";
import { Drawer } from "antd";
import CustomButton from "../Button/button";

//custom width and size are not applicable in mobile view
const DrawerWidget = ({
  drawerOpen,
  onClose,
  size,
  title,
  children,
  primaryButtonTitle,
  secondaryButtonTitle,
  onClickPrimary,
  onClickSecondary,
  disablePrimary,
  disableSecondary,
  primaryLoading = false,
  secondaryLoading = false,
  buttonJustification,
  customWidth,
  leftFooter,
  footerClass,
  showFooter,
  placement,
  className,
  rootClassName,
  afterOpenChange,
  ...drawerProps
}) => {
  const triggerRef = useRef(null);
  const previousOpenRef = useRef(false);

  useEffect(() => {
    if (drawerOpen && !previousOpenRef.current && typeof document !== "undefined") {
      triggerRef.current = document.activeElement;
    }
    previousOpenRef.current = drawerOpen;
  }, [drawerOpen]);

  const handleAfterOpenChange = (isOpen) => {
    afterOpenChange?.(isOpen);
    if (isOpen || typeof document === "undefined") return;

    const trigger = triggerRef.current;
    const restore = () => {
      if (trigger && document.contains(trigger) && typeof trigger.focus === "function") {
        trigger.focus();
      }
    };

    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(restore);
    } else {
      setTimeout(restore, 0);
    }
  };

  return (
    <>
      <Drawer
        rootClassName={`ln-drawer-widget-root${rootClassName ? ` ${rootClassName}` : ""}`}
        className={className}
        title={title}
        placement={placement ? placement : "right"}
        onClose={onClose}
        open={drawerOpen}
        size={size ? size : "default"}
        afterOpenChange={handleAfterOpenChange}
        footer={
          showFooter && (
            <div
              className={`${footerClass ? `${footerClass} ` : ""}d-flex align-items-center ${
                leftFooter ? "justify-content-between" : "justify-content-end"
              }`}
            >
              {leftFooter && <div>{leftFooter}</div>}
              {(primaryButtonTitle || secondaryButtonTitle) && (
                <div className="d-flex gap-2 justify-content-end">
                  {primaryButtonTitle && (
                    <CustomButton
                      disabled={disablePrimary}
                      loading={primaryLoading}
                      title={primaryButtonTitle}
                      buttonType="blueTrans"
                      onClick={onClickPrimary}
                    />
                  )}
                  {secondaryButtonTitle && (
                    <CustomButton
                      disabled={disableSecondary}
                      loading={secondaryLoading}
                      title={secondaryButtonTitle}
                      buttonType="regular"
                      onClick={onClickSecondary}
                    />
                  )}
                </div>
              )}
            </div>
          )
        }
        width={customWidth}
        styles={{ body: { minHeight: 0 } }}
        {...drawerProps}
      >
        {children}
      </Drawer>
    </>
  );
};
export default DrawerWidget;
