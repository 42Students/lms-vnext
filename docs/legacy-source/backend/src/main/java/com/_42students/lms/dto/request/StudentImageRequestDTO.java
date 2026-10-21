package com._42students.lms.dto.request;

import javax.validation.constraints.*;
import java.util.List;

public class StudentImageRequestDTO {

    @NotBlank @Size(max = 255)
    private String learnerId;

    @NotNull
    @Size(min = 1, max = 10)
    private List<@NotBlank @Size(max = 2048) String> imageUrls;

    public String getLearnerId() {
        return learnerId;
    }

    public void setLearnerId(String learnerId) {
        this.learnerId = learnerId;
    }

    public List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }
}

