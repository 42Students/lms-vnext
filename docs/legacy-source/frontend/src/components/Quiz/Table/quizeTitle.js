import React from "react";
import Image from "next/image";

const Name = props => {
  return (
    <div className="d-flex align-items-center">
      
        <button
          type="button"
          className="d-flex align-items-center"
          onClick={props.onClick}
          style={{ border: 0, background: "none", padding: 0, textAlign: "left" }}
        >
          <div className="ln-icon-round">
            <Image
              src={"/assets/images/common/file-black.svg"}
              alt=""
              width={20}
              height={20}
            />
          </div>
          <span className="ps-3 fnt-14 fw-600 lt-02">{props.name}</span>
          {props.new == true ? (
            <Image
              className="ms-2"
              src={"/assets/images/common/new.svg"}
              alt="New"
              width={58}
              height={20}
            />
          ) : (
            ""
          )}
        </button>
    
    </div>
  );
};

export default Name;
