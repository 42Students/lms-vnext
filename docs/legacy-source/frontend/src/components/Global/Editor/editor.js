import dynamic from "next/dynamic";
import React, { useEffect, useMemo, useRef, useState } from "react";

const LmsEditor = dynamic(() => import("jodit-react"), {
  ssr: false,
});

const Editor = ({ setEditorContent, editorContent, ariaLabel }) => {
  const editor = useRef(0);
  const saveTimer = useRef(null);
  const lastPropValueRef = useRef(editorContent || "");
  const [localContent, setLocalContent] = useState(editorContent || "");

  const buttons =
    "bold,italic,underline,|,strikethrough,eraser,ul,ol,indent,outdent,|,font,fontsize,brush,paragraph,align,symbols,hr,table,lineHeight,superscript,subscript,copyformat,|";

  const customButtons = [
    {
      icon: "image",
      exec: () => {},
    },
    {
      icon: "video",
      exec: () => {},
    },

    {
      icon: "file",
      exec: () => {},
    },
  ];

  useEffect(() => {
    const nextValue = editorContent || "";
    if (nextValue !== lastPropValueRef.current) {
      lastPropValueRef.current = nextValue;
      setLocalContent(nextValue);
    }
  }, [editorContent]);

  const editorConfig = useMemo(() => ({
    readonly: false,
    placeholder: "Start Typing...",
    buttons: [...buttons.split(","), ...customButtons],
    buttonsXS: [...buttons.split(","), ...customButtons],
    buttonsMD: [...buttons.split(","), ...customButtons],
    buttonsSM: [...buttons.split(","), ...customButtons],
    toolbarButtonSize: "small",
    height: 300,
    statusbar: false,
    style: {
      color: "#0c0c0c",
    },
    cleanHTML: {
      cleanOnPaste: true,
      replaceNBSP: true,
      allowTags: 'p,div,span,strong,em,u,s,br,ul,ol,li,h1,h2,h3,h4,h5,h6,a,img,table,thead,tbody,tr,th,td,blockquote,code,pre,sub,sup',
    },
  }), []);

  const persistEditorContent = (newContent) => {
    setEditorContent && setEditorContent(newContent);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        sessionStorage.setItem("EditorContents", newContent);
      } catch (e) {
        // sessionStorage quota exceeded, ignore silently
      }
    }, 500);
  };

  return (
    <div className="ln-editor-container" aria-label={ariaLabel}>
      <LmsEditor
        ref={editor}
        value={localContent}
        config={editorConfig}
        onBlur={newContent => {
          lastPropValueRef.current = newContent || "";
          setLocalContent(newContent || "");
          persistEditorContent(newContent || "");
        }}
        onChange={newContent => {
          lastPropValueRef.current = newContent || "";
          setLocalContent(newContent || "");
          persistEditorContent(newContent || "");
        }}
      />
    </div>
  );
};

export default React.memo(Editor);
