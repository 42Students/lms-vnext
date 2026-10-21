import React, { useEffect, useState } from "react";
import { Modal } from "antd";
import { useSelector } from "react-redux";
import VideoFrom from "./videoform";
import YouTube from "./youtube";
import LiveClass from "./liveclass";
import ResourceComposer from "./ResourceComposer";
import DrawerWidget from "../../RightDrawer/DrawerWidget";
import QuizBuilderModal from "@/components/Quiz/QuizBuilderModal";
import DrawerAssignment from "@/components/Global/Offcanvas/Assignment/newAssignment";
import Router from "next/router";

// Five user-facing categories; uploaded and YouTube are video sources, not categories.
const CONTENT_CATEGORIES = ["Videos", "Resources", "Quizzes", "Assignments", "Live Sessions"];
const MODE_CATEGORIES = {
  lectures: ["Videos"],
  assessments: ["Quizzes", "Assignments"],
};
const DRAWER_TITLES = {
  lectures: "Add Video",
  resources: "Add Resource",
  live: "Add Live Session",
};

const AddNewLessonContentDrawer = ({ open, onClose, onContentAdded, contentMode }) => {
  const [childrenDrawer, setChildrenDrawer] = useState(false);
  const [active, setActive] = useState(null);
  const [videoSource, setVideoSource] = useState(null);
  const [childDirty, setChildDirty] = useState(false);
  const [childResetKey, setChildResetKey] = useState(0);
  const loginUser = useSelector((state) => state.loginUser);
  const selectedCourseId = useSelector((state) => state.course?.selectedCourseId);
  const isResourcesMode = contentMode === "resources";
  const isLiveMode = contentMode === "live";

  useEffect(() => {
    if (!open || !childDirty || typeof window === "undefined") return undefined;
    const beforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const beforeRouteChange = () => {
      if (window.confirm("Discard this unsaved content draft?")) return;
      const addressBar = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (addressBar !== Router.asPath) window.history.pushState(null, "", Router.asPath);
      // eslint-disable-next-line no-throw-literal
      throw "Route change aborted to preserve unsaved lesson content.";
    };
    window.addEventListener("beforeunload", beforeUnload);
    Router.events.on("routeChangeStart", beforeRouteChange);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      Router.events.off("routeChangeStart", beforeRouteChange);
    };
  }, [open, childDirty]);

  let visibleCategories = [];
  if (!contentMode || contentMode === "roadmap" || contentMode === "blueprint") {
    visibleCategories = CONTENT_CATEGORIES;
  } else if (MODE_CATEGORIES[contentMode]) {
    visibleCategories = MODE_CATEGORIES[contentMode];
  } else if (!isResourcesMode && !isLiveMode) {
    console.error(`AddNewLessonContentDrawer: unknown contentMode "${contentMode}"`);
  }
  // Only one category (the Lectures tab's "Add Video"): skip the one-item list and the second, identically titled
  // drawer; show the Upload / YouTube choice right here.
  const isVideoOnlyMode = !isResourcesMode && !isLiveMode
    && visibleCategories.length === 1 && visibleCategories[0] === "Videos";

  const closeChildNow = (saved = false) => {
    setChildrenDrawer(false);
    setVideoSource(null);
    setActive(null);
    setChildDirty(false);
    setChildResetKey((value) => value + 1);
    if (saved) onContentAdded?.();
  };

  const requestCloseChild = (saved = false) => {
    if (saved || !childDirty) {
      closeChildNow(saved);
      return;
    }
    Modal.confirm({
      title: "Discard this content draft?",
      content: "Your unsaved content will be lost.",
      okText: "Discard",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: () => closeChildNow(false),
    });
  };

  const selectCategory = (category) => {
    setChildDirty(false);
    setActive(category);
    setVideoSource(null);
    if (category !== "Quizzes" && category !== "Assignments") {
      setChildrenDrawer(true);
    }
  };

  const closeTopLevelNow = (saved = false) => {
    setChildrenDrawer(false);
    setVideoSource(null);
    setActive(null);
    setChildDirty(false);
    setChildResetKey((value) => value + 1);
    if (saved) onContentAdded?.();
    onClose?.();
  };

  const requestCloseTopLevel = (saved = false) => {
    if (saved || !childDirty) {
      closeTopLevelNow(saved);
      return;
    }
    Modal.confirm({
      title: "Discard this content draft?",
      content: "Your unsaved content will be lost.",
      okText: "Discard",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: () => closeTopLevelNow(false),
    });
  };

  return (
    <>
      <DrawerWidget
        title={DRAWER_TITLES[contentMode] || "Add New Content"}
        customWidth={640}
        closable
        onClose={() => requestCloseTopLevel(false)}
        placement="right"
        drawerOpen={open}
        primaryButtonTitle={isResourcesMode || isLiveMode ? undefined : "Cancel"}
        onClickPrimary={isResourcesMode || isLiveMode ? undefined : () => requestCloseTopLevel(false)}
        showFooter={!isResourcesMode && !isLiveMode && !(isVideoOnlyMode && videoSource)}
      >
        <div className="ln-drawer-body">
          {isResourcesMode ? (
            <ResourceComposer key={childResetKey} back={(saved) => requestCloseTopLevel(Boolean(saved))} onDirtyChange={setChildDirty} />
          ) : isLiveMode ? (
            <LiveClass key={childResetKey} back={(saved) => requestCloseTopLevel(Boolean(saved))} onDirtyChange={setChildDirty} />
          ) : isVideoOnlyMode ? (
            !videoSource ? (
              <div className="d-flex flex-column gap-3">
                <button type="button" className="ln-btn ln-btn--regular" onClick={() => setVideoSource("UPLOAD")}>
                  Upload Video
                </button>
                <button type="button" className="ln-btn ln-btn--blue-trans" onClick={() => setVideoSource("YOUTUBE")}>
                  YouTube Video
                </button>
              </div>
            ) : videoSource === "UPLOAD" ? (
              <VideoFrom key={childResetKey} back={(saved) => requestCloseTopLevel(Boolean(saved))} onDirtyChange={setChildDirty} />
            ) : (
              <YouTube key={childResetKey} back={(saved) => requestCloseTopLevel(Boolean(saved))} onDirtyChange={setChildDirty} />
            )
          ) : (
            <ul className="ln-content-list">
              {visibleCategories.map((category, index) => (
                <li
                  key={category}
                  role="button"
                  tabIndex={0}
                  aria-label={category}
                  className={`mb-4 ln-content-list__item ${active === category ? "active" : ""}`}
                  onClick={() => selectCategory(category)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      selectCategory(category);
                    }
                  }}
                >
                  <div className="d-flex align-items-center">
                    <span>{index + 1}.</span>
                    <span className="ms-2">{category}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {!isResourcesMode && !isLiveMode && !isVideoOnlyMode && (
          <DrawerWidget
            placement="right"
            title={active === "Videos" ? "Add Video" : active === "Resources" ? "Add Resource" : "Add Live Session"}
            customWidth={640}
            closable
            onClose={() => requestCloseChild(false)}
            drawerOpen={childrenDrawer}
          >
            <div className="ln-drawer-body">
              {active === "Videos" && !videoSource && (
                <div className="d-flex flex-column gap-3">
                  <button type="button" className="ln-btn ln-btn--regular" onClick={() => setVideoSource("UPLOAD")}>
                    Upload Video
                  </button>
                  <button type="button" className="ln-btn ln-btn--blue-trans" onClick={() => setVideoSource("YOUTUBE")}>
                    YouTube Video
                  </button>
                </div>
              )}
              {active === "Videos" && videoSource === "UPLOAD" && (
                <VideoFrom key={childResetKey} back={requestCloseChild} onDirtyChange={setChildDirty} />
              )}
              {active === "Videos" && videoSource === "YOUTUBE" && (
                <YouTube key={childResetKey} back={requestCloseChild} onDirtyChange={setChildDirty} />
              )}
              {active === "Resources" && <ResourceComposer key={childResetKey} back={requestCloseChild} onDirtyChange={setChildDirty} />}
              {active === "Live Sessions" && <LiveClass key={childResetKey} back={requestCloseChild} onDirtyChange={setChildDirty} />}
            </div>
          </DrawerWidget>
        )}
      </DrawerWidget>
      <QuizBuilderModal
        open={active === "Quizzes"}
        onClose={() => { setActive(null); setChildDirty(false); }}
        onCreated={() => { setActive(null); setChildDirty(false); onContentAdded?.(); }}
        onDirtyChange={setChildDirty}
        lesson={{ lessonId: loginUser?.LessonId, lessonName: loginUser?.LessonName }}
        courseId={selectedCourseId}
        classId={loginUser?.classId}
      />
      <DrawerAssignment
        open={active === "Assignments"}
        onClose={() => { setActive(null); setChildDirty(false); }}
        onSaved={() => { setActive(null); setChildDirty(false); onContentAdded?.(); }}
        onDirtyChange={setChildDirty}
        insideSyllabus
        lesson={{ lessonId: loginUser?.LessonId, lessonName: loginUser?.LessonName }}
      />
    </>
  );
};

export default React.memo(AddNewLessonContentDrawer);
