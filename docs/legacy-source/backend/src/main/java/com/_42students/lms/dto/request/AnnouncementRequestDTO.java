package com._42students.lms.dto.request;


import lombok.Data;
import com._42students.lms.enums.AnnouncementType;
import javax.validation.constraints.*;



@Data
public class AnnouncementRequestDTO {
    @NotNull
    private AnnouncementType idType;
    @NotNull @Min(1)
    private Long idValue;
    @NotBlank @Size(max = 255)
    private String message;
}

