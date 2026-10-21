import ModalContainer from "@/components/Global/ModalContainer/ModalContainer";
import React from "react";

function PdfViewerModal({ open, onClose, pdfUrl }) {
  return (
    <ModalContainer
      customClass={"ln-bg-modal ln-pdf-viewer-modal"}
      open={open}
      onClose={() => {
        onClose();
      }}
      width={"100%"}
      style={{ maxWidth: "min(100vw, 1400px)" }}
    >
      <div className="ln-pdf-viewer-modal__body">
        <iframe
          src={pdfUrl}
          title="PDF Viewer"
          width="100%"
          height="100%"
          style={{ minHeight: "75vh", border: "none" }}
          className="ln-pdf-viewer-modal__frame"
          allowFullScreen
          sandbox="allow-same-origin allow-scripts"
        />
        <div className="ln-pdf-viewer-modal__fallback">
          <p>Unable to display the document inline.</p>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ln-btn ln-btn--regular"
          >
            Open / Download
          </a>
        </div>
      </div>
    </ModalContainer>
  );
}

export default PdfViewerModal;
