import { useMemo, useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import JoditEditor to avoid SSR issues
const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

const RichTextEditor = ({
  value = "",
  onChange,
  placeholder = "Enter text...",
  height = 300,
  className = "",
}) => {
  const editor = useRef(null);
  const [content, setContent] = useState(value);

  useEffect(() => {
    setContent(value || "");
  }, [value]);

  const config = useMemo(
    () => ({
      readonly: false,
      placeholder: placeholder,
      height: height,
      toolbar: true,
      toolbarButtonSize: "medium",
      showCharsCounter: false,
      showWordsCounter: false,
      showXPathInStatusbar: false,
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      defaultActionOnPaste: "insert_as_html",
      buttons: [
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "|",
        "ul",
        "ol",
        "|",
        "outdent",
        "indent",
        "|",
        "font",
        "fontsize",
        "brush",
        "|",
        "align",
        "|",
        "link",
        "|",
        "undo",
        "redo",
        "|",
        "eraser",
        "copyformat",
        "|",
        "fullsize",
      ],
      removeButtons: ["image", "video", "file", "source", "hr", "eraser", "copyformat"],
      editorCssClass: "rich-text-editor",
      zIndex: 0,
    }),
    [placeholder, height]
  );

  const handleChange = (newContent) => {
    setContent(newContent);
    if (onChange) {
      onChange(newContent);
    }
  };

  return (
    <div className={`rich-text-editor-wrapper ${className}`}>
      <JoditEditor
        ref={editor}
        value={content}
        config={config}
        tabIndex={1}
        onBlur={handleChange}
        onChange={handleChange}
      />
      <style jsx global>{`
        .rich-text-editor-wrapper .jodit-container {
          border: 1px solid #d9d9d9;
          border-radius: 4px;
        }
        .rich-text-editor-wrapper .jodit-container:focus-within {
          border-color: #4096ff;
          box-shadow: 0 0 0 2px rgba(5, 145, 255, 0.1);
        }
        .rich-text-editor-wrapper .jodit-toolbar-editor-collection {
          border-bottom: 1px solid #f0f0f0;
        }
        .rich-text-editor-wrapper .jodit-wysiwyg {
          min-height: ${height - 50}px;
          padding: 12px;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.5;
        }
        .rich-text-editor-wrapper .jodit-wysiwyg ul,
        .rich-text-editor-wrapper .jodit-wysiwyg ol {
          margin: 8px 0;
          padding-left: 24px;
        }
        .rich-text-editor-wrapper .jodit-wysiwyg li {
          margin: 4px 0;
        }
        .rich-text-editor-wrapper .jodit-wysiwyg p {
          margin: 8px 0;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;

