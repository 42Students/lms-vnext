import React, { useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { HolderOutlined } from "@ant-design/icons";
import { notification } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { updateClassContentOrder } from "@/api/Services/AdminService";

/**
 * Single sortable item wrapper with drag handle.
 * Renders the content via renderContent prop.
 */
const SortableItem = ({ id, content, index, renderContent, contentRefsMap }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: String(id),
  });

  const style = {
    transform: CSS.Transform.toString(
      transform && { ...transform, scaleY: 1 }
    ),
    transition,
    ...(isDragging ? { zIndex: 1000, opacity: 0.95 } : {}),
  };

  return (
    <li
      ref={node => {
        setNodeRef(node);
        if (content?.id != null && node) contentRefsMap.current[content.id] = node;
      }}
      className="lesson-content-detail lesson-content-detail--sortable"
      style={style}
    >
      <div className="lesson-content-detail__wrap">
        <div
          ref={setActivatorNodeRef}
          className="lesson-content-detail__drag-handle"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <HolderOutlined className="lesson-content-detail__drag-icon" />
        </div>
        <div className="lesson-content-detail__item">
          {renderContent(content)}
        </div>
      </div>
    </li>
  );
};

/**
 * Sortable lesson content list for admin class-specific reordering.
 * Shows drag handles only when a class is selected.
 * Uses dnd-kit for touch and pointer support (mobile + desktop).
 */
const SortableLessonContentList = ({
  items,
  lessonId,
  classId,
  renderContent,
  onOrderSaved,
  contentRefsMap = { current: {} },
}) => {
  const [api, contextHolder] = notification.useNotification();

  const itemIds = useMemo(
    () => items.map(c => String(c?.id)).filter(Boolean),
    [items]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    // Keyboard users could not reorder at all (handle is focusable; Space to lift, arrows to move).
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    async ({ active, over }) => {
      if (active.id === over?.id || !over) return;
      const oldIndex = items.findIndex(c => String(c?.id) === active.id);
      const newIndex = items.findIndex(c => String(c?.id) === over.id);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

      const reordered = arrayMove(items, oldIndex, newIndex);
      // Quizzes are merged into this list under their QUIZ id, which is not a lesson_content id --
      // sending it as one could reorder an unrelated item or fail the save. Order lesson content only.
      const orderedContentIds = reordered
        .filter(c => String(c?.contentType ?? c?.content_type ?? "").toLowerCase() !== "quiz")
        .map(c => c?.id)
        .filter(id => id != null && id > 0);

      if (orderedContentIds.length === 0) return;

      try {
        await updateClassContentOrder({
          lessonId,
          classId,
          orderedContentIds,
        });
        onOrderSaved?.();
        api.success({
          message: "Order updated",
          description: "Content order has been saved for this class.",
          placement: "bottomRight",
          duration: 2,
        });
      } catch (err) {
        api.error({
          message: "Failed to save order",
          description: err?.response?.data?.message || err?.message || "Please try again.",
          icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
          placement: "bottomRight",
          duration: 4,
        });
      }
    },
    [items, lessonId, classId, onOrderSaved, api]
  );

  return (
    <>
      {contextHolder}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <ul className="ln-lesson-content-list ln-lesson-content-list--sortable">
            {items.map((content, index) => (
              <SortableItem
                key={content?.id ?? index}
                id={content?.id}
                content={content}
                index={index}
                renderContent={renderContent}
                contentRefsMap={contentRefsMap}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </>
  );
};

export default SortableLessonContentList;
