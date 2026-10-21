package com._42students.lms.dto.request;

import javax.validation.constraints.*;

public class DeactivateImageRequest {
    @NotBlank @Size(max = 255)
    private String learnerId;
    @NotBlank @Size(max = 255)
    private String imageId;

    public String getLearnerId() {
        return learnerId;
    }

    public void setLearnerId(String learnerId) {
        this.learnerId = learnerId;
    }

    public String getImageId() {
        return imageId;
    }

    public void setImageId(String imageId) {
        this.imageId = imageId;
    }
}

