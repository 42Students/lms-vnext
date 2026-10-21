import { useEffect, useRef, useState } from "react";
import {
  TRACKER_SCREENSHOT_MAX_FILES,
  mergeTrackerScreenshots,
} from "@/utils/bugTrackerAttachmentUtils";

export default function ScreenshotPicker({ files, onChange, disabled = false }) {
  const inputRef = useRef(null);
  const [notice, setNotice] = useState("");
  const [dragging, setDragging] = useState(false);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    const next = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setPreviews(next);
    return () => next.forEach((item) => URL.revokeObjectURL(item.url));
  }, [files]);

  useEffect(() => {
    if (disabled) return undefined;
    const handlePaste = (event) => {
      const pasted = Array.from(event.clipboardData?.files || []);
      const images = pasted.filter((file) => file.type?.startsWith("image/"));
      if (!images.length) return;
      event.preventDefault();
      addFiles(images);
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  });

  const addFiles = (incoming) => {
    if (disabled) return;
    const result = mergeTrackerScreenshots(files, Array.from(incoming || []));
    onChange(result.files);
    setNotice(result.error);
  };

  const removeAt = (index) => {
    if (disabled) return;
    onChange(files.filter((_, itemIndex) => itemIndex !== index));
    setNotice("");
  };

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  };

  return (
    <div className="tracker-screenshot-field">
      <div className="tracker-screenshot-label">
        <span>Screenshots</span>
        <small>Optional · up to {TRACKER_SCREENSHOT_MAX_FILES}</small>
      </div>

      <div
        className={`tracker-screenshot-dropzone${dragging ? " is-dragging" : ""}${disabled ? " is-disabled" : ""}`}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(event.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          hidden
          multiple
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <strong>Paste, drop, or choose screenshots</strong>
        <span>PNG, JPEG or WebP · max 8 MB each</span>
      </div>

      {notice && <div className="tracker-screenshot-error" role="alert">{notice}</div>}

      {previews.length > 0 && (
        <div className="tracker-screenshot-previews">
          {previews.map(({ file, url }, index) => (
            <div className="tracker-screenshot-preview" key={`${file.name}-${file.size}-${file.lastModified}`}>
              <img src={url} alt={`Selected screenshot ${index + 1}`} />
              <button
                type="button"
                aria-label={`Remove screenshot ${index + 1}`}
                onClick={(event) => {
                  event.stopPropagation();
                  removeAt(index);
                }}
              >
                ×
              </button>
              <span>{file.name || `Screenshot ${index + 1}`}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
