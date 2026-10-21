package com._42students.lms.dto.response;

import com._42students.lms.dto.request.LearnerDTO;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class LearnerResponseDTO extends LearnerDTO {
    private Integer learnerId; 
}
   
