import Image from "next/image";
import React, { useRef } from "react";

function UploadButton({ title, icon, onChange }) {
  const inputRef = useRef(null);

  return (
    <>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        tabIndex={-1}
        aria-hidden="true"
        onChange={onChange}
      />
      <button
        type="button"
        className="ln-btn ln-btn--pri-trans d-flex align-items-center justify-content-center p-1"
        onClick={() => inputRef.current?.click()}
      >
        {icon && <Image src={icon} width={17} height={17} alt="" aria-hidden="true" />}
        <span className="d-inline-block ms-2">{title}</span>
      </button>
    </>
  );
}

export default UploadButton;
