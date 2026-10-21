import { Button, Dropdown } from "antd";
import React, { useState } from "react";

function ActionMenu({ actionList, ariaLabel = "More actions" }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="ln-drodown-antD"
      onClick={e => {
        e.stopPropagation();
      }}
    >
      <Dropdown
        menu={{ items: actionList }}
        trigger={["click"]}
        open={open}
        onOpenChange={setOpen}
        getPopupContainer={() => document.body}
        arrow
      >
        <Button
          className="border-0 bg-transparent shadow-none outline-none fnt-20"
          aria-label={ariaLabel}
          aria-haspopup="menu"
          aria-expanded={open}
          icon={<i className="bi bi-three-dots" aria-hidden="true"></i>}
        />
      </Dropdown>
    </div>
  );
}

export default ActionMenu;
