import React, { useState, useEffect } from "react";
import { EditFilled } from "@ant-design/icons";
import { Upload } from "antd";
import ImgCrop from "antd-img-crop";
import UploadFromLinkButton from "@/components/Global/Upload/UploadFromLinkButton";

function PencilUploadButton({ saveImage, saveImageFromLink, userId }) {
  const [fileList, setFileList] = useState([]);

  // Add labels to crop modal controls after it opens
  useEffect(() => {
    const addLabelsToCropModal = () => {
      const checkAndAddLabels = () => {
        // Find all modals that contain sliders
        const allModals = document.querySelectorAll('.ant-modal');
        let targetModal = null;
        
        // Find modal with at least one slider (crop modal)
        for (const modal of allModals) {
          const sliders = modal.querySelectorAll('.ant-slider');
          if (sliders.length > 0) {
            targetModal = modal;
            break;
          }
        }
        
        if (targetModal) {
          const sliders = targetModal.querySelectorAll('.ant-slider');
          
          if (sliders.length >= 2) {
            // Process zoom slider (first)
            const zoomSlider = sliders[0];
            const zoomParent = zoomSlider.parentElement;
            const zoomLabelExists = zoomSlider.previousElementSibling?.classList?.contains('crop-label');
            
            if (!zoomLabelExists) {
              const zoomLabel = document.createElement('div');
              zoomLabel.className = 'crop-label';
              zoomLabel.id = 'profile-crop-zoom-label';
              zoomLabel.textContent = 'Zoom';
              zoomLabel.style.cssText = 'font-size: 14px; font-weight: 500; color: rgba(0, 0, 0, 0.85); margin-bottom: 8px; display: block;';
              zoomParent.insertBefore(zoomLabel, zoomSlider);
            }
            const zoomLabel = zoomSlider.previousElementSibling?.classList?.contains('crop-label')
              ? zoomSlider.previousElementSibling
              : zoomParent.querySelector('.crop-label');
            if (zoomLabel && !zoomLabel.id) zoomLabel.id = 'profile-crop-zoom-label';
            zoomSlider.querySelector('[role="slider"]')?.setAttribute('aria-labelledby', zoomLabel?.id || 'profile-crop-zoom-label');
            
            // Process rotate slider (last)
            const rotateSlider = sliders[sliders.length - 1];
            const rotateParent = rotateSlider.parentElement;
            const rotateLabelExists = rotateSlider.previousElementSibling?.classList?.contains('crop-label');
            
            if (!rotateLabelExists) {
              const rotateLabel = document.createElement('div');
              rotateLabel.className = 'crop-label';
              rotateLabel.id = 'profile-crop-rotate-label';
              rotateLabel.textContent = 'Rotate';
              rotateLabel.style.cssText = 'font-size: 14px; font-weight: 500; color: rgba(0, 0, 0, 0.85); margin-bottom: 8px; margin-top: 16px; display: block;';
              rotateParent.insertBefore(rotateLabel, rotateSlider);
            }
            const rotateLabel = rotateSlider.previousElementSibling?.classList?.contains('crop-label')
              ? rotateSlider.previousElementSibling
              : rotateParent.querySelector('.crop-label');
            if (rotateLabel && !rotateLabel.id) rotateLabel.id = 'profile-crop-rotate-label';
            rotateSlider.querySelector('[role="slider"]')?.setAttribute('aria-labelledby', rotateLabel?.id || 'profile-crop-rotate-label');
          } else if (sliders.length === 1) {
            // Only one slider found - add zoom label
            const slider = sliders[0];
            const parent = slider.parentElement;
            const labelExists = slider.previousElementSibling?.classList?.contains('crop-label');
            
            if (!labelExists) {
              const zoomLabel = document.createElement('div');
              zoomLabel.className = 'crop-label';
              zoomLabel.id = 'profile-crop-zoom-label';
              zoomLabel.textContent = 'Zoom';
              zoomLabel.style.cssText = 'font-size: 14px; font-weight: 500; color: rgba(0, 0, 0, 0.85); margin-bottom: 8px; display: block;';
              parent.insertBefore(zoomLabel, slider);
            }
            const zoomLabel = slider.previousElementSibling?.classList?.contains('crop-label')
              ? slider.previousElementSibling
              : parent.querySelector('.crop-label');
            if (zoomLabel && !zoomLabel.id) zoomLabel.id = 'profile-crop-zoom-label';
            slider.querySelector('[role="slider"]')?.setAttribute('aria-labelledby', zoomLabel?.id || 'profile-crop-zoom-label');
          }
        }
      };

      // Use MutationObserver to detect when modal is opened
      const observer = new MutationObserver(() => {
        checkAndAddLabels();
      });

      // Check immediately with a small delay
      setTimeout(checkAndAddLabels, 200);

      // Observe changes to document body
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Also check periodically as a fallback
      const interval = setInterval(checkAndAddLabels, 400);

      return () => {
        observer.disconnect();
        clearInterval(interval);
      };
    };

    const cleanup = addLabelsToCropModal();
    return cleanup;
  }, []);

  const onChange = ({ fileList: newFileList, file }) => {
    setFileList(newFileList);
    
    // antd-img-crop processes the file and provides the cropped version
    // When file is added to the list, it's already cropped
    if (newFileList.length > 0 && file) {
      const currentFile = newFileList[0];
      // The cropped file is in originFileObj after user confirms crop
      // Check if file status is 'done' (uploaded) or if originFileObj exists
      if (currentFile.originFileObj && saveImage) {
        // Pass the cropped file to saveImage callback
        // Use a small delay to ensure the file is fully processed
        setTimeout(() => {
          saveImage(currentFile.originFileObj);
        }, 100);
      }
    } else if (newFileList.length === 0) {
      // File was removed
      setFileList([]);
    }
  };

  const onPreview = async (file) => {
    let src = file.url;
    if (!src) {
      src = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj);
        reader.onload = () => resolve(reader.result);
      });
    }
    const image = new Image();
    image.src = src;
    const imgWindow = window.open(src);
    imgWindow?.document.write(image.outerHTML);
  };

  // Custom request handler - prevents default upload behavior
  const customRequest = ({ onSuccess }) => {
    // We handle the file in onChange, so just mark as success
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };

  return (
    <div className="ln-pensil-upload">
      <ImgCrop
        aspect={1} // 1:1 aspect ratio (square)
        rotationSlider
        quality={1}
        zoomSlider
        modalTitle="Crop Profile Picture"
        modalOk="Save"
        modalCancel="Cancel"
        beforeCrop={(file) => {
          // Validate file type
          const isImage = file.type.startsWith('image/');
          if (!isImage) {
            return false;
          }
          // Validate file size (max 10MB)
          const isLt10M = file.size / 1024 / 1024 < 10;
          if (!isLt10M) {
            return false;
          }
          return true;
        }}
      >
        <Upload
          customRequest={customRequest}
          fileList={fileList}
          onChange={onChange}
          onPreview={onPreview}
          maxCount={1}
          accept="image/*"
          listType="picture-card"
          showUploadList={false}
          style={{ width: '100%', height: '100%' }}
        >
          <button
            type="button"
            className="ln-id-label d-flex align-items-center justify-content-center p-1 bg-white rounded-circle"
            aria-label="Upload profile picture"
            style={{
              width: 'auto',
              height: 'auto',
              minWidth: '40px',
              minHeight: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              aspectRatio: '1 / 1'
            }}
          >
        <EditFilled
          aria-hidden="true"
          style={{ fontSize: "1.2rem", cursor: "pointer", opacity: 1 }}
        />
          </button>
        </Upload>
      </ImgCrop>
      {saveImageFromLink && (
        <div className="mt-2">
          <UploadFromLinkButton
            folder="profile-images"
            type="image"
            userId={userId}
            onImported={saveImageFromLink}
            buttonProps={{ size: "small" }}
          >
            Drive image
          </UploadFromLinkButton>
        </div>
      )}
    </div>
  );
}

export default PencilUploadButton;
