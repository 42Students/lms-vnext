import Image from "next/image";
import React from "react";
const NameWithDp = props => {
  const { student } = props;
  return (
    <div className="take-attendance-std-wrapper">
      {/* <Image
        src={"/assets/images/avatar/profile_big2.png"}
        alt="student profile image"
        width={40}
        height={40}
      /> */}
      {[student?.first_name, student?.last_name].filter(Boolean).join(" ")}
    </div>
  );
};

export default NameWithDp;
