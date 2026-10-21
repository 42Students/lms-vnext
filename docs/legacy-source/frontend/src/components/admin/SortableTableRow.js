import { createContext, useContext } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { HolderOutlined } from "@ant-design/icons";

// Some consumers supply components.body.row but forget to call wrap(table). The body wrapper
// supplies the required contexts only in that case; existing wrap(table) callers are unchanged.
const ExplicitSortableContext = createContext(false);

function Row({ children, ...props }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: props["data-row-key"],
  });
  const style = {
    ...props.style,
    transform: CSS.Transform.toString(transform && { ...transform, scaleY: 1 }),
    transition,
    ...(isDragging ? { position: "relative", zIndex: 9, background: "#fafafa" } : {}),
  };
  return (
    <tr {...props} ref={setNodeRef} style={style}>
      {Array.isArray(children) ? children.map((child) => {
        if (child?.key === "sort") {
          return {
            ...child,
            props: {
              ...child.props,
              children: (
                <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners}
                  aria-label="Reorder row. Press Space to pick up, arrow keys to move, and Space to drop."
                  style={{ touchAction: "none", cursor: "grab", border: 0, background: "transparent", padding: 6 }}>
                  <HolderOutlined aria-hidden="true" />
                </button>
              ),
            },
          };
        }
        return child;
      }) : children}
    </tr>
  );
}

/** Provides drag handles for antd tables; the consumer owns data and save operations. */
export function useSortableTable({ items, rowKeyName = "id", onReorder }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const ids = items.map((item) => item[rowKeyName]);
  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(active.id);
    const to = ids.indexOf(over.id);
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(ids, from, to));
  };
  const BodyWrapper = (props) => {
    const explicitlyWrapped = useContext(ExplicitSortableContext);
    const tbody = <tbody {...props} />;
    return explicitlyWrapped ? tbody : (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {tbody}
        </SortableContext>
      </DndContext>
    );
  };
  const wrap = (table) => (
    <ExplicitSortableContext.Provider value={true}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {table}
        </SortableContext>
      </DndContext>
    </ExplicitSortableContext.Provider>
  );
  return { wrap, components: { body: { wrapper: BodyWrapper, row: Row } } };
}

export const sortColumn = {
  key: "sort", title: "", width: 40, align: "center", render: () => null,
};
