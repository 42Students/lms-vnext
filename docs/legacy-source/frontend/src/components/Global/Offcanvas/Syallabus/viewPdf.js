import { Drawer } from "antd";
import { useState } from "react";
import DrawerWidget from "../../RightDrawer/DrawerWidget";

const ViewPdf = props => {
  return (
    <>
      <DrawerWidget
        title={props.title}
        customWidth={600}
        onClose={props.close}
        drawerOpen={props.open}
      >
        <div className="ln-drawer-body">
          <iframe
            src={props?.file}
            title={props.title || "PDF preview"}
            width="100%"
            height="100%"
            style={{ border: "none" }}
            allowFullScreen
            sandbox="allow-same-origin allow-scripts"
          >
            <p>PDF cannot be displayed. <a href={props?.file} target="_blank" rel="noopener noreferrer">Download PDF</a></p>
          </iframe>
        </div>
      </DrawerWidget>
    </>
  );
};
export default ViewPdf;
