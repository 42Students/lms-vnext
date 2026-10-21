import { Button } from "antd";
import Image from "next/image";
import React from "react";

function CustomButton({
  title,
  icon,
  buttonType,
  alt,
  onClick,
  disabled,
  loading,
  styleClass,
  ariaLabel,
  htmlType = "button",
}) {
  const classType = {
    regular: "--regular",
    trans: "--trans",
    primary: "--pri",
    secondary: "--sec",
    primaryTrans: "--pri-trans",
    secondaryTrans: "--sec-trans",
    blueTrans: "--blue-trans",
    default: "--default",
  };
  const accessibleLabel = ariaLabel || (!title && alt ? alt : undefined);
  const variantClass = classType[buttonType] || classType.default;

  return (
    <Button
      className={`ln-btn ln-btn${
        variantClass
      } d-flex align-items-center justify-content-center ${
        styleClass ? styleClass : ""
      }`}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-label={accessibleLabel}
      size={"large"}
      loading={loading}
      icon={
        typeof icon == "string" ? (
          <Image
            src={icon}
            alt={title || ariaLabel ? "" : (alt || "")}
            aria-hidden={title || ariaLabel ? "true" : undefined}
            width={14}
            height={14}
          />
        ) : (
          icon
        )
      }
      htmlType={htmlType}
    >
      {title}
    </Button>
  );
}

export default CustomButton;
