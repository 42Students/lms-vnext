import React from "react";
import { Modal } from "antd";
import CustomButton from "../Button/button";

function ModalContainer({
  open,
  title,
  children,
  onClose,
  showFooter,
  hideFooter = false,
  primaryButtonTitle,
  secondaryButtonTitle,
  onClickPrimary,
  onClickSecondary,
  disablePrimary = false,
  disableSecondary = false,
  primaryLoading = false,
  secondaryLoading = false,
  customClass,
  width,
  style,
  bodyStyle,
  ...modalProps
}) {
  const mergedBodyStyle = {
    maxHeight: "80vh",
    overflowY: "auto",
    padding: "24px",
    ...(bodyStyle ?? {}),
  };

  return (
    <>
      <Modal
        {...modalProps}
        rootClassName="ln-modal-container-root"
        width={width}
        title={title}
        open={open}
        onCancel={onClose}
        centered
        focusTriggerAfterClose
        footer={hideFooter ? null : (
          showFooter ? (
            <div className="d-flex align-items-center justify-content-end mt-4">
              <CustomButton
                title={primaryButtonTitle}
                buttonType="primaryTrans"
                onClick={onClickPrimary}
                disabled={disablePrimary}
                loading={primaryLoading}
              />
              <CustomButton
                title={secondaryButtonTitle}
                buttonType="primaryTrans"
                onClick={onClickSecondary}
                disabled={disableSecondary}
                loading={secondaryLoading}
              />
            </div>
          ) : (
            <div className="d-flex align-items-center justify-content-end">
              <CustomButton
                title="Got it"
                buttonType="primaryTrans"
                onClick={onClose}
              />
            </div>
          )
        )}
        className={customClass}
        style={style}
        styles={{ body: mergedBodyStyle }}
      >
        {children}
      </Modal>
    </>
  );
}

export default ModalContainer;
