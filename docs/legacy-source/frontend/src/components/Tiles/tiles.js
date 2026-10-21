import { Badge } from "antd";
import Image from "next/image";
import React from "react";

function Tiles({ element, icon, onClick, rootClassName }) {
  return (
    <div
      className={`ln-tile p-2 d-inline-block border rounded-3 ${rootClassName}`}
      onClick={onClick}
    >
      <span className="fnt-16 fw-600">{element?.rNo}</span>
      <Badge count={element?.warningCount} className="ms-3">
        <Image
          src="/assets/images/common/message-square.svg"
          width={20}
          height={20}
        />
      </Badge>
    </div>
  );
}

export default Tiles;
