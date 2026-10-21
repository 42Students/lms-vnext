package com._42students.lms.dto.response;

import java.util.List;
import com._42students.lms.model.ImageEntry;

public class StudentImageResponseDTO {

    private String learnerId;
    private List<ImageEntry> images;

    public String getLearnerId() {
        return learnerId;
    }

    public void setLearnerId(String learnerId) {
        this.learnerId = learnerId;
    }

    public List<ImageEntry> getImages() {
        return images;
    }

    public void setImages(List<ImageEntry> images) {
        this.images = images;
    }
}

