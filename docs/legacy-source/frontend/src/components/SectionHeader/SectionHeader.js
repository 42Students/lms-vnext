import React from "react";
import styles from "./SectionHeader.module.scss";

const SectionHeader = (props) => {
  return (
    <div className={`${styles.sectionHeader} ln-module__head bg-white d-flex`}>
      <div className="col-2">
        <h1 className="h1 ln-lto-bold">{props.title}</h1>
      </div>
      {props.children}
    </div>
  );
};

export default SectionHeader;
