package com._42students.lms.dto.response;


import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class Datum {
    private long points;
    private String title;
    /** Actual points the requesting learner scored for this content item; null when there is no submission yet. */
    private Long pointsObtained;
    /** Whether the requesting learner's submission for this content item has been graded. */
    private boolean graded;
}

