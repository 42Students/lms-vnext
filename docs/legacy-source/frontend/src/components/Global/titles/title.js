import React from "react";

const title = props => {
  return (
    <div className="ln-module__head bg-white d-flex align-items-center">
      <div className={props.children ? "col-6" : "col-12"}>
        <h1 className="h1 ln-lto-bold ln-module-title" style={{ marginBottom: 0, wordBreak: "break-word" }}>
          {props.title}
        </h1>
      </div>
      {props.children && (
        <div className="col-6 d-flex justify-content-end  align-items-center">
          {props.children}
        </div>
      )}
    </div>
  );
};

export default title;
