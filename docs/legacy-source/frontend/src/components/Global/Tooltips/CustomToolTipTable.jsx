import { Empty, Table, Tooltip } from "antd";
import { isArray } from "lodash";
import React from "react";

function CustomToolTipTable({ toolTipBaseContent, tableColoumns, tableData }) {
  // Previously a mount effect here set document.documentElement.scrollTop/scrollLeft, which
  // scrolled the whole page down and sideways once per instance. The faculty attendance grid
  // mounts one of these per multi-session cell (hundreds per month), so the page teleported on
  // load. Tooltip positioning is handled by `autoAdjustOverflow` below — no scrolling required.
  return (
    <Tooltip
      autoAdjustOverflow
      title={() => (
        <>
          {tableData?.length > 0 ? (
            <Table
              rowKey={"id"}
              pagination={false}
              dataSource={tableData}
              columns={tableColoumns}
              bordered
            />
          ) : (
            <Empty />
          )}
        </>
      )}
    >
      {toolTipBaseContent}
    </Tooltip>
  );
}

export default CustomToolTipTable;
